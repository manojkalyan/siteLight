"""Bounded sampling convergence audit; independent angular/radial sampling, not flight certification."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import json,math,hashlib,time
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform
from rasterio.windows import from_bounds,Window
from scripts.science_pipeline import ROOT,RAW,RADIUS,GEO,basis,bilinear,file_sha256

def rays(data,affine,crs,site,start,end,step,azimuths):
    enu=basis(site['lat'],site['lon']);up=enu[2];observer=up*(RADIUS+site['surfaceElevationM']+site['observerHeightM']);distances=np.arange(start,end+step/2,step)[None,:];out=[]
    for first in range(0,len(azimuths),12):
        az=np.radians(azimuths[first:first+12])[:,None]
        direction=np.sin(az)[...,None]*enu[0]+np.cos(az)[...,None]*enu[1]
        normal=np.cos(distances/RADIUS)[...,None]*up+np.sin(distances/RADIUS)[...,None]*direction
        lat=np.degrees(np.arcsin(normal[...,2]));lon=np.degrees(np.arctan2(normal[...,1],normal[...,0]))
        x,y=transform(GEO,crs,lon.ravel().tolist(),lat.ravel().tolist());height=bilinear(data,affine,np.array(x),np.array(y)).reshape(lat.shape)
        vectors=normal*(RADIUS+height)[...,None]-observer
        el=np.degrees(np.arctan2(vectors@up,np.hypot(vectors@enu[0],vectors@enu[1])))
        if not np.isfinite(el).all():raise ValueError('Missing validation ray coverage')
        out.extend(np.max(el,axis=1).tolist())
    return np.array(out)

def main():
    begin=time.perf_counter();science=json.loads((ROOT/'data/science/real-workspace.json').read_text(encoding='utf-8'))
    for record in science['inputs']:
        if file_sha256(RAW/record['name'])!=record['sha256']:raise ValueError('Pinned raw source checksum mismatch: '+record['name'])
    report={'schema':'sitelight-sampling-audit-1','algorithmSha256':file_sha256(Path(__file__)),'scienceVersion':science['version'],'scienceSha256':file_sha256(ROOT/'data/science/real-workspace.json'),
            'recipe':'1440 azimuths at 0.25 degree; local radial 1.25 m versus production 2.5 m; far-field radial 20 m versus production 40 m; same source rasters, observer and 125 km extent',
            'diagnosticThresholdDeg':.1,'thresholdMeaning':'Diagnostic review trigger, not an approved mission accuracy tolerance','globalHorizonValidated':False,'correlatedUncertaintyValidated':False,'sites':{}}
    rasterio.env.set_gdal_config('GDAL_CACHEMAX',32*1024*1024)
    az=np.arange(0,360,.25)
    for id_ in science['sites']:
        entry=science['sites'][id_];site=entry['site'];x,y=site['projectedPointM']
        with rasterio.open(RAW/'terrain'/f"{site['tile']}_surf.tif") as src:
            near=rays(src.read(1,masked=True).filled(np.nan),src.transform,src.crs,site,1.25,7000,1.25,az)
        with rasterio.open(RAW/'terrain/LDEM_80S_80MPP_ADJ.TIF') as src:
            window=from_bounds(x-128000,y-128000,x+128000,y+128000,src.transform).round_offsets().round_lengths().intersection(Window(0,0,src.width,src.height))
            far=rays(src.read(1,window=window,masked=True).filled(np.nan),src.window_transform(window),src.crs,site,7000,125000,20,az)
        fine=np.maximum(near,far);coarse=np.array(entry['terrain']['horizon']['elevationDeg']);interpolated=np.interp(az,np.arange(len(coarse)+1)*360/len(coarse),np.append(coarse,coarse[0]));error=np.abs(fine-interpolated)
        def values(array,targetAz):return np.interp(np.array(targetAz)%360,np.arange(len(array)+1)*360/len(array),np.append(array,array[0]))
        rows=np.array(entry['records']);angles=rows[:,[1,3]];nominal=np.column_stack([values(coarse,angles[:,i]) for i in range(2)]);dense=np.column_stack([values(fine,angles[:,i]) for i in range(2)])
        # Body-center geometric visibility only; entire packaged Jan-Mar record set, not a mission-rule verdict.
        elevations=rows[:,[2,4]];changed=(elevations>nominal)!=(elevations>dense)
        result={'azimuths':len(az),'maxDifferenceDeg':float(error.max()),'p95DifferenceDeg':float(np.percentile(error,95)),
                'maxAtProductionAzimuthDifferenceDeg':float(np.max(np.abs(fine[::2]-coarse))),
                'sectorsAboveDiagnosticThreshold':int((error>.1).sum()),'maxDifferenceAzimuthDeg':float(az[error.argmax()]),
                'geometricVisibilityChangedRows':{'sun':int(changed[:,0].sum()),'earth':int(changed[:,1].sum())},'packagedRowsCompared':len(rows),
                'denseHorizonDeg':[round(float(v),6) for v in fine],'status':'needs_sampling_review' if error.max()>.1 else 'within_diagnostic_threshold'}
        report['sites'][id_]=result;print(id_,{k:v for k,v in result.items() if k!='denseHorizonDeg'},flush=True)
    report['seconds']=time.perf_counter()-begin
    (ROOT/'docs/HORIZON_SAMPLING_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':main()
