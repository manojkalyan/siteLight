"""Prepare historical context. Never estimate site hazard from these catalogs."""
import csv
import hashlib
import json
import math
import re
import struct
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/seismic-libs'))
from unlzw3 import unlzw
import fitz

OUT = ROOT / 'data/seismic'
RAW = OUT / 'sources'
manifest = json.loads((ROOT / 'data/seismic-inputs.json').read_text(encoding='utf-8'))
sources = {r['name']: r for r in manifest['records']}
digest = lambda b: hashlib.sha256(b).hexdigest()
for name, record in sources.items():
    b = (RAW / name).read_bytes()
    assert len(b) == record['bytes'] and digest(b) == record['sha256'], name

def write(name, value):
    b = (json.dumps(value, ensure_ascii=True, separators=(',', ':'), allow_nan=False) + '\n').encode()
    (OUT / name).write_bytes(b)
    return {'file': name, 'bytes': len(b), 'sha256': digest(b)}

def read_rows(name):
    with (RAW / name).open(newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f, strict=True)
        rows = list(reader)
    assert all(None not in r for r in rows), 'Unexpected CSV columns: ' + name
    return rows

def lon(value):
    return (float(value) + 180) % 360 - 180

def utc(year, day, hour, minute, second):
    t = datetime(int(year), 1, 1, tzinfo=timezone.utc) + timedelta(days=int(day)-1, hours=int(hour), minutes=int(minute), seconds=float(second))
    assert t.year == int(year)
    return t.isoformat(timespec='milliseconds').replace('+00:00', 'Z')

scarps = []
for n, r in enumerate(read_rows('POLAR_SCARP_LOCATIONS.CSV'), 2):
    lat = float(r['Latitude (N)'])
    assert 65 <= abs(lat) <= 90
    scarps.append({'id': 'scarp-' + str(n), 'name': r['Name'], 'lat': lat, 'lon': lon(r['Longitude (E)']), 'sourceLongitudeEast': float(r['Longitude (E)']), 'images': r['Select LROC Images'], 'stereoPairs': r['Stereo Pairs'], 'classification': r['Individual or Cluster (multiple scarps nearby/complex)'], 'sourceRow': n, 'source': 'POLAR_SCARP_LOCATIONS.CSV', 'locationUncertaintyKm': None, 'geometry': 'reference_point_not_fault_trace'})

quakes = []
for n, r in enumerate(read_rows('nakamura_1979_sm_locations.csv'), 2):
    located = r['Lat'] != '' and r['Long'] != ''
    alt = re.search(r'Or lat\s+(-?\d+)\s+long\s+(-?\d+)', r['Comments'])
    quakes.append({'id': 'smq-' + str(n), 'name': 'Shallow moonquake ' + str(n-1), 'lat': float(r['Lat']) if located else None, 'lon': lon(r['Long']) if located else None, 'utc': utc(r['Year'], r['Day'], r['H'], r['M'], r['S']), 'catalogMagnitude': float(r['Magnitude']), 'magnitudeScale': 'source SPZ-envelope amplitude scale; not Mw or directly comparable to modern moment magnitude', 'locationUncertaintyKm': None, 'locationMeaning': 'Historical LM-761 solution assuming 100 km focus depth; not accurate to 1 degree. No numeric uncertainty bound supplied.', 'alternativeLocation': {'lat': float(alt[1]), 'lon': lon(alt[2])} if alt else None, 'comments': r['Comments'], 'sourceRow': n, 'source': 'nakamura_1979_sm_locations.csv'})

impacts = []
for n, r in enumerate(read_rows('nakamura_1983_ai_locations.csv'), 2):
    impacts.append({'id': r['AI'].lower().replace(' ', '-'), 'name': 'Apollo ' + r['AI'], 'lat': float(r['Lat']), 'lon': lon(r['Long']), 'utc': utc(1900+int(r['Y']), r['JD'], r['Hour'], r['Min'], r['Sec']), 'sourceRow': n, 'source': 'nakamura_1983_ai_locations.csv', 'kind': 'controlled_impact_not_natural_moonquake', 'timeMeaning': 'Original archived catalog timestamp; clock/range-time convention retained, not reinterpreted.'})

station_input = json.loads((OUT / 'station-transcriptions.json').read_text())
doc = fitz.open(RAW / station_input['source'])
page = doc[station_input['pdfPage'] - 1].get_text()
stations = []
for s in station_input['stations']:
    assert s['latitudeText'] in page and s['longitudeText'] in page
    assert math.isclose(abs(s['lat']), float(s['latitudeText'][:-1]))
    assert math.isclose(abs(s['lon']), float(s['longitudeText'][:-1]))
    assert (s['lat'] < 0) == s['latitudeText'].endswith('S')
    assert (s['lon'] < 0) == s['longitudeText'].endswith('W')
    stations.append({**s, 'source': station_input['source'], 'pdfPage': 2, 'historicalOnly': True})

