from __future__ import annotations
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .copper import CopperClient, validate_official_url
from .evidence import extract_candidate, normalize_landing_datetime
from .mission import VisibilityTable

BASE = Path(__file__).resolve().parents[1]
load_dotenv(BASE / '.env')
app = FastAPI(title='SiteLight AI — CopperOS Evidence Connector', version='0.1.0')
app.mount('/static', StaticFiles(directory=BASE / 'static'), name='static')
client = CopperClient()
visibility = VisibilityTable(BASE / 'data' / 'sample_visibility.csv')
jobs = {}    # Single-user prototype: in memory; resets on restart.
approvals = []

class ResearchRequest(BaseModel):
    mission: str = Field(min_length=2, max_length=120)
    url: str = Field(min_length=12, max_length=1800)

class ApprovedEvidence(BaseModel):
    mission: str = Field(min_length=2, max_length=120)
    source_url: str
    approved_landing_utc: str
    evidence_excerpt: str = Field(default='', max_length=400)
    user_reviewed_original: bool
    job_id: str | None = None

class CompareRequest(BaseModel):
    original_landing_utc: str
    proposed_landing_utc: str
    duration_hours: int = Field(default=24, ge=1, le=72)
    min_sun_fraction: float = Field(default=.65, ge=0, le=1)
    min_earth_fraction: float = Field(default=.5, ge=0, le=1)

@app.get('/')
async def index():
    return FileResponse(BASE / 'static' / 'index.html')

@app.get('/dashboard')
async def dashboard():
    return FileResponse(BASE / 'static' / 'dark.html')

@app.get('/api/health')
async def health():
    return {'ok': True, 'service': 'SiteLight AI local prototype',
            'science': 'synthetic sample data, not NASA predictions'}

@app.get('/api/copper/status')
async def copper_status():
    return await client.health()

async def perform_research(job_id: str, mission: str, url: str):
    jobs[job_id]['status'] = 'running'
    try:
        output = await client.run_research(mission, url)
        result_status = output.get('status', 'error')
        raw = str(output.get('text') or '')[:16000]
        candidate = extract_candidate(raw) if result_status == 'done' else None
        # Block cross-source evidence substitution, even if the model produces convincing JSON.
        if candidate:
            try:
                returned_url = validate_official_url(str(candidate.get('source_url') or ''))
            except ValueError:
                candidate = None
            else:
                supplied = urlparse(url)
                returned = urlparse(returned_url)
                if (returned.hostname or '').lower() != (supplied.hostname or '').lower():
                    candidate = None
        jobs[job_id].update(status=result_status, text=raw, candidate=candidate,
                             steps=output.get('steps'), chat_id=output.get('chatId'),
                             completed_at=datetime.now(timezone.utc).isoformat())
        if result_status != 'done':
            jobs[job_id]['error'] = str(output.get('error') or output.get('request') or 'CopperOS did not complete the task.')
    except Exception as e:
        jobs[job_id].update(status='error', error=str(e), completed_at=datetime.now(timezone.utc).isoformat())

@app.post('/api/evidence/start', status_code=202)
async def evidence_start(req: ResearchRequest):
    try:
        url = validate_official_url(req.url)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    if not client.enabled:
        raise HTTPException(503, 'CopperOS token is not configured. You can use Manual Evidence Review instead.')
    health_status = await client.health()
    if not health_status.get('connected'):
        raise HTTPException(503, health_status.get('reason', 'CopperOS broker unavailable'))
    if any(job['status'] in ('queued', 'running') for job in jobs.values()):
        raise HTTPException(409, 'A browser task is already running. CopperOS handles one at a time.')
    job_id = str(uuid.uuid4())
    jobs[job_id] = {'job_id': job_id, 'mission': req.mission, 'url': url,
                    'status': 'queued', 'created_at': datetime.now(timezone.utc).isoformat(),
                    'text': '', 'candidate': None}
    asyncio.create_task(perform_research(job_id, req.mission, url))
    return {'job_id': job_id, 'status': 'queued'}

@app.get('/api/evidence/{job_id}')
async def evidence_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, 'Unknown task')
    return job

@app.post('/api/evidence/approve')
async def evidence_approve(req: ApprovedEvidence):
    if not req.user_reviewed_original:
        raise HTTPException(422, 'Review the original source before approving evidence.')
    try:
        source = validate_official_url(req.source_url)
        ts = normalize_landing_datetime(req.approved_landing_utc)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    if req.job_id:
        j = jobs.get(req.job_id)
        if not j or j['status'] != 'done' or urlparse(j['url']).hostname != urlparse(source).hostname:
            raise HTTPException(422, 'Research job/source mismatch. Use the original approved source.')
    record = {'id': str(uuid.uuid4()), 'mission': req.mission, 'source_url': source,
              'approved_landing_utc': ts, 'excerpt': req.evidence_excerpt,
              'user_reviewed_original': True, 'approved_at': datetime.now(timezone.utc).isoformat(),
              'evidence_classification': 'User-reviewed source assertion; not independently authenticated'}
    approvals.append(record)
    return record

@app.get('/api/approvals')
async def evidence_approved():
    return {'items': approvals[-25:]}

@app.get('/api/sample/info')
async def sample_info():
    dates = [d for per_site in visibility.data.values() for d in per_site]
    return {'sites': visibility.sites(), 'start': min(dates).isoformat().replace('+00:00','Z'),
            'end': max(dates).isoformat().replace('+00:00','Z'),
            'classification': 'SYNTHETIC TRAINING DATA — not NASA measured values',
            'resolution_hours': 1}

@app.post('/api/mission/compare')
async def mission_compare(req: CompareRequest):
    try:
        original = datetime.fromisoformat(normalize_landing_datetime(req.original_landing_utc).replace('Z', '+00:00'))
        proposed = datetime.fromisoformat(normalize_landing_datetime(req.proposed_landing_utc).replace('Z', '+00:00'))
        return visibility.compare(original, proposed, req.duration_hours, req.min_sun_fraction, req.min_earth_fraction)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
