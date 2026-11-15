import asyncio
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from sitelight.copper import CopperClient, validate_official_url, research_prompt
from sitelight.evidence import extract_candidate, normalize_landing_datetime
from sitelight.mission import VisibilityTable
from sitelight.main import app

ROOT = Path(__file__).resolve().parents[1]
client = TestClient(app)

@pytest.mark.parametrize('url', [
    'https://www.nasa.gov/path', 'https://ssd.jpl.nasa.gov/horizons/',
    'https://pradan.issdc.gov.in/ch3/', 'https://www.isro.gov.in/',
    'https://www.esa.int/some/path', 'https://www.jaxa.jp/',
])
def test_public_agencies_allowed(url):
    assert validate_official_url(url) == url

@pytest.mark.parametrize('url', [
    'http://www.nasa.gov/', 'https://nasa.gov.evil.example/page',
    'https://127.0.0.1:7332/api/health', 'file:///etc/passwd',
    'https://evil.example/', 'https://username:pass@nasa.gov/path',
])
def test_block_unapproved_sites(url):
    with pytest.raises(ValueError):
        validate_official_url(url)

def test_copper_restricts_broker_origin():
    with pytest.raises(ValueError):
        CopperClient(token='testtoken', base='http://malicious.com:7332')

def test_research_task_is_read_only_and_does_not_assert_dates():
    task=research_prompt('Test lunar mission','https://www.nasa.gov/missions')
    assert 'READ-ONLY' in task and 'Do not infer' in task
    assert 'https://www.nasa.gov/missions' in task

def test_candidate_extraction_without_trusting_content():
    s='Report:\n```json\n{"mission_name":"Luna","source_url":"https://www.nasa.gov","revised_landing_utc":null}\n```'
    data=extract_candidate(s)
    assert data['revised_landing_utc'] is None

def test_utc_timestamp_requires_explicit_time():
    assert normalize_landing_datetime('2027-03-12T10:00:00Z')=='2027-03-12T10:00:00Z'
    for s in ['2027-03-12', '2027-03-12T10:00:00', '2027-03-12T11:00:00+01:00']:
        with pytest.raises(ValueError):
            normalize_landing_datetime(s)

def test_samples_evaluate_and_alternatives():
    engine=VisibilityTable(ROOT/'data/sample_visibility.csv')
    original=datetime(2027,3,10,10,tzinfo=timezone.utc)
    shifted=datetime(2027,3,12,10,tzinfo=timezone.utc)
    r=engine.compare(original, shifted, 24, .65, .5)
    assert r['data_classification'].startswith('SYNTHETIC')
    assert r['shift_hours']==48
    assert len(r['comparisons'])==3
    for item in r['comparisons']:
        assert item['after']['status'] in ('pass','fail')
        assert len(item['after']['timeline'])==24

def test_unknown_sample_period_reports_insufficient_data():
    engine=VisibilityTable(ROOT/'data/sample_visibility.csv')
    res=engine.evaluate('Training Ridge A',datetime(2028,1,1,tzinfo=timezone.utc),24,.5,.5)
    assert res['status']=='insufficient_data'

def test_api_has_working_science_screening_without_broker():
    r=client.post('/api/mission/compare',json={
        'original_landing_utc':'2027-03-10T10:00:00Z',
        'proposed_landing_utc':'2027-03-12T10:00:00Z',
        'duration_hours':24,'min_sun_fraction':.65,'min_earth_fraction':.5})
    assert r.status_code==200
    assert r.json()['shift_hours']==48

def test_evidence_needs_explicit_user_review():
    r=client.post('/api/evidence/approve',json={
        'mission':'Test mission','source_url':'https://www.nasa.gov/',
        'approved_landing_utc':'2027-03-12T10:00:00Z','user_reviewed_original':False})
    assert r.status_code==422

def test_evidence_rejects_date_only_even_when_user_reviewed():
    r=client.post('/api/evidence/approve',json={
        'mission':'Test mission','source_url':'https://www.nasa.gov/',
        'approved_landing_utc':'2027-03-12','user_reviewed_original':True})
    assert r.status_code==422

def test_root_loads_and_has_no_cdn_dependence():
    r=client.get('/')
    assert r.status_code==200 and 'Mission Change Analyzer' in r.text
    assert 'https://cdn.' not in r.text

def test_original_dark_dashboard_is_included():
    r=client.get('/dashboard')
    assert r.status_code==200 and 'SiteLight AI' in r.text

def test_approved_endpoint_not_masked_by_job_router():
    r=client.get('/api/approvals')
    assert r.status_code==200 and 'items' in r.json()

def test_first_breakpoint_is_reproducible_or_explicitly_absent():
    r=client.post('/api/mission/compare',json={
        'original_landing_utc':'2027-03-10T10:00:00Z',
        'proposed_landing_utc':'2027-03-12T10:00:00Z',
        'duration_hours':24,'min_sun_fraction':.65,'min_earth_fraction':.5}).json()
    for comp in r['comparisons']:
        assert 'first_status_change' in comp
        if comp['first_status_change']:
            assert 'at_utc' in comp['first_status_change']

def test_copper_posts_to_documented_singular_task_endpoint(monkeypatch):
    import httpx
    import sitelight.copper as module
    seen=[]
    def handler(request):
        seen.append(request)
        assert request.method=='POST'
        assert request.url.path=='/api/task'
        assert request.headers['Authorization']=='Bearer testtoken'
        body=__import__('json').loads(request.content)
        assert body['approvalMode']=='submits'
        assert body['rules'].startswith('READ ONLY')
        assert body['timeoutMs']==180000
        return httpx.Response(200,json={'status':'done','text':'No landing date published','steps':3,'chatId':'abc'})
    orig = module.httpx.AsyncClient
    # Lightweight in-memory CopperOS broker, rather than a live browser task.
    def factory(*args,**kwargs):
        kwargs['transport']=httpx.MockTransport(handler)
        return orig(*args,**kwargs)
    monkeypatch.setattr(module.httpx,'AsyncClient',factory)
    result=asyncio.run(CopperClient(token='testtoken').run_research('Test mission','https://www.nasa.gov/'))
    assert result['status']=='done'
    assert len(seen)==1
