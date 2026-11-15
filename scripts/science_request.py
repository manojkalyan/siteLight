"""Generate a bounded, real geometric date block for one already sourced study point."""
import argparse
import datetime as dt
import hashlib
import json
import os
import uuid
from pathlib import Path
os.environ['OPENBLAS_NUM_THREADS']='1'
import numpy as np
import spiceypy as spice
from scripts.science_pipeline import ROOT,RAW,geometric_series

def generate(site_id,start_iso,end_iso,output,point_file=None):
    science=json.loads((ROOT/'data/science/real-workspace.json').read_text(encoding='utf-8'))
    if point_file:
        path=Path(point_file).resolve()
        if not path.is_relative_to((ROOT/'data/cache/points').resolve()):raise ValueError('Prepared point outside scientific cache')
        point=json.loads(path.read_text(encoding='utf-8'))
        if point['schema']!='sitelight-custom-point-1' or point['preprocessingVersion']!=science['version'] or point['sourceAlgorithm']!=science['algorithm'] or point['entry']['site']['id']!=site_id:raise ValueError('Prepared coordinate does not match scientific inputs')
        science['sites'][site_id]=point['entry']
    if site_id not in science['sites']:raise ValueError('Unknown sourced study point')
    start=dt.datetime.fromisoformat(start_iso.replace('Z','+00:00'));end=dt.datetime.fromisoformat(end_iso.replace('Z','+00:00'))
    if start.tzinfo is None or end.tzinfo is None:raise ValueError('Explicit UTC required')
    if start<dt.datetime(2027,1,1,tzinfo=dt.timezone.utc) or end>dt.datetime(2034,1,1,tzinfo=dt.timezone.utc) or not 0<(end-start).total_seconds()<=180*86400:raise ValueError('Invalid date block')
    if start.minute%10 or start.second or end.minute%10 or end.second:raise ValueError('Ten-minute aligned block required')
    inputs=[r for r in science['inputs'] if r['name'].startswith('kernels/')]
    for r in inputs:
        if hashlib.sha256((RAW/r['name']).read_bytes()).hexdigest()!=r['sha256']:raise ValueError('Kernel checksum changed')
    spice.kclear()
    for filename in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/filename))
    count=int((end-start).total_seconds()/600)+1;epochs=[start+dt.timedelta(seconds=600*i) for i in range(count)]
    ets=np.array([spice.str2et(t.strftime('%Y %b %d %H:%M:%S UTC')) for t in epochs])
    entry=science['sites'][site_id];rows,error=geometric_series(entry['site'],epochs,ets)
    payload={'schema':'sitelight-date-block-1','siteId':site_id,'coordinates':entry['coordinates'],'frame':'MOON_ME','ephemeris':'DE421','correction':'NONE','stepMinutes':10,
             'start':start.isoformat().replace('+00:00','Z'),'end':end.isoformat().replace('+00:00','Z'),'records':rows,
             'sources':inputs,'preprocessingVersion':science['version'],'sourceAlgorithm':science['algorithm'],
             'requestAlgorithmSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'transformPathMaxErrorDeg':error,
             'limits':'Geometric source data; same local DEM horizon and far-field/uncertainty limits apply. Future UTC uses pinned leap seconds.'}
    path=Path(output).resolve();allowed=(ROOT/'data/cache').resolve()
    if not path.is_relative_to(allowed):raise ValueError('Output outside scientific cache')
    path.parent.mkdir(exist_ok=True);temporary=path.with_name(path.name+'.'+str(os.getpid())+'.'+uuid.uuid4().hex+'.partial');temporary.write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8');temporary.replace(path)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--site',required=True);p.add_argument('--start',required=True);p.add_argument('--end',required=True);p.add_argument('--output',required=True);p.add_argument('--point-file')
    a=p.parse_args();generate(a.site,a.start,a.end,a.output,a.point_file)
