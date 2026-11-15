"""Expanded DE441/Horizons vs production DE421 geometric comparison, not terrain truth."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import datetime as dt
import hashlib,json,math
from pathlib import Path
import numpy as np
import spiceypy as spice
from scripts.science_pipeline import ROOT,RAW,FRAME,RADIUS,geometric_series

def local_angles(vector,lat,lon):
    # Separately expressed ENU projection; do not reuse production basis/angles.
    p,l=math.radians(lat),math.radians(lon)
    up=np.array([math.cos(p)*math.cos(l),math.cos(p)*math.sin(l),math.sin(p)])
    east=np.cross([0.,0.,1.],up);east/=np.linalg.norm(east);north=np.cross(up,east)
    e,n,u=float(vector@east),float(vector@north),float(vector@up)
    return math.degrees(math.atan2(e,n))%360,math.degrees(math.atan2(u,math.hypot(e,n)))

def validate():
    folder=ROOT/'data/validation/expanded'
    reference=json.loads((folder/'reference-vectors.json').read_text())
    science=json.loads((ROOT/'data/science/real-workspace.json').read_text())
    if reference['spec']['thresholds']!={'sunAngularDeg':.0001,'earthAngularDeg':.005} or set(reference['targets'])!={'SUN','EARTH'} or len(reference['spec']['epochsUtc'])!=31:raise ValueError('Changed predeclared geometric reference contract')
    for source in reference['sources']:
        raw=(folder/source['name']).read_bytes()
        if len(raw)!=source['bytes'] or hashlib.sha256(raw).hexdigest()!=source['sha256']:raise ValueError('Expanded reference hash mismatch')
        text=json.loads(raw)['result'];body=source['name'].split('.')[0]
        parsed=[]
        for line in text.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
            fields=line.split(',');parsed.append([round((float(fields[0])-2440587.5)*86400)*1000,*map(float,fields[2:5])])
        if parsed!=reference['targets'][body]:raise ValueError('Derived geometric reference differs from pinned source rows')
    for name in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/name))
    epochs=[dt.datetime.fromisoformat(t.replace('Z','+00:00')) for t in reference['spec']['epochsUtc']]
    if any([dt.datetime.fromtimestamp(r[0]/1000,tz=dt.timezone.utc) for r in rows]!=epochs for rows in reference['targets'].values()):raise ValueError('Changed geometric epoch sequence')
    ets=np.array([spice.str2et(t.strftime('%Y %b %d %H:%M:%S UTC')) for t in epochs])
    output={'schema':'sitelight-expanded-geometric-validation-1','recordedUtc':dt.datetime.now(dt.timezone.utc).isoformat(),'scienceVersion':science['version'],
        'scienceSha256':hashlib.sha256((ROOT/'data/science/real-workspace.json').read_bytes()).hexdigest(),
        'validatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'referenceSha256':hashlib.sha256((folder/'reference-vectors.json').read_bytes()).hexdigest(),
        'spec':reference['spec'],'sources':reference['sources'],'sites':{},'limits':['DE441/Horizons inertial vectors provide an external software/ephemeris comparison; the local lunar orientation uses the production DE421 rotation kernel','Not independent terrain, full orientation/time-range, global-horizon or mission-accuracy acceptance','Future UTC/ET conversion retains the current leap-second assumptions; sampled epochs do not prove every intervening date']}
    total=0
    for identifier,entry in science['sites'].items():
        site=entry['site'];records,transform_error=geometric_series(site,epochs,ets)
        p,l=math.radians(site['lat']),math.radians(site['lon'])
        observer=(RADIUS/1000+site['altKm'])*np.array([math.cos(p)*math.cos(l),math.cos(p)*math.sin(l),math.sin(p)])
        checks={}
        for body,column in [('SUN',1),('EARTH',3)]:
            cases=[];limit=reference['spec']['thresholds']['sunAngularDeg' if body=='SUN' else 'earthAngularDeg']
            for i,(row,et) in enumerate(zip(reference['targets'][body],ets)):
                if row[0]!=records[i][0]:raise ValueError('Reference/production time mismatch')
                external=spice.pxform('J2000',FRAME,float(et))@np.array(row[1:])-observer
                az,el=local_angles(external,site['lat'],site['lon'])
                actual_az,actual_el=records[i][column:column+2]
                az_error=abs((actual_az-az+180)%360-180);el_error=abs(actual_el-el)
                cases.append({'utc':epochs[i].isoformat(),'referenceAzDeg':az,'referenceElDeg':el,'productionAzDeg':actual_az,'productionElDeg':actual_el,'azErrorDeg':az_error,'elErrorDeg':el_error,'passed':max(az_error,el_error)<=limit});total+=1
            maximum=max(max(c['azErrorDeg'],c['elErrorDeg']) for c in cases)
            checks[body]={'passed':all(c['passed'] for c in cases),'toleranceDeg':limit,'maxAngularComponentErrorDeg':maximum,'cases':cases}
        output['sites'][identifier]={'coordinates':{k:site[k] for k in ['lat','lon','altKm']},'transformPathMaxErrorDeg':transform_error,'checks':checks}
        print(identifier,{k:v['maxAngularComponentErrorDeg'] for k,v in checks.items()},flush=True)
    output['caseCount']=total;output['passed']=all(c['passed'] for s in output['sites'].values() for c in s['checks'].values())
    (ROOT/'docs/EXPANDED_GEOMETRY_VALIDATION.json').write_text(json.dumps(output,indent=2)+'\n')
    if not output['passed']:raise ValueError('Expanded geometric reference exceeded the inherited predeclared tolerance')
    print(str(total)+' expanded geometric comparisons passed.',flush=True)
    return output

if __name__=='__main__':validate()
