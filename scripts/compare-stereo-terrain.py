"""Cross-instrument local DEM comparison with explicit common-LOLA-control limits."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import json,hashlib,urllib.request
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform,reproject,Resampling
from rasterio.windows import from_bounds,Window
from scripts.science_pipeline import ROOT,RAW,RADIUS,GEO,bilinear

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def confidence_supported(data,affine,x,y):
    """All four bilinear support pixels must be source-classed successful correlations."""
    col,row=(~affine)*(x,y);c=int(np.floor(col-.5));r=int(np.floor(row-.5))
    if r<0 or c<0 or r+1>=data.shape[0] or c+1>=data.shape[1]:return False
    values=data[r:r+2,c:c+2]
    return bool(np.isfinite(values).all() and ((values>=10)&(values<=14)).all())
def statistics(points):
    differences=np.array([p['nacHeightM']-p['pgdaHeightM'] for p in points]);slopes=np.array([p['nacSlopeDeg']-p['pgdaSlopeDeg'] for p in points if p['nacSlopeDeg'] is not None and p['pgdaSlopeDeg'] is not None and p.get('slopeConfidenceAccepted',True)])
    return {'coveredSamples':len(points),'expectedSamples':317,'meanHeightDifferenceM':float(differences.mean()) if len(points) else None,'heightRmseM':float(np.sqrt(np.mean(differences**2))) if len(points) else None,'medianHeightDifferenceM':float(np.median(differences)) if len(points) else None,'heightNmadM':float(1.4826*np.median(np.abs(differences-np.median(differences)))) if len(points) else None,'slopeSamples':len(slopes),'slopeRmseDeg':float(np.sqrt(np.mean(slopes**2))) if len(slopes) else None}
def main():
    folder=RAW/'terrain-evidence';science=json.loads((ROOT/'data/science/real-workspace.json').read_text());candidates=json.loads((folder/'stereo-candidates.json').read_text());out={'schema':'sitelight-stereo-cross-product-1','scienceSha256':digest(ROOT/'data/science/real-workspace.json'),'validatorSha256':digest(Path(__file__)),'footprintRadiusM':100,'slopeBaselineM':20,'sites':{k:[] for k in science['sites']},'sources':[]}
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR',CPL_VSIL_CURL_ALLOWED_EXTENSIONS='.TIF,.IMG',GDAL_HTTP_TIMEOUT=45,GDAL_HTTP_MAX_RETRY=2,GDAL_CACHEMAX=16*1024*1024):
        for record in candidates:
            url=record['tif'];name=record['product'];pds_base=url.rsplit('/',1)[0]+'/';readme=folder/(name+'-README.TXT')
            if not readme.exists():readme.write_bytes(urllib.request.urlopen(pds_base+(name if name.startswith('NAC_DTM_') else 'NAC_DTM_'+name)+'_README.TXT',timeout=30).read())
            with rasterio.open(url) as src:
                if abs(src.crs.to_dict().get('R',src.crs.to_dict().get('a',0))-RADIUS)>1e-6:raise ValueError('Unexpected reference sphere')
                for identifier,entry in science['sites'].items():
                    site=entry['site'];x,y=transform(GEO,src.crs,[site['lon']],[site['lat']]);x,y=x[0],y[0];r,c=src.index(x,y)
                    if not (0<=r<src.height and 0<=c<src.width):continue
                    path=folder/(name+'-'+identifier+'.npz');meta=folder/(name+'-'+identifier+'.json')
                    window=from_bounds(x-400,y-400,x+400,y+400,src.transform).round_offsets().round_lengths().intersection(Window(0,0,src.width,src.height))
                    if path.exists() and meta.exists():
                        info=json.loads(meta.read_text())
                        if info['subsetSha256']!=digest(path):raise ValueError('Changed stereo subset')
                        a=np.load(path)['elevationM'];affine=rasterio.Affine(*info['affine'])
                    else:
                        a=src.read(1,window=window,masked=True).filled(np.nan);affine=src.window_transform(window);np.savez_compressed(path,elevationM=a)
                        info={'url':url,'product':name,'subsetFile':str(path.relative_to(ROOT)).replace('\\','/'),'subsetSha256':digest(path),'affine':list(affine)[:6],'shape':list(a.shape),'sourcePixelM':list(src.res),'readmeFile':str(readme.relative_to(ROOT)).replace('\\','/'),'readmeSha256':digest(readme),'wholeRemoteSha256':None,'window':[int(window.col_off),int(window.row_off),int(window.width),int(window.height)]};meta.write_text(json.dumps(info,indent=2)+'\n')
                    if not np.isfinite(a).any():continue
                    # Use raw PDS classes, never the display-stretched browse TIFF.
                    conf_url=url[:-4]+'_CONF.IMG';conf_path=folder/(name+'-'+identifier+'-confidence-pds.npz')
                    if conf_path.exists() and info.get('confidence',{}).get('url')==conf_url:
                        if digest(conf_path)!=info['confidence']['subsetSha256']:raise ValueError('Changed retained confidence window')
                        confidence=np.load(conf_path)['classes']
                    else:
                        with rasterio.open(conf_url) as conf:
                            if conf.crs.to_dict()!=src.crs.to_dict() or conf.res!=src.res or conf.width!=src.width or conf.height!=src.height:raise ValueError('Unexpected confidence reference system/grid')
                            bounds=rasterio.windows.bounds(window,src.transform);cw=from_bounds(*bounds,conf.transform).round_offsets().round_lengths().intersection(Window(0,0,conf.width,conf.height))
                            raw_confidence=conf.read(1,window=cw,masked=True).astype('float32').filled(np.nan);confidence=np.full(a.shape,np.nan,dtype='float32');source_affine=conf.window_transform(cw)
                            reproject(source=raw_confidence,destination=confidence,src_transform=source_affine,src_crs=conf.crs,src_nodata=np.nan,dst_transform=affine,dst_crs=src.crs,dst_nodata=np.nan,resampling=Resampling.nearest)
                        if np.any(np.isfinite(confidence)&((confidence<0)|(confidence>15)|(confidence!=np.floor(confidence)))):raise ValueError('Confidence source does not contain raw categorical classes')
                        np.savez_compressed(conf_path,classes=confidence,sourceClasses=raw_confidence)
                        info['confidence']={'url':conf_url,'subsetFile':str(conf_path.relative_to(ROOT)).replace('\\','/'),'subsetSha256':digest(conf_path),'wholeRemoteSha256':None,'sourceAffine':list(source_affine)[:6],'targetAffine':list(affine)[:6],'alignment':'Nearest-neighbor categorical resampling from raw PDS georeferencing to DTM grid. No fitted registration or browse-image grayscale interpretation. Source/header registration remains a review limit.','policy':'All four bilinear supports must be successful source correlations (classes 10-14). Classes 0-4 and manually edited 15 excluded. Not a calibrated probability.'}
                        meta.write_text(json.dumps(info,indent=2)+'\n')
                    if confidence.shape!=a.shape:raise ValueError('Incomplete confidence subset')
                    with rasterio.open(RAW/'terrain'/f"{site['tile']}_surf.tif") as nominal:
                        native=nominal.read(1,masked=True).filled(np.nan);native_affine=nominal.transform
                    scale=entry['terrain']['grid']['projectionScale'];points=[]
                    for j in range(-10,11):
                        for i in range(-10,11):
                            if i*i+j*j>100:continue
                            gx,gz=i*10,j*10;px=x+gx*scale;py=y+gz*scale
                            def sample(data,aff,dx=0,dy=0):return float(bilinear(data,aff,px+dx*scale,py+dy*scale))
                            z_ref=sample(a,affine);z_nom=sample(native,native_affine)
                            if not np.isfinite(z_ref) or not np.isfinite(z_nom):continue
                            slopes=[]
                            for data,aff in [(a,affine),(native,native_affine)]:
                                dx=(sample(data,aff,10,0)-sample(data,aff,-10,0))/20;dy=(sample(data,aff,0,10)-sample(data,aff,0,-10))/20;slopes.append(float(np.degrees(np.arctan(np.hypot(dx,dy)))))
                            center_ok=confidence_supported(confidence,affine,px,py);slope_ok=center_ok and all(confidence_supported(confidence,affine,px+dx*scale,py+dy*scale) for dx,dy in [(10,0),(-10,0),(0,10),(0,-10)])
                            points.append({'xM':gx,'zM':gz,'pgdaHeightM':z_nom,'nacHeightM':z_ref,'pgdaSlopeDeg':slopes[1] if np.isfinite(slopes[1]) else None,'nacSlopeDeg':slopes[0] if np.isfinite(slopes[0]) else None,'heightConfidenceAccepted':center_ok,'slopeConfidenceAccepted':slope_ok})
                    if not points:continue
                    qualified=[p for p in points if p['heightConfidenceAccepted']]
                    result={'product':name,**statistics(qualified),'rawFiniteHeightSamples':len(points),'confidenceRejectedHeightSamples':len(points)-len(qualified),'points':points,'acceptedAbsoluteAccuracy':False,'qualityMaskApplied':True,'confidencePolicy':info['confidence']['policy'],'interpretation':'Image-stereo vs laser-derived terrain at common coordinates/baseline; no bias fit or shift applied. Source-confidence classes 10-14 required for all interpolation supports. Both use LOLA control; remaining image artifacts and independent absolute truth remain open.'}
                    out['sites'][identifier].append(result);out['sources'].append(info);print(identifier,name,{k:v for k,v in result.items() if k not in ['points','interpretation']},flush=True)
    out['limits']=['No matching stereo data is substituted for an uncovered point','Shared LOLA geodetic control prevents claiming fully independent absolute ground truth','NAC source-confidence classes 10-14 are required at every interpolation support; this filter cannot remove all jitter, seams or geolocation differences','Coverage/statistics are not a landing-safety or approved accuracy verdict']
    (ROOT/'docs/STEREO_TERRAIN_COMPARISON.json').write_text(json.dumps(out,indent=2)+'\n')
if __name__=='__main__':main()
