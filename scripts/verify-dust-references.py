"""Verify the selected Table 2 material rows against pinned primary PDF bytes."""
from pathlib import Path
import hashlib, json, logging, re, sys, unicodedata

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/pylibs'))
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)

def verify():
    manifest = json.loads((ROOT / 'data/dust-inputs.json').read_text(encoding='utf-8'))
    spec_path = ROOT / 'data/dust/materials.json'
    spec = json.loads(spec_path.read_text(encoding='utf-8'))
    for record in manifest['records']:
        raw = (ROOT / 'data/raw/dust' / record['name']).read_bytes()
        if len(raw) != record['bytes'] or hashlib.sha256(raw).hexdigest() != record['sha256']:
            raise ValueError('Pinned dust reference mismatch: ' + record['name'])
    source = next(r for r in manifest['records'] if r['name'] == spec['sourceFile'])
    reader = PdfReader(ROOT / 'data/raw/dust' / source['name'])
    text = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', reader.pages[spec['pdfPage']-1].extract_text()))
    checks = []
    # Table columns are fine alpha, coarse alpha, fine epsilon, coarse epsilon.
    for material in spec['materials']:
        match = re.search(r'(?<![A-Za-z0-9-])' + re.escape(material['rowLabel']) + r'\s+([0-9.]+)\s+(?:[0-9.]+|---)\s+([0-9.]+)\s+(?:[0-9.]+|---)(?![0-9.])', text)
        if not match or (float(match.group(1)), float(match.group(2))) != (material['alpha'], material['epsilon']):
            raise ValueError('Dust material transcription mismatch: ' + material['id'])
        checks.append({'material': material['id'], 'alpha': material['alpha'], 'epsilon': material['epsilon'],
                       'pdfPage': spec['pdfPage'], 'sourceSha256': source['sha256'], 'status': 'verified_transcription'})
    report = {'schema':'sitelight-dust-transcription-1', 'materialSpecSha256':hashlib.sha256(spec_path.read_bytes()).hexdigest(),
              'meaning':'Three laboratory material rows (six numeric properties); not validation of a dusty radiator or lunar site.', 'checks':checks}
    (ROOT / 'data/dust/reference-validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('3 pinned material rows / 6 optical values verified; radiator calibration remains open.')

if __name__ == '__main__':
    verify()
