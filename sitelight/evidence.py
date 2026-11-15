"""Conservative extraction of agent evidence. Never interpret it as authoritative."""
from __future__ import annotations
import json
import re
from datetime import date, datetime, timezone

KEYS = {'mission_name', 'page_title', 'source_url', 'previous_landing_utc',
        'revised_landing_utc', 'evidence_excerpt', 'limitations'}


def extract_candidate(text: str) -> dict | None:
    # CopperOS is a probabilistic browser agent; handle markdown-wrapped JSON.
    # The user is responsible for approving facts against the original website.
    decoder = json.JSONDecoder()
    for m in re.finditer(r'\{', text):
        try:
            obj, _ = decoder.raw_decode(text[m.start():])
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict) and {'source_url', 'mission_name'}.issubset(obj):
            return {key: obj.get(key) for key in KEYS}
    return None


def normalize_landing_datetime(value: str) -> str:
    """Require explicit hour and timezone to avoid guessing a landing time."""
    raw = value.strip()
    try:
        d = datetime.fromisoformat(raw.replace('Z', '+00:00'))
    except ValueError as e:
        raise ValueError('Enter a full ISO 8601 UTC timestamp, e.g. 2027-03-12T10:00:00Z.') from e
    if d.tzinfo is None or d.utcoffset().total_seconds() != 0:
        raise ValueError('Landing time must specify UTC (Z or +00:00).')
    return d.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
