"""Verify the selected NASA architecture's published values and accounting boundaries."""
from pathlib import Path
import json,hashlib,re,unicodedata
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
def main():
    spec_path=ROOT/'data/engineering/nasa-reference-case.json';spec=json.loads(spec_path.read_text());path=ROOT/'data/raw/engineering'/spec['source']['name'];raw=path.read_bytes()
    if len(raw)!=spec['source']['bytes'] or hashlib.sha256(raw).hexdigest()!=spec['source']['sha256']:raise ValueError('Reference study identity changed')
    pdf=PdfReader(path);pages={};checks=[]
    for field in spec['values']:
        page=field['pdfPage']
        if page not in pages:pages[page]=re.sub(r'\s+',' ',unicodedata.normalize('NFKC',pdf.pages[page-1].extract_text()))
        match=re.search(field['pattern'],pages[page])
        if not match or float(match[1])!=field['value']:raise ValueError('Reference value transcription mismatch: '+field['key'])
        checks.append({k:field[k] for k in ['key','value','unit','pdfPage']})
    report={'schema':'sitelight-nasa-reference-transcription-1','sourceSha256':spec['source']['sha256'],'specSha256':hashlib.sha256(spec_path.read_bytes()).hexdigest(),'validatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'status':'verified_transcription','checks':checks,'meaning':'Published reference-study values; physical equipment and selected-site resource calibration are not implied'}
    (ROOT/'data/engineering/nasa-reference-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(str(len(checks))+' NASA reference-study transcriptions verified.')
if __name__=='__main__':main()
