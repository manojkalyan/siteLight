"""Sparse real geometry for 84 first-of-month mission starts; no gaps are treated as coverage."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse,datetime as dt,hashlib,json,math,uuid
from pathlib import Path
import numpy as np
import spiceypy as spice
from scripts.science_pipeline import ROOT,RAW,geometric_series,file_sha256

def generate(site_id,duration,output,point_file=None):
    if not math.isfinite(duration) or not 48<=duration<=336:raise ValueError('Duration must be 48–336 hours')
    science=json.loads((ROOT/'data/science/real-workspace.json').read_text(encoding='utf-8'))
    if point_file:
        path=Path(point_file).resolve()
        if not path.is_relative_to((ROOT/'data/cache/points').resolve()):raise ValueError('Invalid prepared point path')
        point=json.loads(path.read_text(encoding='utf-8'))
        if point['preprocessingVersion']!=science['version'] or point['sourceAlgorithm']!=science['algorithm'] or point['entry']['site']['id']!=site_id:raise ValueError('Stale prepared point')
        science['sites'][site_id]=point['entry']
    if site_id not in science['sites']:raise ValueError('Unknown real point')
    sources=[r for r in science['inputs'] if r['name'].startswith('kernels/')]
    for r in sources:
        if file_sha256(RAW/r['name'])!=r['sha256']:raise ValueError('Pinned kernel changed')
    spice.kclear()
    for name in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/name))
    count=math.ceil(duration*6)+1;starts=[dt.datetime(y,m,1,tzinfo=dt.timezone.utc) for y in range(2027,2034) for m in range(1,13)]
    epochs=[start+dt.timedelta(seconds=600*i) for start in starts for i in range(count)]
    ets=np.array([spice.str2et(t.strftime('%Y %b %d %H:%M:%S UTC')) for t in epochs])
    entry=science['sites'][site_id];rows,error=geometric_series(entry['site'],epochs,ets)
    iso=lambda t:t.isoformat().replace('+00:00','Z')
    blocks=[{'start':iso(start),'end':iso(start+dt.timedelta(seconds=600*(count-1))),'records':rows[i*count:(i+1)*count]} for i,start in enumerate(starts)]
    result={'schema':'sitelight-monthly-blocks-1','siteId':site_id,'coordinates':entry['coordinates'],'durationHours':duration,'frame':'MOON_ME','ephemeris':'DE421','correction':'NONE','stepMinutes':10,'preprocessingVersion':science['version'],'sourceAlgorithm':science['algorithm'],'requestAlgorithmSha256':file_sha256(Path(__file__)),'sources':sources,'blocks':blocks,'transformPathMaxErrorDeg':error,'sampling':'First day of each month at 00:00 UTC, January 2027–December 2033. Each mission window is separate; intervening dates are not assessed. Future UTC uses pinned leap seconds.'}
    path=Path(output).resolve()
    if not path.is_relative_to((ROOT/'data/cache').resolve()):raise ValueError('Output outside cache')
    path.parent.mkdir(exist_ok=True);tmp=path.with_name(path.name+'.'+uuid.uuid4().hex+'.partial');tmp.write_text(json.dumps(result,separators=(',',':'),ensure_ascii=False),encoding='utf-8');tmp.replace(path)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--site',required=True);p.add_argument('--duration',required=True,type=float);p.add_argument('--output',required=True);p.add_argument('--point-file');a=p.parse_args();generate(a.site,a.duration,a.output,a.point_file)
