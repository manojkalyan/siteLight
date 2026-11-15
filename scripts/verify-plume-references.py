"""Verify pinned references and the two constants selected from JPL's Moon row."""
from pathlib import Path
import hashlib, html, json, re

ROOT = Path(__file__).resolve().parents[1]
spec_path = ROOT / 'data/plume/constants.json'
spec = json.loads(spec_path.read_text(encoding='utf-8'))
manifest = json.loads((ROOT / 'data/plume-inputs.json').read_text(encoding='utf-8'))
for record in manifest['records']:
    raw = (ROOT / 'data/raw/plume' / record['name']).read_bytes()
    if len(raw) != record['bytes'] or hashlib.sha256(raw).hexdigest() != record['sha256']:
        raise ValueError('Pinned plume reference mismatch: ' + record['name'])
source = next(r for r in manifest['records'] if r['name'] == spec['sourceFile'])
text = (ROOT / 'data/raw/plume' / source['name']).read_text(encoding='utf-8')
rows = re.findall(r'<tr\b[^>]*>(.*?)</tr>', text, re.S)
selected = None
for row in rows:
    cells = [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', c))).strip() for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', row, re.S)]
    if cells and cells[0] == spec['row']:
        selected = cells
        break
if not selected or float(selected[1].split()[0]) != spec['gmKm3S2'] or float(selected[2].split()[0]) != spec['meanRadiusKm']:
    raise ValueError('JPL Moon constants transcription mismatch')
report = {'schema':'sitelight-ejecta-transcription-1', 'constantsSpecSha256':hashlib.sha256(spec_path.read_bytes()).hexdigest(),
          'sourceSha256':source['sha256'], 'gmKm3S2':spec['gmKm3S2'], 'meanRadiusKm':spec['meanRadiusKm'], 'status':'verified_transcription',
          'meaning':'Two published constants and three reference checksums verified; no erosion, launch distribution or asset damage calibration.'}
(ROOT / 'data/plume/reference-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('3 pinned sources and 2 JPL Moon constants verified; plume engineering acceptance remains open.')
