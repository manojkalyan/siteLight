"""Sample a wider sourced polar annulus and evaluate a conditional spherical exclusion bound."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import json,hashlib,urllib.request,shutil,math,time,concurrent.futures,threading
from pathlib import Path
import numpy as np
import rasterio
from rasterio.warp import transform
from rasterio.windows import from_bounds,Window
from scripts.science_pipeline import ROOT,RAW,RADIUS,GEO,horizon_from_dem

def outside_elevation_bound(observer_radius,maximum_terrain_radius,cutoff_m):
    """Supremum beyond cutoff on spheres, conditional on the declared radius ceiling."""
    theta=cutoff_m/RADIUS
    if not 0<theta<math.pi or observer_radius<=0 or maximum_terrain_radius<=0:raise ValueError('Invalid spherical bound')
    if observer_radius>maximum_terrain_radius:theta=max(theta,math.acos(maximum_terrain_radius/observer_radius))
    return math.degrees(math.atan2(maximum_terrain_radius*math.cos(theta)-observer_radius,maximum_terrain_radius*math.sin(theta)))

def main():
    url='https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_60S_240MPP_ADJ.TIF';folder=RAW/'terrain-evidence';folder.mkdir(exist_ok=True)
    path=folder/'LDEM_60S_240MPP_ADJ.TIF';manifest=folder/'farfield-source.json'
    if not path.exists():
        with urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=30) as response:size=int(response.headers['Content-Length']);etag=response.headers.get('etag')
        if size>240*1024**2 or shutil.disk_usage(ROOT).free<size+350*1024**2:raise ValueError('Insufficient bounded disk budget for this source; no files removed')
        temporary=path.with_suffix('.partial');lock=threading.Lock();ranges=[(a,min(a+2*1024**2-1,size-1)) for a in range(0,size,2*1024**2)]
        with temporary.open('w+b') as target:
            target.truncate(size)
            def chunk(bounds):
                a,b=bounds
                for attempt in range(3):
                    try:
                        with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':f'bytes={a}-{b}'}),timeout=45) as response:
                            raw=response.read()
                            if response.status!=206 or response.headers.get('content-range')!=f'bytes {a}-{b}/{size}' or response.headers.get('etag')!=etag or len(raw)!=b-a+1:raise ValueError('Incomplete/changed far-field source range')
                        with lock:target.seek(a);target.write(raw)
                        return len(raw)
                    except Exception:
                        if attempt==2:raise
                        time.sleep(attempt+1)
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                total=0
                for i,amount in enumerate(pool.map(chunk,ranges)):
                    total+=amount
                    if (i+1)%20==0:print('Far-field source: '+str(total//1024**2)+' MiB checked.',flush=True)
        if total!=size:raise ValueError('Incomplete far-field source')
        with temporary.open('rb') as f:checksum=hashlib.file_digest(f,'sha256').hexdigest()
        temporary.replace(path);manifest.write_text(json.dumps({'url':url,'bytes':size,'sha256':checksum,'etag':etag},indent=2)+'\n')
    source=json.loads(manifest.read_text())
    with path.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
    if actual!=source['sha256']:raise ValueError('Pinned far-field source changed')
    science_path=ROOT/'data/science/real-workspace.json';science=json.loads(science_path.read_text());old_audit=json.loads((ROOT/'docs/HORIZON_SAMPLING_VALIDATION.json').read_text());out={'schema':'sitelight-farfield-extension-1','scienceSha256':hashlib.sha256(science_path.read_bytes()).hexdigest(),'validatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'source':source,'extentM':500000,'radialStepM':120,'sourcePixelM':240,'heightCeilingM':20000,'heightCeilingStatus':'declared conservative geometric assumption, not an independently certified physical maximum','sites':{}}
    if old_audit['scienceSha256']!=out['scienceSha256']:raise ValueError('Near-domain sampling audit is stale')
    with rasterio.Env(GDAL_CACHEMAX=24*1024*1024):
        with rasterio.open(path) as src:
            if src.res!=(240.,240.) or abs(src.crs.to_dict().get('R',src.crs.to_dict().get('a',0))-RADIUS)>1e-6:raise ValueError('Unexpected far-field grid/frame')
            for identifier,entry in science['sites'].items():
                site=entry['site'];x,y=transform(GEO,src.crs,[site['lon']],[site['lat']]);x,y=x[0],y[0]
                window=from_bounds(x-650000,y-650000,x+650000,y+650000,src.transform).round_offsets().round_lengths().intersection(Window(0,0,src.width,src.height))
                data=src.read(1,window=window,masked=True).filled(np.nan)
                if np.nanmax(data)>20000:raise ValueError('Declared geometric height ceiling is below source terrain')
                far=horizon_from_dem(data,src.window_transform(window),src.crs,site['lat'],site['lon'],site['surfaceElevationM'],site['observerHeightM'],extent=500000,step=120,start=125000,azimuth_step=.5)
                if not all(v==1 for v in far['rayCoverage']):raise ValueError('Incomplete extended sampled rays')
                nominal=np.array(entry['terrain']['horizon']['elevationDeg']);extended=np.maximum(nominal,np.array(far['elevationDeg']));bound=outside_elevation_bound(RADIUS+site['surfaceElevationM']+site['observerHeightM'],RADIUS+20000,500000)
                dense=horizon_from_dem(data,src.window_transform(window),src.crs,site['lat'],site['lon'],site['surfaceElevationM'],site['observerHeightM'],extent=500000,step=60,start=125000,azimuth_step=.25)
                if not all(v==1 for v in dense['rayCoverage']):raise ValueError('Incomplete dense extended rays')
                dense_combined=np.maximum(np.array(old_audit['sites'][identifier]['denseHorizonDeg']),np.array(dense['elevationDeg']));interpolated=np.interp(np.arange(0,360,.25),np.arange(721)*.5,np.append(extended,extended[0]));sampling_error=np.abs(dense_combined-interpolated)
                out['sites'][identifier]={'annulusHorizonDeg':far['elevationDeg'],'annulusDistanceAtMaxM':far['distanceAtMaxM'],'combinedHorizonDeg':extended.tolist(),'raisedSectors':int((extended>nominal+1e-6).sum()),'maxIncreaseDeg':float((extended-nominal).max()),'outsideConditionalUpperDeg':bound,'sectorsExcludedUnderHeightCeiling':int((extended>bound).sum()),'totalSectors':len(extended),'allSectorsExcludedUnderHeightCeiling':bool((extended>bound).all()),'samplingComparison':{'azimuths':1440,'radialStepM':60,'maxDifferenceDeg':float(sampling_error.max()),'p95DifferenceDeg':float(np.percentile(sampling_error,95)),'sectorsAboveDiagnosticThreshold':int((sampling_error>.1).sum()),'withinDiagnosticThreshold':bool((sampling_error<=.1).all()),'thresholdMeaning':'Inherited 0.1 degree convergence diagnostic; not physical truth or an approved accuracy requirement'},'acceptedForVerdict':False}
                print(identifier,{k:v for k,v in out['sites'][identifier].items() if not isinstance(v,list)},flush=True);del data
    out['limits']=['500 km extension is finite 240 m source sampling; subpixel/azimuth/interpolation error remains','Beyond-extent exclusion is conditional on a 20 km height ceiling, not a physical maximum certified by this audit','Correlated far-field/orientation covariance and independent physical terrain truth are not supplied by this extension','Any detected higher horizon must be reviewed before it replaces the production horizon/sensitivity recipe']
    (ROOT/'docs/FARFIELD_EXTENSION.json').write_text(json.dumps(out,indent=2)+'\n');print('Extended far-field audit complete.',flush=True)
if __name__=='__main__':main()
