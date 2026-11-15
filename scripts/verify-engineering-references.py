"""Check pinned primary PDF values; this verifies transcription, not model applicability."""
from pathlib import Path
import hashlib, json, logging, re, sys, unicodedata

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/pylibs'))
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)

def verify():
    manifest = json.loads((ROOT / 'data/engineering-inputs.json').read_text())
    spec_path = ROOT / 'data/engineering/references.json'
    spec = json.loads(spec_path.read_text())
    checks = []
    for reference in spec['references']:
        record = next(r for r in manifest['records'] if r['name'] == reference['file'])
        path = ROOT / 'data/raw/engineering' / record['name']
        raw = path.read_bytes()
        if len(raw) != record['bytes'] or hashlib.sha256(raw).hexdigest() != record['sha256']:
            raise ValueError('Source checksum mismatch: ' + record['name'])
        reader = PdfReader(path)
        pages = {}
        for observation in reference['observations']:
            page = observation['pdfPage']
            if page not in pages:
                pages[page] = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', reader.pages[page - 1].extract_text()))
            match = re.search(observation['pattern'], pages[page])
            if not match or float(match.group(1)) != observation['value']:
                raise ValueError('Published value mismatch: ' + observation['id'])
            checks.append({'reference': reference['id'], 'observation': observation['id'], 'pdfPage': page,
                           'value': observation['value'], 'sourceSha256': record['sha256'], 'status': 'verified_transcription'})
    report = {'schema': 'sitelight-engineering-transcription-1',
              'referenceSpecSha256': hashlib.sha256(spec_path.read_bytes()).hexdigest(),
              'meaning': 'Pinned PDF value transcription checks only; no architecture calibration or engineering acceptance.',
              'checks': checks}
    (ROOT / 'data/engineering/reference-validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{len(checks)} pinned primary-source value checks passed. Engineering acceptance remains open.')

if __name__ == '__main__':
    verify()
