"""Evaluate actual published correlated terrain windows at supported footprint settings."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse,hashlib,json,math
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SCHEMA='sitelight-terrain-ensemble-1'
MODEL='local-correlated-footprint-1'
METRICS=('meanSlopeDeg','maxSlopeDeg','p95SlopeDeg','roughnessM','usableAreaM2')

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def validate_settings(radius,baseline,limit):
    for key,value,minimum,maximum in [('radius',radius,20,300),('baseline',baseline,5,100),('limit',limit,0,45)]:
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not minimum<=value<=maximum:raise ValueError('Unsupported terrain '+key)
    return {'radiusM':radius,'baselineM':baseline,'slopeLimitDeg':limit}
def summarize(statistics):
    if len(statistics)!=100:raise ValueError('Exactly 100 published members required')
    result={}
    for key in METRICS:
        values=np.array([r[key] for r in statistics],dtype=float)
        if not np.isfinite(values).all() or np.any(values<0):raise ValueError('Invalid ensemble metric')
        result[key]={'p2_5':float(np.quantile(values,.025)),'median':float(np.quantile(values,.5)),'p97_5':float(np.quantile(values,.975))}
    return result
def evaluate(site_id,radius=100,baseline=20,limit=12,root=ROOT):
    settings=validate_settings(radius,baseline,limit)
    science_path=root/'data/science/real-workspace.json';manifest_path=root/'data/raw/terrain-evidence/clone-windows.json'
    science=json.loads(science_path.read_text());manifest=json.loads(manifest_path.read_text());entry=science['sites'].get(site_id)
    if not entry or manifest['scienceSha256']!=digest(science_path):raise ValueError('Unknown catalog point or stale clone sources')
    source=manifest['sites'].get(site_id)
    if not source or source['status']!='acquired' or source['count']!=100 or len(source['sources'])!=100 or len(set(r['clone'] for r in source['sources']))!=100:raise ValueError('Incomplete published ensemble')
    site=entry['site']
    if any(source['site'].get(k)!=site.get(k) for k in ['lat','lon','altKm','tile','sourcePixel']):raise ValueError('Clone windows belong to another point')
    scale=source['grid']['projectionScale']
    if not isinstance(scale,(float,int)) or not math.isfinite(scale) or scale<=0 or abs(scale-entry['terrain']['grid']['projectionScale'])>1e-12:raise ValueError('Clone projection scale mismatch')
    preparer_path=root/'scripts/prepare-terrain-acceptance.py';spec=spec_from_file_location('published_terrain_footprint',preparer_path);preparer=module_from_spec(spec);spec.loader.exec_module(preparer)
    statistics=[];base=(root/'data/raw/terrain-evidence'/site['tile']).resolve();r,c=site['sourcePixel'];expected_window=[c-74,r-74,149,149]
    for record in source['sources']:
        path=(root/record['subsetFile']).resolve()
        if path.parent!=base or path.suffix!='.npz' or record['window']!=expected_window or record['shape']!=[149,149] or digest(path)!=record['subsetSha256']:raise ValueError('Changed or mismatched retained clone window')
        with np.load(path,allow_pickle=False) as retained:a=retained['elevationM']
        if a.shape!=(149,149) or not np.isfinite(a).all():raise ValueError('Missing published clone heights')
        statistics.append(preparer.footprint(a,scale,radius,baseline,limit))
    return {'schema':SCHEMA,'model':MODEL,'siteId':site_id,'coordinates':{k:site[k] for k in ['lat','lon','altKm']},'settings':settings,'members':100,'metrics':summarize(statistics),
        'source':{'scienceVersion':science['version'],'scienceSha256':digest(science_path),'sourceAlgorithmSha256':science['algorithm']['sha256'],'cloneManifestSha256':digest(manifest_path),'footprintAlgorithmSha256':digest(preparer_path),'evaluatorSha256':digest(Path(__file__)),'retainedWindowHashes':[r['subsetSha256'] for r in source['sources']],'sourceCloneNumbers':[r['clone'] for r in source['sources']],'sourcePage':manifest['sourcePage']},
        'acceptedForVerdict':False,'fullDomainCovariance':False,'interpretation':'Empirical percentiles from 100 published local correlated absolute-height realizations at the requested footprint settings. Not guaranteed confidence bounds; far-field/orientation covariance and independent terrain truth are excluded.'}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--site',required=True);parser.add_argument('--radius',type=float,required=True);parser.add_argument('--baseline',type=float,required=True);parser.add_argument('--limit',type=float,required=True);args=parser.parse_args()
    print(json.dumps(evaluate(args.site,args.radius,args.baseline,args.limit),separators=(',',':'),allow_nan=False))
if __name__=='__main__':main()
