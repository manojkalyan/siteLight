"""Reproducible local DEM/DE421 preprocessing. No browser or remote runtime dependency."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import math
import platform
from pathlib import Path
import time
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import numpy as np
import rasterio
rasterio.env.set_gdal_config('GDAL_CACHEMAX',32*1024*1024)
from rasterio.warp import transform
import spiceypy as spice

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data' / 'raw'
RADIUS = 1737400.0
GEO = f'+proj=longlat +a={RADIUS} +b={RADIUS} +no_defs'
FRAME = 'MOON_ME'
START = dt.datetime(2027, 1, 1, tzinfo=dt.timezone.utc)
END = dt.datetime(2027, 4, 1, tzinfo=dt.timezone.utc)

def file_sha256(path):
    with path.open('rb') as source:return hashlib.file_digest(source,'sha256').hexdigest()

def basis(lat: float, lon: float):
    p, l = np.radians([lat, lon])
    return np.array([[-np.sin(l), np.cos(l), 0],
                     [-np.sin(p)*np.cos(l), -np.sin(p)*np.sin(l), np.cos(p)],
                     [np.cos(p)*np.cos(l), np.cos(p)*np.sin(l), np.sin(p)]])

def angles(vector, enu):
    local = np.asarray(vector) @ enu.T
    return np.degrees(np.arctan2(local[..., 0], local[..., 1])) % 360, np.degrees(np.arctan2(local[..., 2], np.hypot(local[..., 0], local[..., 1])))

def bilinear(data, affine, x, y):
    """Rasterio affine locates the pixel corner; sample centers are offset by half a pixel."""
    inv = ~affine
    col = inv.a*np.asarray(x)+inv.b*np.asarray(y)+inv.c-.5
    row = inv.d*np.asarray(x)+inv.e*np.asarray(y)+inv.f-.5
    c = np.floor(col).astype(int); r = np.floor(row).astype(int)
    valid = (c >= 0) & (r >= 0) & (c+1 < data.shape[1]) & (r+1 < data.shape[0])
    cc=np.clip(c,0,data.shape[1]-2); rr=np.clip(r,0,data.shape[0]-2)
    dx=col-c; dy=row-r
    a=data[rr,cc]; b=data[rr,cc+1]; d=data[rr+1,cc]; e=data[rr+1,cc+1]
    out=(a*(1-dx)+b*dx)*(1-dy)+(d*(1-dx)+e*dx)*dy
    return np.where(valid & np.isfinite(a+b+d+e),out,np.nan)

def _horizon_block(data, affine, crs, lat, lon, surface_height, observer_height=2.0, extent=7000.0, step=5.0, start=None, height_rms=None, observer_rms=0.0, azimuths=None):
    enu=basis(lat,lon); up=enu[2]; observer=up*(RADIUS+surface_height+observer_height)
    azimuth=np.radians(np.arange(360) if azimuths is None else azimuths)[:,None]
    distances=np.arange(step if start is None else start,extent+step/2,step)[None,:]
    tangent=np.sin(azimuth)[...,None]*enu[0]+np.cos(azimuth)[...,None]*enu[1]
    normals=np.cos(distances/RADIUS)[...,None]*up+np.sin(distances/RADIUS)[...,None]*tangent
    lats=np.degrees(np.arcsin(normals[...,2])); lons=np.degrees(np.arctan2(normals[...,1],normals[...,0]))
    x,y=transform(GEO,crs,lons.ravel().tolist(),lats.ravel().tolist())
    heights=bilinear(data,affine,np.asarray(x),np.asarray(y)).reshape(lats.shape)
    def elevations(h, observer_offset=0):
        vectors=normals*(RADIUS+h)[...,None]-(observer+up*observer_offset)
        return np.degrees(np.arctan2(vectors@up,np.hypot(vectors@enu[0],vectors@enu[1])))
    elevation=elevations(heights)
    complete=np.isfinite(elevation).all(axis=1)
    safe=np.where(np.isfinite(elevation),elevation,-np.inf)
    maximum=safe.max(axis=1)
    distances_at_max=distances[0,safe.argmax(axis=1)]
    out={'azimuthStepDeg':1,'elevationDeg':[round(float(v),6) if ok else None for v,ok in zip(maximum,complete)],
            'rayCoverage':[round(float(v),6) for v in np.isfinite(elevation).mean(axis=1)],
            'distanceAtMaxM':[float(v) for v in distances_at_max],
            'extentM':extent,'radialStepM':step,'observerHeightM':observer_height,
            'method':'Spherical great-circle rays; bilinear DEM; 3D lunar curvature; body-center visibility; no refraction',
            'farFieldAssessed':False,'uncertaintyPropagated':False,
            'limitations':['Terrain beyond the declared ray extent is not assessed','One-degree azimuth interpolation can miss narrow peaks','Height uncertainties are provided, not propagated through correlated horizon errors']}
    if height_rms is not None:
        sigma=bilinear(height_rms,affine,np.asarray(x),np.asarray(y)).reshape(lats.shape)
        valid=complete & np.isfinite(sigma).all(axis=1) & (sigma>=0).all(axis=1)
        out['sensitivity']={'lowerDeg':[round(float(v),6) if ok else None for v,ok in zip(np.max(elevations(heights-sigma,observer_rms),axis=1),valid)],
                            'upperDeg':[round(float(v),6) if ok else None for v,ok in zip(np.max(elevations(heights+sigma,-observer_rms),axis=1),valid)],
                            'sourceRmsMultiplier':1,'observerHeightRmsM':float(observer_rms),
                            'interpretation':'Componentwise +/- one interpolated source height RMS with opposite observer perturbation; sensitivity scenarios, not statistical confidence bounds. Spatial covariance, interpolation/model bias and unresolved peaks are not propagated.'}
    return out

def horizon_from_dem(data, affine, crs, lat, lon, surface_height, observer_height=2.0, extent=7000.0, step=5.0, start=None, height_rms=None, observer_rms=0.0, azimuth_step=1.0):
    """Batch rays to bound transient arrays as angular/radial sampling increases."""
    if azimuth_step not in (1,.5,.25):raise ValueError('Unsupported horizon angular spacing')
    azimuths=np.arange(0,360,azimuth_step);output=None
    for first in range(0,len(azimuths),24):
        block=_horizon_block(data,affine,crs,lat,lon,surface_height,observer_height,extent,step,start,height_rms,observer_rms,azimuths[first:first+24])
        if output is None:output=block
        else:
            for key in ['elevationDeg','rayCoverage','distanceAtMaxM']:output[key].extend(block[key])
            if height_rms is not None:
                for key in ['lowerDeg','upperDeg']:output['sensitivity'][key].extend(block['sensitivity'][key])
    output['azimuthStepDeg']=azimuth_step;output['azimuthCount']=len(azimuths);output['batchRays']=24
    output['limitations'][1]='Finite azimuth interpolation and radial sampling can miss narrow peaks'
    return output

def combine_horizons(near,far):
    """Keep missing sectors unknown; both sampled radial domains must be complete."""
    if len(near['elevationDeg'])!=len(far['elevationDeg']) or near.get('azimuthStepDeg',1)!=far.get('azimuthStepDeg',1):raise ValueError('Mismatched horizon azimuth sampling')
    def maxima(a,b):return [round(max(x,y),6) if x is not None and y is not None else None for x,y in zip(a,b)]
    out={**near,'elevationDeg':maxima(near['elevationDeg'],far['elevationDeg']),
         'rayCoverage':[min(a,b) for a,b in zip(near['rayCoverage'],far['rayCoverage'])],
         'distanceAtMaxM':[far['distanceAtMaxM'][i] if a is not None and b is not None and b>a else near['distanceAtMaxM'][i] for i,(a,b) in enumerate(zip(near['elevationDeg'],far['elevationDeg']))],
         'extentM':far['extentM'],'radialStepM':None,'nearFieldExtentM':near['extentM'],
         'samplingBands':[{'startM':near['radialStepM'],'endM':near['extentM'],'stepM':near['radialStepM'],'pixelSpacingM':5},
                          {'startM':near['extentM'],'endM':far['extentM'],'stepM':far['radialStepM'],'pixelSpacingM':80}],
         'farFieldAssessed':True,'farFieldComplete':False,
         'limitations':['Terrain beyond the declared extent is unassessed; this is not a global horizon','Finite azimuth / radial sampling and 80 m far-field pixels can miss peaks','Source RMS perturbations are sensitivity scenarios, not confidence bounds; correlated uncertainty remains unassessed']}
    if near.get('sensitivity') and far.get('sensitivity'):
        out['sensitivity']={**near['sensitivity'],'lowerDeg':maxima(near['sensitivity']['lowerDeg'],far['sensitivity']['lowerDeg']),
                            'upperDeg':maxima(near['sensitivity']['upperDeg'],far['sensitivity']['upperDeg'])}
    return out

def json_grid(a):
    return [round(float(v),4) if np.isfinite(v) else None for v in a.ravel()]

def prepare_site(tile, id_, name, far_field=None):
    with rasterio.open(RAW/'terrain'/f'{tile}_surf.tif') as src:
        if abs(src.transform.a-5)>1e-9 or abs(src.transform.e+5)>1e-9 or src.transform.b or src.transform.d:raise ValueError('Unexpected source pixel spacing / rotation')
        data=src.read(1,masked=True).filled(np.nan)
        # Data-derived study point, not an attributed mission landing location.
        row,col=src.height//2,src.width//2
        x,y=src.xy(row,col); lon,lat=transform(src.crs,GEO,[x],[y]); lon,lat=float(lon[0]),float(lat[0])
        h=float(data[row,col])
        if not np.isfinite(h) or abs(h)>20000: raise ValueError('Unknown elevation interpretation / missing central cell')
        observer_height=2.0
        site={'id':id_,'name':name,'lat':lat,'lon':lon,'altKm':(h+observer_height)/1000,'polar':True,
              'surfaceElevationM':h,'observerHeightM':observer_height,'tile':tile,'source':'https://pgda.gsfc.nasa.gov/products/78',
              'coordinateStatus':f'Derived center of {tile} pixel row {row}, column {col}; study point, not a certified landing site',
              'frame':'MOON_ME / DE421; spherical reference radius 1737400 m',
              'projectedPointM':[float(x),float(y)],'sourcePixel':[row,col]}
        with rasterio.open(RAW/'terrain'/f'{tile}_toterr.tif') as product:
            if product.transform!=src.transform or product.shape!=src.shape:raise ValueError('Unaligned height RMS')
            height_rms=product.read(1,masked=True).filled(np.nan)
        observer_rms=float(height_rms[row,col])
        horizon=horizon_from_dem(data,src.transform,src.crs,lat,lon,h,observer_height,step=2.5,height_rms=height_rms,observer_rms=observer_rms,azimuth_step=.5)
        local_horizon=horizon
        if far_field is not None:
            far=horizon_from_dem(far_field['height'],far_field['affine'],far_field['crs'],lat,lon,h,observer_height,extent=125000,step=40,start=7000,height_rms=far_field['rms'],observer_rms=observer_rms,azimuth_step=.5)
            horizon=combine_horizons(local_horizon,far)
            fx,fy=transform(GEO,far_field['crs'],[lon],[lat])
            horizon['crossProductCenterDeltaM']=float(bilinear(far_field['height'],far_field['affine'],fx[0],fy[0])-h)
            horizon['farFieldSource']='https://pgda.gsfc.nasa.gov/products/90'
            horizon['farFieldRaisesSectors']=sum(a is not None and b is not None and b>a+1e-6 for a,b in zip(local_horizon['elevationDeg'],horizon['elevationDeg']))
        if not all(v==1 for v in horizon['rayCoverage']): raise ValueError('Study horizon has incomplete ray coverage')
        half=104; window=(slice(row-half,row+half+1),slice(col-half,col+half+1))
        patch=data[window]
        grid={'size':int(patch.shape[0]),'spacingM':5,'originX':-half*5,'originY':half*5,
              'projectionScale':2/(1-math.sin(math.radians(lat))), 'elevationM':json_grid(patch),
              'mapReference':'Local offsets in source polar-stereographic axes; grid north is not celestial azimuth north'}
        for suffix,key in [('toterr','heightRmsM'),('slperr','publishedSlopeRmsDeg')]:
            with rasterio.open(RAW/'terrain'/f'{tile}_{suffix}.tif') as product:
                if product.transform!=src.transform or product.shape!=src.shape: raise ValueError('Unaligned terrain products')
                values=product.read(1,masked=True).filled(np.nan)
                grid[key]=json_grid(values[window])
        metadata={'sourceCrsWkt':src.crs.to_wkt(),'affine':list(src.transform)[:6],'boundsM':list(src.bounds),
                  'pixelSpacingM':[5,5],'sourceSize':[src.width,src.height],'noData':'NaN','heightReference':'Surface height in meters above 1737400 m sphere, MOON_ME / DE421',
                  'sourcePixelRegistration':'Rasterio pixel centers (corner affine + 0.5 pixel); PGDA README pixel-registered convention',
                  'sampling':'Bilinear interpolation requires all four finite neighbors; missing values are not filled'}
        # Known plane/grid and inverse-projection checks exercise separate operations.
        px,py=transform(GEO,src.crs,[lon],[lat]); residual=math.hypot(px[0]-x,py[0]-y)
        if residual>1e-4: raise ValueError('Projection round trip failed')
        metadata['projectionRoundtripErrorM']=residual
        return site,{'horizon':horizon,'localHorizon':local_horizon,'grid':grid,'metadata':metadata}

def geometric_series(site,epochs,ets):
    enu=basis(site['lat'],site['lon']); observer=enu[2]*(RADIUS/1000+site['altKm'])
    targets=[]
    for body in ['SUN','EARTH']:
        vectors,_=spice.spkpos(body,ets,FRAME,'NONE','MOON')
        az,el=angles(np.asarray(vectors)-observer,enu);targets.append((az,el))
    rows=[[int(t.timestamp()*1000),round(float(targets[0][0][i]),6),round(float(targets[0][1][i]),6),round(float(targets[1][0][i]),6),round(float(targets[1][1][i]),6)] for i,t in enumerate(epochs)]
    # Same kernels, independent transformation code path: not external scientific certification.
    errors=[]
    for index in [0,len(ets)//2,len(ets)-1]:
        for j,body in enumerate(['SUN','EARTH']):
            inertial,_=spice.spkpos(body,float(ets[index]),'J2000','NONE','MOON')
            rotated=spice.pxform('J2000',FRAME,float(ets[index]))@inertial
            az,el=angles(rotated-observer,enu)
            errors.append(max(abs(float(el)-targets[j][1][index]),abs((float(az)-targets[j][0][index]+180)%360-180)))
    if max(errors)>1e-8: raise ValueError('Independent transform path disagrees')
    return rows,max(errors)

def external_geometry_check(site,reference):
    enu=basis(site['lat'],site['lon']); observer=enu[2]*(RADIUS/1000+site['altKm']); report={}
    for body,rows in reference['targets'].items():
        errors=[];positions=[]
        for row in rows:
            utc=dt.datetime.fromtimestamp(row[0]/1000,tz=dt.timezone.utc)
            et=spice.str2et(utc.strftime('%Y %b %d %H:%M:%S UTC'))
            direct,_=spice.spkpos(body,et,FRAME,'NONE','MOON')
            direct_j2000,_=spice.spkpos(body,et,'J2000','NONE','MOON')
            external=spice.pxform('J2000',FRAME,et)@np.array(row[1:])
            az,el=angles(direct-observer,enu);az_ref,el_ref=angles(external-observer,enu)
            errors.append(max(abs(float(el-el_ref)),abs((float(az-az_ref)+180)%360-180)))
            positions.append(float(np.linalg.norm(np.array(row[1:])-direct_j2000)))
        threshold=reference['thresholds']['sunAngularDeg' if body=='SUN' else 'earthAngularDeg']
        if max(errors)>threshold:raise ValueError('External geometric reference exceeded predeclared tolerance: '+body)
        report[body]={'maxAngularErrorDeg':max(errors),'toleranceDeg':threshold,'maxPositionDeltaKm':max(positions),'epochs':len(rows),'passed':True}
    return report

def main():
    begin=time.perf_counter()
    manifest=json.loads((ROOT/'data/science-inputs.json').read_text())
    reference=json.loads((ROOT/'data/validation/reference-vectors.json').read_text())
    orientation=json.loads((ROOT/'data/validation/orientation-report.json').read_text())
    if not orientation['passed'] or orientation['algorithm']['sha256']!=hashlib.sha256((ROOT/'scripts/validate-orientation.py').read_bytes()).hexdigest():raise ValueError('Orientation validation must be rerun')
    thermal_path=ROOT/'data/science/thermal-context.json'
    thermal=json.loads(thermal_path.read_text(encoding='utf-8')) if thermal_path.exists() else None
    if thermal:
        for record in [thermal['algorithm'],*thermal['algorithm'].get('dependencies',[])]:
            if file_sha256(ROOT/record['file'])!=record['sha256']:raise ValueError('Thermal extraction must be rerun')
        for record in json.loads((ROOT/'data/thermal-inputs.json').read_text())['records']:
            if file_sha256(RAW/'thermal'/record['name'])!=record['sha256']:raise ValueError('Thermal input checksum changed')
    for record in reference['sources']+[s for e in orientation['sites'].values() for s in e['sources']]:
        if file_sha256(ROOT/'data/validation'/record['name'])!=record['sha256']:raise ValueError('External reference checksum changed')
    for record in manifest['records']:
        path=RAW/record['name']
        if file_sha256(path)!=record['sha256']: raise ValueError('Source checksum changed: '+record['name'])
    spice.kclear()
    for filename in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/filename))
    count=int((END-START).total_seconds()/600)+1
    epochs=[START+dt.timedelta(seconds=600*i) for i in range(count)]
    ets=np.array([spice.str2et(t.strftime('%Y %b %d %H:%M:%S UTC')) for t in epochs])
    with rasterio.open(RAW/'terrain/LDEM_80S_80MPP_ADJ.TIF') as far, rasterio.open(RAW/'terrain/LDEM_80S_80MPP_ADJ_ERR.TIF') as error:
        if far.crs!=error.crs or far.transform!=error.transform or far.shape!=error.shape:raise ValueError('Unaligned far-field products')
        projection=far.crs.to_dict()
        if abs(far.transform.a-80)>1e-8 or abs(projection.get('R',projection.get('a',0))-RADIUS)>1e-6:raise ValueError('Incompatible far-field projection / radius')
        far_field={'height':far.read(1,masked=True).filled(np.nan),'rms':error.read(1,masked=True).filled(np.nan),'affine':far.transform,'crs':far.crs}
    output={'schema':'sitelight-real-science-1','version':'dem-de421-4','frame':FRAME,'ephemeris':'DE421',
        'interval':{'start':START.isoformat().replace('+00:00','Z'),'end':END.isoformat().replace('+00:00','Z'),'stepMinutes':10},
        'convention':'Geometric body-center Sun/Earth positions, aberration NONE; MOON_ME / DE421; topocentric east/north/radial-up; azimuth clockwise from north; no refraction',
        'timeChain':'UTC via naif0012.tls -> ET/TDB -> DE421 SPK + lunar binary PCK/FK -> MOON_ME -> observer ENU',
        'validation':'Analytic fixtures, projection round-trip, independent transform path, external Horizons inertial-vector checks and 18 independent apparent AZ/EL cases at three study points; global horizon/correlated uncertainty and broader scientific review pending',
        'externalReferences':reference['sources']+[s for e in orientation['sites'].values() for s in e['sources']],
        'orientationValidation':orientation,'thermalPreprocessing':thermal['algorithm'] if thermal else None,
        'algorithm':{'file':'scripts/science_pipeline.py','sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
        'runtime':{'python':platform.python_version(),'numpy':np.__version__,'rasterio':rasterio.__version__,'spiceypy':spice.__version__},
        'inputs':manifest['records'],'sites':{}}
    for tile,id_,name in [('Site04','real-shackleton','Shackleton · DEM study point'),('Site01','real-connector','Connecting ridge · DEM study point'),('Site11','real-gerlache','de Gerlache · DEM study point'),('Site06','real-nobile','Nobile · DEM study point'),('Site07','real-peak','Peak near Shackleton · DEM study point'),('Site23','real-malapert','Malapert · DEM study point')]:
        tick=time.perf_counter();site,terrain=prepare_site(tile,id_,name,far_field);records,error=geometric_series(site,epochs,ets)
        if id_ in orientation['sites'] and any(abs(site[k]-orientation['sites'][id_]['coordinates'][k])>1e-10 for k in ['lat','lon','altKm']):raise ValueError('Orientation cases use a different observer')
        sources=[r for r in manifest['records'] if r['name'].startswith('kernels/') or r['name'].startswith('terrain/'+tile) or r['name'].startswith('terrain/LDEM_80S')]
        output['sites'][id_]={'site':site,'coordinates':{k:site[k] for k in ['lat','lon','altKm']},'records':records,'terrain':terrain,'sources':sources,'transformPathMaxErrorDeg':error,'externalGeometryCheck':external_geometry_check(site,reference),
                             'externalOrientationCheck':orientation['sites'].get(id_,{}).get('checks'),'thermalContext':thermal['sites'].get(id_) if thermal else None}
        print(id_,site['lat'],site['lon'],site['surfaceElevationM'],'seconds',round(time.perf_counter()-tick,2),flush=True)
    folder=ROOT/'data/science';folder.mkdir(exist_ok=True)
    encoded=json.dumps(output,separators=(',',':'),allow_nan=False,ensure_ascii=False)
    temporary=folder/'real-workspace.partial';temporary.write_text(encoded,encoding='utf-8');temporary.replace(folder/'real-workspace.json')
    summary={'schema':output['schema'],'version':output['version'],'bytes':len(encoded.encode()),'sha256':hashlib.sha256(encoded.encode()).hexdigest(),
             'buildSeconds':time.perf_counter()-begin,'sites':[{**e['site'],'horizonExtentM':e['terrain']['horizon']['extentM'],'transformPathMaxErrorDeg':e['transformPathMaxErrorDeg']} for e in output['sites'].values()]}
    (folder/'build-report.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False),encoding='utf-8')
    print('Prepared real terrain / geometric series:',len(encoded.encode()),'bytes',flush=True)

if __name__=='__main__':main()
