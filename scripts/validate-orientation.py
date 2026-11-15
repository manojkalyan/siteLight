"""Independent apparent AZ/EL cross-check; never substitute apparent vectors in the geometric evaluator."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import datetime as dt
import hashlib
import json
from pathlib import Path
import numpy as np
import spiceypy as spice
from scripts.science_pipeline import ROOT, RAW, RADIUS, basis, angles

def validate():
    reference=json.loads((ROOT/'data/validation/orientation-references.json').read_text())
    for name in ['naif0012.tls','de421.bsp','moon_pa_de421_1900-2050.bpc','moon_080317.tf']:spice.furnsh(str(RAW/'kernels'/name))
    output={**{k:v for k,v in reference.items() if k!='sites'},'algorithm':{'file':'scripts/validate-orientation.py','sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'recipe':'CSPICE spkcpo, observer-fixed MOON_ME, reception CN+S; airless center directions; compared with independently computed Horizons MEAN_ME DE441 apparent AZ/EL','sites':{}}
    for id_,entry in reference['sites'].items():
        site=entry['coordinates'];enu=basis(site['lat'],site['lon']);observer=enu[2]*(RADIUS/1000+site['altKm']);checks={}
        for source in entry['sources']:
            if hashlib.sha256((ROOT/'data/validation'/source['name']).read_bytes()).hexdigest()!=source['sha256']:raise ValueError('Changed orientation reference')
        for body,rows in entry['targets'].items():
            errors=[];cases=[]
            for row in rows:
                utc=dt.datetime.fromtimestamp(row[0]/1000,tz=dt.timezone.utc);et=spice.str2et(utc.strftime('%Y %b %d %H:%M:%S UTC'))
                state,_=spice.spkcpo(body,et,'MOON_ME','OBSERVER','CN+S',observer,'MOON','MOON_ME')
                az,el=angles(state[:3],enu)
                az_error=abs((float(az)-row[1]+180)%360-180);el_error=abs(float(el)-row[2]);errors.append(max(az_error,el_error))
                cases.append({'utc':utc.isoformat(),'referenceAzDeg':row[1],'referenceElDeg':row[2],'computedAzDeg':float(az),'computedElDeg':float(el),'azErrorDeg':az_error,'elErrorDeg':el_error})
            tolerance=reference['thresholds']['sunAngularDeg' if body=='SUN' else 'earthAngularDeg']
            checks[body]={'passed':max(errors)<tolerance,'maxAngularErrorDeg':max(errors),'toleranceDeg':tolerance,'cases':cases}
        output['sites'][id_]={'coordinates':site,'checks':checks,'sources':entry['sources']}
        print(id_,{body:check['maxAngularErrorDeg'] for body,check in checks.items()},flush=True)
    output['passed']=all(c['passed'] for e in output['sites'].values() for c in e['checks'].values())
    (ROOT/'data/validation/orientation-report.json').write_text(json.dumps(output,indent=2)+'\n')
    if not output['passed']:raise ValueError('Independent orientation reference exceeded predeclared tolerance')
    return output

if __name__=='__main__':validate()
