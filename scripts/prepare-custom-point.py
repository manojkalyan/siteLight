"""Prepare an exact requested coordinate using its own DEM samples, horizon and ephemeris."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import uuid
import numpy as np
import rasterio
from rasterio.warp import transform
from rasterio.windows import from_bounds,Window
import spiceypy as spice
from scripts.science_pipeline import ROOT,RAW,RADIUS,GEO,FRAME,file_sha256,bilinear,horizon_from_dem,combine_horizons,json_grid,geometric_series

def thermal_context(lat,lon,index):
    result=[]
    for product in index['products']:
        rows=np.asarray(product['rows'],dtype=float);p=math.radians(lat);q=np.radians(rows[:,0])
        distance=2*RADIUS*np.arcsin(np.sqrt(np.clip(np.sin((q-p)/2)**2+math.cos(p)*np.cos(q)*np.sin(np.radians(rows[:,1]-lon)/2)**2,0,1)))
        i=int(np.argmin(distance));match=None
        if distance[i]<=math.sqrt(2)*120+2:
            row=rows[i];match={'lat':float(row[0]),'lon':float(row[1]),'kelvin':float(row[2]),'sourceRecord':int(row[3]),'distanceM':float(distance[i])}
        result.append({**product['metadata'],'status':'observed_context' if match else 'no_matching_bin','match':match})
    return result

def prepare(request):
    science=json.loads((ROOT/'data/science/real-workspace.json').read_text(encoding='utf-8'))
    lat,lon,height=request['lat'],request['lon'],request['observerHeightM'];tile=request['tile'];site_id=request['siteId']
    if not all(isinstance(v,(int,float)) and math.isfinite(v) for v in [lat,lon,height]) or not(-90<=lat<=90 and -180<=lon<=180 and .1<=height<=100):raise ValueError('Invalid custom coordinate/observer')
    if tile not in [e['site']['tile'] for e in science['sites'].values()]:raise ValueError('Unknown terrain product')
    start=dt.datetime.fromisoformat(request['start'].replace('Z','+00:00'));end=dt.datetime.fromisoformat(request['end'].replace('Z','+00:00'))
    if start.tzinfo is None or end.tzinfo is None or not dt.datetime(2027,1,1,tzinfo=dt.timezone.utc)<=start<end<=dt.datetime(2034,1,1,tzinfo=dt.timezone.utc) or (end-start).total_seconds()>180*86400:raise ValueError('Invalid custom date interval')
    if start.timestamp()%600 or end.timestamp()%600:raise ValueError('Ten-minute aligned interval required')
    sources=[s for s in science['inputs'] if s['name'].startswith('kernels/') or s['name'].startswith('terrain/'+tile+'_') or s['name'].startswith('terrain/LDEM_80S_80MPP')]
    for s in sources:
        if file_sha256(RAW/s['name'])!=s['sha256']:raise ValueError('Source checksum changed: '+s['name'])
    with rasterio.open(RAW/'terrain'/f'{tile}_surf.tif') as src, rasterio.open(RAW/'terrain'/f'{tile}_toterr.tif') as error:
        x,y=transform(GEO,src.crs,[lon],[lat]);x,y=float(x[0]),float(y[0]);scale=2/(1-math.sin(math.radians(lat)))
        margin=min(x-src.bounds.left,src.bounds.right-x,y-src.bounds.bottom,src.bounds.top-y)
        if margin<660:raise ValueError('Coordinate too close to high-resolution DEM edge; previous assessment preserved')
        extent=7000-max(0,math.ceil((7000-(margin-50)/scale)/80))*80
        if extent<600:raise ValueError('Insufficient local high-resolution terrain around this coordinate')
        data=src.read(1,masked=True).filled(np.nan);rms=error.read(1,masked=True).filled(np.nan)
        h=float(bilinear(data,src.transform,x,y));observer_rms=float(bilinear(rms,src.transform,x,y))
        if not math.isfinite(h) or not math.isfinite(observer_rms) or observer_rms<0:raise ValueError('No finite DEM/height-error sample at this coordinate')
        local=horizon_from_dem(data,src.transform,src.crs,lat,lon,h,height,extent=extent,step=2.5,height_rms=rms,observer_rms=observer_rms,azimuth_step=.5)
        row,col=src.index(x,y);half=104;window=Window(col-half,row-half,half*2+1,half*2+1);corner_x,corner_y=src.xy(row-half,col-half)
        grid={'size':half*2+1,'spacingM':5,'originX':corner_x-x,'originY':corner_y-y,'projectionScale':scale,'elevationM':json_grid(data[row-half:row+half+1,col-half:col+half+1]),'heightRmsM':json_grid(rms[row-half:row+half+1,col-half:col+half+1]),'mapReference':'Offsets from requested coordinate in source polar-stereographic axes; pixel centers retained'}
        with rasterio.open(RAW/'terrain'/f'{tile}_slperr.tif') as slope:grid['publishedSlopeRmsDeg']=json_grid(slope.read(1,window=window,masked=True).filled(np.nan))
        metadata={'sourceCrsWkt':src.crs.to_wkt(),'affine':list(src.transform)[:6],'boundsM':list(src.bounds),'pixelSpacingM':[5,5],'sourceSize':[src.width,src.height],'noData':'NaN; never filled','heightReference':'Meters above 1737400 m sphere, MOON_ME / DE421','sampling':'Bilinear, all four finite neighbors','requestedCoordinate':{'lat':lat,'lon':lon},'highResolutionMarginM':margin}
    with rasterio.open(RAW/'terrain/LDEM_80S_80MPP_ADJ.TIF') as src, rasterio.open(RAW/'terrain/LDEM_80S_80MPP_ADJ_ERR.TIF') as error:
        # Only the ROI is read: at most ~85 MiB for both far-field arrays, rather than the entire polar raster.
        window=from_bounds(x-128000,y-128000,x+128000,y+128000,src.transform).round_offsets().round_lengths().intersection(Window(0,0,src.width,src.height))
        far=horizon_from_dem(src.read(1,window=window,masked=True).filled(np.nan),src.window_transform(window),src.crs,lat,lon,h,height,extent=125000,step=40,start=extent,height_rms=error.read(1,window=window,masked=True).filled(np.nan),observer_rms=observer_rms,azimuth_step=.5)
        far_metadata={'sourceCrsWkt':src.crs.to_wkt(),'affine':list(src.window_transform(window))[:6],'window':[window.col_off,window.row_off,window.width,window.height],'pixelSpacingM':80}
    horizon=combine_horizons(local,far);horizon['farFieldSource']='https://pgda.gsfc.nasa.gov/products/90';horizon['farFieldMetadata']=far_metadata
    if any(v!=1 for v in horizon['rayCoverage']) or any(v is None for v in horizon['elevationDeg']):raise ValueError('Incomplete terrain rays at this coordinate; previous assessment preserved')
    site={'id':site_id,'custom':True,'name':f'Custom {lat:.5f}°, {lon:.5f}°','lat':lat,'lon':lon,'altKm':(h+height)/1000,'polar':lat< -80,'surfaceElevationM':h,'observerHeightM':height,'tile':tile,'source':'https://pgda.gsfc.nasa.gov/products/78','coordinateStatus':'User coordinate; surface height bilinearly sampled from its own real DEM; not a certified landing site','frame':'MOON_ME / DE421; spherical reference radius 1737400 m','projectedPointM':[x,y],'sourcePixel':[row,col]}
    spice.kclear()
    for filename in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/filename))
    epochs=[start+dt.timedelta(seconds=600*i) for i in range(int((end-start).total_seconds()/600)+1)];ets=np.array([spice.str2et(t.strftime('%Y %b %d %H:%M:%S UTC')) for t in epochs]);records,transform_error=geometric_series(site,epochs,ets)
    index_path=ROOT/'data/science/custom-thermal-index.json';index=json.loads(index_path.read_text(encoding='utf-8'))
    point_algorithm={'file':'scripts/prepare-custom-point.py','sha256':file_sha256(Path(__file__)),'thermalIndexSha256':file_sha256(index_path),'thermalIndexAlgorithm':index['algorithm']}
    entry={'site':site,'coordinates':{k:site[k] for k in ['lat','lon','altKm']},'records':records,'terrain':{'horizon':horizon,'localHorizon':local,'grid':grid,'metadata':metadata},'sources':sources,'transformPathMaxErrorDeg':transform_error,'externalGeometryCheck':None,'externalOrientationCheck':None,'thermalContext':thermal_context(lat,lon,index),'pointPreparation':point_algorithm}
    return {'schema':'sitelight-custom-point-1','frame':FRAME,'ephemeris':'DE421','correction':'NONE','stepMinutes':10,'preprocessingVersion':science['version'],'sourceAlgorithm':science['algorithm'],'request':request,'start':request['start'],'end':request['end'],'entry':entry,'pointAlgorithm':point_algorithm}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--request',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    output=Path(a.output).resolve()
    if not output.is_relative_to((ROOT/'data/cache').resolve()):raise ValueError('Output outside scientific cache')
    result=prepare(json.loads(a.request));output.parent.mkdir(parents=True,exist_ok=True);temporary=output.with_name(output.name+'.'+uuid.uuid4().hex+'.partial');temporary.write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False,allow_nan=False),encoding='utf-8');temporary.replace(output)
