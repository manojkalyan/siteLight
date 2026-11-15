"""Independent Horizons apparent-angle checks across all study points and target years."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import datetime as dt
import hashlib,json,math
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
import numpy as np
import spiceypy as spice
from scripts.science_pipeline import ROOT,RAW,RADIUS
spec=spec_from_file_location('expanded_geometry_reference',ROOT/'scripts/validate-expanded-geometry.py')
projection=module_from_spec(spec);spec.loader.exec_module(projection)

def validate():
    target=ROOT/'data/validation/expanded/orientation-references.json';reference=json.loads(target.read_text())
    science_path=ROOT/'data/science/real-workspace.json';science=json.loads(science_path.read_text())
    if set(reference['sites'])!=set(science['sites']) or reference['spec']['thresholds']!={'sunAngularDeg':.01,'earthAngularDeg':.01} or len(reference['spec']['epochsUtc'])!=31:raise ValueError('Changed predeclared apparent reference contract')
    for name in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/name))
    output={'schema':'sitelight-expanded-apparent-validation-1','recordedUtc':dt.datetime.now(dt.timezone.utc).isoformat(),
        'scienceSha256':hashlib.sha256(science_path.read_bytes()).hexdigest(),'validatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'projectionSha256':hashlib.sha256((ROOT/'scripts/validate-expanded-geometry.py').read_bytes()).hexdigest(),
        'referenceSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'spec':reference['spec'],'sites':{},
        'recipe':'CSPICE DE421/MOON_ME observer-fixed reception CN+S vs independently generated Horizons MEAN_ME apparent airless center directions',
        'limits':['Validation recipe only: apparent directions never replace production geometric NONE positions','Sampled sites/epochs and inherited screening tolerances do not establish every date, terrain truth or mission acceptance','Future UTC conversion retains current leap-second assumptions']}
    total=0
    for identifier,entry in reference['sites'].items():
        site=science['sites'][identifier]['site']
        if any(site[k]!=entry['coordinates'][k] for k in ['lat','lon','altKm']):raise ValueError('Changed observer coordinates')
        p,l=math.radians(site['lat']),math.radians(site['lon']);observer=(RADIUS/1000+site['altKm'])*np.array([math.cos(p)*math.cos(l),math.cos(p)*math.sin(l),math.sin(p)])
        for source in entry['sources']:
            raw=(ROOT/'data/validation/expanded/orientation'/source['name']).read_bytes()
            if len(raw)!=source['bytes'] or hashlib.sha256(raw).hexdigest()!=source['sha256']:raise ValueError('Apparent source hash mismatch')
            body=source['name'].removesuffix('.json').split('-')[-1];text=json.loads(raw)['result'];parsed=[]
            for line in text.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
                fields=line.split(',');parsed.append([round((float(fields[0])-2440587.5)*86400)*1000,float(fields[3]),float(fields[4])])
            if parsed!=entry['targets'][body]:raise ValueError('Derived apparent reference differs from pinned source rows')
        if set(entry['targets'])!={'SUN','EARTH'} or any(len(rows)!=31 for rows in entry['targets'].values()):raise ValueError('Missing apparent reference cases')
        checks={}
        for body,rows in entry['targets'].items():
            cases=[];limit=reference['spec']['thresholds']['sunAngularDeg' if body=='SUN' else 'earthAngularDeg']
            for row in rows:
                utc=dt.datetime.fromtimestamp(row[0]/1000,tz=dt.timezone.utc);et=spice.str2et(utc.strftime('%Y %b %d %H:%M:%S UTC'))
                if utc.isoformat().replace('+00:00','Z')!=reference['spec']['epochsUtc'][len(cases)].replace('.000Z','Z'):raise ValueError('Changed apparent epoch sequence')
                state,_=spice.spkcpo(body,et,'MOON_ME','OBSERVER','CN+S',observer,'MOON','MOON_ME')
                az,el=projection.local_angles(np.asarray(state[:3]),site['lat'],site['lon']);az_error=abs((az-row[1]+180)%360-180);el_error=abs(el-row[2]);total+=1
                cases.append({'utc':utc.isoformat(),'referenceAzDeg':row[1],'referenceElDeg':row[2],'computedAzDeg':az,'computedElDeg':el,'azErrorDeg':az_error,'elErrorDeg':el_error,'passed':max(az_error,el_error)<=limit})
            checks[body]={'passed':all(c['passed'] for c in cases),'maxAngularComponentErrorDeg':max(max(c['azErrorDeg'],c['elErrorDeg']) for c in cases),'toleranceDeg':limit,'cases':cases}
        output['sites'][identifier]={'coordinates':entry['coordinates'],'sources':entry['sources'],'checks':checks};print(identifier,{k:v['maxAngularComponentErrorDeg'] for k,v in checks.items()},flush=True)
    output['caseCount']=total;output['passed']=all(c['passed'] for s in output['sites'].values() for c in s['checks'].values())
    (ROOT/'docs/EXPANDED_ORIENTATION_VALIDATION.json').write_text(json.dumps(output,indent=2)+'\n')
    if not output['passed']:raise ValueError('Expanded apparent reference exceeded the inherited screening tolerance')
    print(str(total)+' expanded apparent-angle comparisons passed.',flush=True)
    return output

if __name__=='__main__':validate()
