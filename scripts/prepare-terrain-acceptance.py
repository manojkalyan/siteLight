"""Bundle bounded sourced terrain comparisons and local correlated ensemble propagation."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import hashlib,json,math
from pathlib import Path
import numpy as np
import rasterio
from scripts.science_pipeline import ROOT,RAW

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def sample(a,x,z,scale):
    c=(x*scale+370)/5;r=(370-z*scale)/5;ci=np.floor(c).astype(int);ri=np.floor(r).astype(int);fx=c-ci;fy=r-ri
    if (ci<0).any() or (ri<0).any() or (ci+1>=a.shape[1]).any() or (ri+1>=a.shape[0]).any():raise ValueError('Ensemble grid does not cover requested footprint/baseline')
    return (a[ri,ci]*(1-fx)+a[ri,ci+1]*fx)*(1-fy)+(a[ri+1,ci]*(1-fx)+a[ri+1,ci+1]*fx)*fy
def footprint(a,scale,radius=100,baseline=20,limit=12):
    if not (20<=radius<=300 and 5<=baseline<=100 and 0<=limit<=45):raise ValueError('Unsupported terrain settings')
    x,z=np.array([(i*radius/10,j*radius/10) for j in range(-10,11) for i in range(-10,11) if i*i+j*j<=100]).T
    h=sample(a,x,z,scale);dx=(sample(a,x+baseline/2,z,scale)-sample(a,x-baseline/2,z,scale))/baseline;dz=(sample(a,x,z+baseline/2,scale)-sample(a,x,z-baseline/2,scale))/baseline
    slopes=np.degrees(np.arctan(np.hypot(dx,dz)));design=np.column_stack([np.ones_like(x),x,z]);fit=np.linalg.lstsq(design,h,rcond=None)[0];rough=float(np.sqrt(np.mean((h-design@fit)**2)))
    if not np.isfinite(slopes).all() or not np.isfinite(h).all():raise ValueError('Missing clone footprint samples')
    return {'meanSlopeDeg':float(slopes.mean()),'maxSlopeDeg':float(slopes.max()),'p95SlopeDeg':float(np.sort(slopes)[int((len(slopes)-1)*.95)]),'roughnessM':rough,'usableAreaM2':float(math.pi*radius**2*np.mean(slopes<=limit)),'samples':len(slopes)}
def main():
    science_path=ROOT/'data/science/real-workspace.json';science=json.loads(science_path.read_text());manifest_path=RAW/'terrain-evidence/clone-windows.json';clones=json.loads(manifest_path.read_text())
    if clones['scienceSha256']!=sha(science_path):raise ValueError('Clone source point metadata is stale')
    stereo=json.loads((ROOT/'docs/STEREO_TERRAIN_COMPARISON.json').read_text());far=json.loads((ROOT/'docs/FARFIELD_EXTENSION.json').read_text())
    if stereo['scienceSha256']!=sha(science_path) or far['scienceSha256']!=sha(science_path):raise ValueError('Terrain audit uses a different scientific bundle')
    if len(clones['sites'])!=len(science['sites']):raise ValueError('Published clone acquisition is not complete for the study catalog')
    out={'schema':'sitelight-terrain-acceptance-evidence-1','scienceVersion':science['version'],'sourceAlgorithmSha256':science['algorithm']['sha256'],'sourceInputs':[{k:r[k] for k in ['name','sha256']} for r in science['inputs']],'scienceSha256':sha(science_path),'preparerSha256':sha(Path(__file__)),'cloneManifestSha256':sha(manifest_path),'defaultFootprint':{'radiusM':100,'baselineM':20,'slopeLimitDeg':12},'sites':{},'farfieldMethod':{k:v for k,v in far.items() if k!='sites'},'acceptedForVerdict':False}
    for identifier,entry in science['sites'].items():
        source=clones['sites'].get(identifier);stats=[];centers=[];adjacent=[];distant=[]
        if source and source['status']=='acquired':
            if source['count']!=100 or len(source['sources'])!=100:raise ValueError('Incomplete published 100-member ensemble')
            site=entry['site'];r,c=site['sourcePixel']
            with rasterio.open(RAW/'terrain'/f"{site['tile']}_surf.tif") as src:nominal=src.read(1,window=rasterio.windows.Window(c-74,r-74,149,149))
            for record in source['sources']:
                path=ROOT/record['subsetFile']
                if sha(path)!=record['subsetSha256']:raise ValueError('Changed retained clone window')
                a=np.load(path)['elevationM'];stats.append(footprint(a,source['grid']['projectionScale']));error=a-nominal;centers.append(float(error[74,74]));adjacent.append(float(error[74,75]));distant.append(float(error[74,94]))
            correlation=lambda b:float(np.corrcoef(centers,b)[0,1]) if np.std(centers)>0 and np.std(b)>0 else None
            ensemble={'status':'published_ensemble_propagated','members':100,'settings':out['defaultFootprint'],'interpretation':'Empirical percentiles of published correlated terrain realizations. Not guaranteed confidence bounds; far-field/orientation covariance and independent terrain truth are excluded.',
                'metrics':{key:{'p2_5':float(np.quantile([r[key] for r in stats],.025)),'median':float(np.quantile([r[key] for r in stats],.5)),'p97_5':float(np.quantile([r[key] for r in stats],.975))} for key in ['meanSlopeDeg','maxSlopeDeg','p95SlopeDeg','roughnessM','usableAreaM2']},
                'errorCorrelationAcrossMembers':{'adjacent5m':correlation(adjacent),'separated100m':correlation(distant)},'correlationSeparationConvention':'5 m and 100 m projected-grid offsets; divide by projectionScale for local ground distances','projectionScale':source['grid']['projectionScale'],'memberStatistics':stats,'sourcePage':'https://pgda.gsfc.nasa.gov/products/78','retainedWindowHashes':[r['subsetSha256'] for r in source['sources']],'sourceCloneNumbers':[r['clone'] for r in source['sources']]}
        else:ensemble={'status':'published_clones_unavailable','members':0,'reason':'No complete published ensemble was available; no synthetic noise was substituted.'}
        comparisons=[{k:v for k,v in result.items() if k!='points'} for result in stereo['sites'].get(identifier,[])]
        out['sites'][identifier]={'coordinates':{k:entry['site'][k] for k in ['lat','lon','altKm']},'localCorrelatedTerrain':ensemble,'stereoComparisons':comparisons,'stereoStatus':'partial_cross_product_comparison' if comparisons else 'no_matching_stereo_coverage','farfieldExtension':far['sites'][identifier]}
        print(identifier,'ensemble',ensemble['members'],'stereo products',len(comparisons),'farfield raises',far['sites'][identifier]['raisedSectors'],flush=True)
    out['limits']=['Source-backed reference evidence; full scientific acceptance is not automatically promoted','Local ensemble statistics apply to the declared 100 m/20 m/12 degree settings only','Camera-derived terrain is tied to LOLA control and incompletely covers some footprints; confidence classes 10-14 are required at all interpolation supports but cannot remove all artifacts','The 500 km exclusion is conditional on the declared 20 km height ceiling, not independent certification of that ceiling']
    target=ROOT/'data/science/terrain-acceptance-evidence.json';target.write_text(json.dumps(out,separators=(',',':'))+'\n')
    (ROOT/'data/science/terrain-evidence-build.json').write_text(json.dumps({'bundleSha256':sha(target),'bundleBytes':target.stat().st_size,'scienceSha256':sha(science_path),'preparerSha256':sha(Path(__file__)),'cloneManifestSha256':sha(manifest_path),'farAuditSha256':sha(ROOT/'docs/FARFIELD_EXTENSION.json'),'stereoAuditSha256':sha(ROOT/'docs/STEREO_TERRAIN_COMPARISON.json')},indent=2)+'\n')
    print('Prepared terrain evidence:',target.stat().st_size,'bytes',flush=True)
if __name__=='__main__':main()