waveforms = []
for event_id, name in [('12-lm', 'fpsac.12l.12.lpz.Z'), ('13-s-ivb', 'fpsac.13s.12.lpz.Z')]:
    b = unlzw((RAW / name).read_bytes())
    order = '>' if struct.unpack('>i', b[304:308])[0] == 6 else '<'
    f = struct.unpack(order+'70f', b[:280])
    i = struct.unpack(order+'40i', b[280:440])
    assert i[6] == 6 and i[15] == 1 and i[35] == 1, 'Only evenly sampled SAC v6 time series supported'
    assert 0 < i[9] < 1000000 and len(b) == 632 + i[9]*4
    assert 0 < f[0] < 10 and abs(f[6] - (f[5] + (i[9]-1)*f[0])) < .02
    samples = list(struct.unpack(order+str(i[9])+'f', b[632:]))
    assert all(math.isfinite(v) and v != -12345 for v in samples)
    event = next(e for e in impacts if e['id'] == event_id)
    assert abs(f[35]-event['lat']) < .001 and abs(f[36]-event['lon']) < .001
    reference = utc(i[0], i[1], i[2], i[3], i[4] + i[5]/1000)
    origin = datetime.fromisoformat(reference.replace('Z','+00:00')) + timedelta(seconds=f[7])
    assert abs((origin-datetime.fromisoformat(event['utc'].replace('Z','+00:00'))).total_seconds()) < .01
    text = lambda index: b[440+index*8:448+index*8].decode('ascii').strip()
    assert text(0) == 'A-12' and text(20) == 'LPZ' and i[16] == 7
    metadata = {'id': event_id, 'eventName': event['name'], 'source': name, 'sourceSha256': sources[name]['sha256'], 'decodedSacSha256': digest(b), 'byteOrder': 'big' if order == '>' else 'little', 'headerVersion': i[6], 'channel': text(20), 'station': text(0), 'instrument': text(23), 'archiveReferenceUtc': reference, 'archiveEventUtc': event['utc'], 'beginSeconds': f[5], 'endSecondsHeader': f[6], 'sampleIntervalSeconds': f[0], 'sampleCount': i[9], 'eventOffsetSeconds': f[7], 'durationMinutes': (i[9]-1)*f[0]/60, 'stationHeaderCoordinates': {'lat': f[31], 'lon': f[32]}, 'eventHeaderCoordinates': {'lat': f[35], 'lon': f[36]}, 'idep': i[16], 'idepMeaning': 'SAC IVEL velocity flag; physical units/response calibration not independently established', 'amplitudeMeaning': 'Display normalized by the maximum absolute archive amplitude in the selected window; CSV additionally retains full-record normalization. No instrument-response removal, physical acceleration conversion, coda-duration inference or local site prediction.', 'gapMeaning': 'No separate gap/quality mask supplied with this retained legacy SAC record; finite values and zeros are retained unchanged.', 'absolutePeakArchiveAmplitude': max(abs(v) for v in samples)}
    artifact = write('waveform-'+event_id+'.json', {'metadata': metadata, 'samples': samples})
    waveforms.append({**metadata, 'artifact': artifact})
    (RAW / name.replace('.Z', '.sac')).write_bytes(b)

bundle = {'schema': 'sitelight-seismic-context-1', 'catalogVersion': 'apollo-pds-and-lroc-polar-2015-1', 'scarps': scarps, 'moonquakes': quakes, 'impacts': impacts, 'stations': stations, 'waveforms': waveforms, 'coverage': {'scarpCatalog': 'LROC Watters et al. 2015 polar reference points, absolute latitude 65-90 degrees. Incomplete historical inventory; not the newer 2024 polar fault survey.', 'moonquakes': 'Only the 28 shallow events in the retained historical PDS table; not the complete Apollo event inventory or a live feed.', 'uncertainty': 'Missing error bounds are null, never zero. Alternate source coordinates and unlocated events are preserved.', 'faultGeometry': 'Point locations, not rupture endpoints, mapped fault traces, active-fault distances or hazard buffers.'}, 'sourceRecords': manifest['records'], 'citations': manifest['citations'], 'acceptedForVerdict': False, 'localShakingHazard': 'not_quantified', 'slopeStability': 'not_evaluated'}
artifact = write('context.json', bundle)
validation = {'schema': 'sitelight-seismic-preparation-1', 'sourceFilesVerified': len(sources), 'sourceManifestSha256': digest((ROOT/'data/seismic-inputs.json').read_bytes()), 'preparerSha256': digest(Path(__file__).read_bytes()), 'stationTranscriptionSha256': digest((OUT/'station-transcriptions.json').read_bytes()), 'stationCoordinateChecks': len(stations)*2, 'counts': {'scarpPoints': len(scarps), 'shallowEvents': len(quakes), 'locatedShallowEvents': sum(q['lat'] is not None for q in quakes), 'alternativeLocations': sum(q['alternativeLocation'] is not None for q in quakes), 'controlledImpacts': len(impacts), 'stations': len(stations), 'waveforms': len(waveforms)}, 'contextArtifact': artifact, 'waveformArtifacts': [w['artifact'] for w in waveforms], 'checks': ['Pinned raw byte counts and SHA-256', 'Strict CSV columns and coordinate domains', 'UTC year/day-of-year and fractional seconds', 'PDF station-coordinate tokens and coordinate signs', 'SAC byte order, v6, time-series/even sampling and exact payload length', 'Header interval/end consistency and finite unchanged samples', 'Waveform event coordinate and archived origin-time agreement with PDS', 'Archive peak normalization, no physical calibration or duration claim'], 'acceptance': 'Source/software checks only; no local hazard, prediction, slope-failure or mission-safety verdict.'}
write('preparation-validation.json', validation)
print(json.dumps({'counts': validation['counts'], 'sourcesVerified': len(sources), 'waveforms': [{'id': w['id'], 'samples': w['sampleCount'], 'minutes': w['durationMinutes']} for w in waveforms]}))
