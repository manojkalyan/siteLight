"""Prepare independent historical detector observations and NIST primary-proton ranges."""
from pathlib import Path
from html.parser import HTMLParser
import datetime as dt
import hashlib, json, math, re

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/radiation'

class SourceTable(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=[]; self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=='tr': self.row=[]
        if tag in ('td','th'): self.cell=''
    def handle_data(self,data):
        if self.cell is not None: self.cell+=data
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.cell is not None:
            self.row.append(re.sub(r'\s+',' ',self.cell).strip()); self.cell=None
        if tag=='tr': self.rows.append(self.row)

def parse_observations(text):
    table=SourceTable(); table.feed(text)
    if 'mGy' not in text or 'Lunar Shadowing' not in text: raise ValueError('Unrecognized CRaTER quantity/header')
    expected=['Date','YearDOY']+[f'D{i}DoseRatemGySid1' for i in range(1,7)]+[f'D{i}CorrectedDoseRatemGySid1' for i in range(1,7)]+['DayCoverage','']
    if not table.rows or [re.sub(r'[^A-Za-z0-9]','',s) for s in table.rows[0]]!=expected: raise ValueError('CRaTER detector column/unit order changed')
    records=[]; dates=set()
    for index,row in enumerate(table.rows,1):
        if not row or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',row[0]): continue
        if len(row)!=16 or row[-1]!='': raise ValueError('CRaTER column contract changed')
        date=dt.date.fromisoformat(row[0])
        if row[1]!=date.strftime('%Y%j') or row[0] in dates: raise ValueError('CRaTER date/DOY mismatch or duplicate')
        dates.add(row[0]); coverage=float(row[14].removesuffix('%')) if row[14].endswith('%') else None
        if coverage is None and row[14] not in ('AB','NA','NE'): raise ValueError('Unrecognized daily coverage flag')
        if coverage is not None and not 0<=coverage<=100: raise ValueError('Invalid daily coverage')
        values=[]
        for value in row[2:14]:
            if value in ('','N/A','NA','AB','NE','NaN','nan','-999','-9999'): values.append(None); continue
            number=float(value)
            if not math.isfinite(number) or number<0: raise ValueError('Unrecognized dose-rate value')
            values.append(number)
        records.append({'date':row[0],'yearDoy':row[1],'measuredMgySiDay':values[:6],'shadowCorrectedMgySiDay':values[6:],'coveragePercent':coverage,'coverageFlag':row[14] if coverage is None else None,'sourceRateFlags':[None if value is not None else raw for value,raw in zip(values,row[2:14])],'sourceTableRow':index})
    if not records: raise ValueError('No CRaTER observations')
    return sorted(records,key=lambda r:r['date'])

def parse_pstar(text):
    if 'RANGE(c) = csda range, g/cm2' not in text or 'T = Proton kinetic energy, MeV' not in text: raise ValueError('Unrecognized NIST units/columns')
    rows=[]
    for line_number,line in enumerate(text.splitlines(),1):
        parts=line.split()
        if len(parts)!=7 or not re.fullmatch(r'\d\.\d+E[+-]\d+',parts[0]): continue
        v=[float(p) for p in parts]
        if not all(math.isfinite(x) and x>0 for x in v): raise ValueError('Invalid NIST numeric row')
        rows.append({'energyMeV':v[0],'electronicStoppingMeVCm2G':v[1],'nuclearStoppingMeVCm2G':v[2],'totalStoppingMeVCm2G':v[3],'csdaRangeGcm2':v[4],'projectedRangeGcm2':v[5],'detourFactor':v[6],'sourceLine':line_number})
    if len(rows)<100 or any(b['energyMeV']<=a['energyMeV'] or b['csdaRangeGcm2']<=a['csdaRangeGcm2'] for a,b in zip(rows,rows[1:])): raise ValueError('Incomplete or nonmonotonic NIST range table')
    return rows

def prepare():
    manifest=json.loads((ROOT/'data/radiation-inputs.json').read_text(encoding='utf-8'))
    for record in manifest['records']:
        raw=(RAW/record['name']).read_bytes()
        if len(raw)!=record['bytes'] or hashlib.sha256(raw).hexdigest()!=record['sha256']: raise ValueError('Radiation source mismatch: '+record['name'])
    materials={}
    for key,name in [('aluminum','Aluminum'),('polyethylene','Polyethylene'),('water','Water, liquid')]:
        table_text=(RAW/f'pstar-{key}.txt').read_text(encoding='utf-8')
        expected_name=name.upper()
        if not re.search(r'^\s*'+re.escape(expected_name)+r'\s*$',table_text,re.M): raise ValueError('NIST material name mismatch')
        rows=parse_pstar(table_text)
        composition=(RAW/f'pstar-{key}-composition.txt').read_text(encoding='utf-8')
        if 'Composition of '+expected_name+':' not in composition: raise ValueError('NIST composition material mismatch')
        match=re.search(r'Density \(g/cm3\)\s*=\s*([\d.E+-]+)',composition)
        if not match: raise ValueError('Missing NIST reference density')
        materials[key]={'name':name,'densityGcm3':float(match.group(1)),'densityContext':'NIST material reference; actual hardware/environment density not measured','rows':rows,'sourceName':f'pstar-{key}.txt','compositionSourceName':f'pstar-{key}-composition.txt'}
    records=parse_observations((RAW/'crater-daily-dose.html').read_text(encoding='utf-8'))
    bundle={'schema':'sitelight-radiation-evidence-1','preparationVersion':'radiation-prepare-1','sources':manifest['records'],
        'crater':{'sourceName':'crater-daily-dose.html','classification':'UNH CRaTER PI legacy derived orbital observations','quantity':'absorbed dose rate in silicon','unit':'mGy_Si/day','start':records[0]['date'],'end':records[-1]['date'],'records':records,'correction':'Lunar-shadow correction supplied by source; not a surface dose conversion','uncertainty':None},
        'pstar':{'classification':'NIST tabulated primary-proton CSDA ranges, SRD 124','energyUnit':'MeV','rangeUnit':'g/cm2','materials':materials,'incidentDomainMeV':[1,1000],'secondaryDose':'not_evaluated'}}
    out=ROOT/'data/radiation';out.mkdir(exist_ok=True)
    target=out/'radiation-evidence.json';target.write_text(json.dumps(bundle,separators=(',',':'),ensure_ascii=True)+'\n',encoding='utf-8')
    report={'schema':'sitelight-radiation-preparation-1','status':'source_contracts_verified','bundleSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'preparerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'craterRecords':len(records),'craterStart':records[0]['date'],'craterEnd':records[-1]['date'],'nistRows':{k:len(v['rows']) for k,v in materials.items()},'sources':manifest['records'],'meaning':'Source/units/preparation checks only; no full space-radiation transport or health acceptance.'}
    (out/'build-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(f"Prepared {len(records)} historical CRaTER days and {sum(len(m['rows']) for m in materials.values())} NIST range rows. Dose/secondary transport remains unassessed.")

if __name__=='__main__': prepare()
