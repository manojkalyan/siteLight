"""Deterministic screening on EXPLICITLY SYNTHETIC hourly samples.

Replace data/sample_visibility.csv with independently validated LOLA + SPICE
terrain-corrected visibility before using outside the classroom/demo.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import csv
from pathlib import Path

@dataclass(frozen=True)
class Sample:
    sun: bool
    earth: bool

class VisibilityTable:
    def __init__(self, file: Path):
        self.data: dict[str, dict[datetime, Sample]] = {}
        with file.open(newline='', encoding='utf-8') as f:
            for r in csv.DictReader(f):
                dt = datetime.fromisoformat(r['timestamp_utc'].replace('Z', '+00:00')).astimezone(timezone.utc)
                self.data.setdefault(r['site_id'], {})[dt] = Sample(r['sun_visible'] == '1', r['earth_visible'] == '1')
        if not self.data:
            raise ValueError('Empty visibility table')

    def sites(self) -> list[str]:
        return sorted(self.data)

    def evaluate(self, site: str, at: datetime, duration_hours: int, min_sun: float, min_earth: float):
        if site not in self.data:
            raise ValueError('Unknown candidate site')
        if at.minute or at.second or at.microsecond:
            raise ValueError('Demo sample resolution is one hour; select an exact UTC hour.')
        timeline = []
        for i in range(duration_hours):
            t = at + timedelta(hours=i)
            sample = self.data[site].get(t)
            if sample is None:
                return {'site': site, 'status': 'insufficient_data', 'reason': 'No verified values for the full period.',
                        'evaluated_hours': len(timeline), 'required_hours': duration_hours}
            timeline.append({'time': t.isoformat().replace('+00:00', 'Z'), 'sun': sample.sun, 'earth': sample.earth})
        sun_hours = sum(x['sun'] for x in timeline)
        earth_hours = sum(x['earth'] for x in timeline)
        sun_ratio = sun_hours / duration_hours
        earth_ratio = earth_hours / duration_hours
        passes = sun_ratio >= min_sun and earth_ratio >= min_earth
        return {'site': site, 'status': 'pass' if passes else 'fail', 'sun_hours': sun_hours,
                'earth_hours': earth_hours, 'sun_fraction': round(sun_ratio, 4),
                'earth_fraction': round(earth_ratio, 4), 'duration_hours': duration_hours,
                'reason': ('All selected demonstration thresholds met.' if passes else
                          ', '.join(x for x in [
                              'Sunlight below threshold' if sun_ratio < min_sun else '',
                              'Earth visibility below threshold' if earth_ratio < min_earth else ''] if x)),
                'timeline': timeline}

    def compare(self, original: datetime, proposed: datetime, duration_hours: int = 24,
                min_sun: float = .65, min_earth: float = .5):
        if duration_hours < 1 or duration_hours > 72:
            raise ValueError('Duration must be between 1 and 72 hours')
        if not 0 <= min_sun <= 1 or not 0 <= min_earth <= 1:
            raise ValueError('Fractions must be between 0 and 1')
        scenarios = []
        for site in self.sites():
            before = self.evaluate(site, original, duration_hours, min_sun, min_earth)
            after = self.evaluate(site, proposed, duration_hours, min_sun, min_earth)
            # Scan the exact hourly boundary between original and proposed times,
            # capped to seven days to keep a fast and bounded local prototype.
            first_change = None
            delta_hours = int((proposed-original).total_seconds() // 3600)
            if 0 < abs(delta_hours) <= 168 and (proposed-original).total_seconds() % 3600 == 0:
                direction = 1 if delta_hours > 0 else -1
                previous_status = before['status']
                for h in range(direction, delta_hours + direction, direction):
                    point = original + timedelta(hours=h)
                    status = self.evaluate(site, point, duration_hours, min_sun, min_earth)['status']
                    if status != previous_status:
                        first_change = {'at_utc': point.isoformat().replace('+00:00', 'Z'),
                                        'hours_from_original': h,
                                        'from_status': previous_status, 'to_status': status}
                        break
                    previous_status = status
            scenarios.append({'site': site, 'before': before, 'after': after,
                              'first_status_change': first_change})
        # Search nearest valid hour within 3 days, not just nearby days; avoids claiming full mission optimization.
        alternatives = []
        for offset in sorted(range(-72, 73), key=lambda x: (abs(x), x)):
            if offset == 0: continue
            t = proposed + timedelta(hours=offset)
            for site in self.sites():
                v = self.evaluate(site, t, duration_hours, min_sun, min_earth)
                if v['status'] == 'pass':
                    alternatives.append({'site': site, 'time': t.isoformat().replace('+00:00', 'Z'),
                                         'hours_from_proposed': offset, 'sun_fraction': v['sun_fraction'],
                                         'earth_fraction': v['earth_fraction']})
            if len(alternatives) >= 5: break
        return {'data_classification': 'SYNTHETIC DEMO — not NASA mission advice',
                'sample_resolution': '1 hour', 'original': original.isoformat().replace('+00:00','Z'),
                'proposed': proposed.isoformat().replace('+00:00','Z'),
                'shift_hours': round((proposed-original).total_seconds()/3600,2),
                'constraints': {'duration_hours': duration_hours,'minimum_sun_fraction': min_sun,
                                'minimum_earth_fraction': min_earth},
                'comparisons': scenarios, 'nearby_example_alternatives': alternatives[:5],
                'limitations': 'Synthetic binary Sun/Earth flags, not terrain-corrected NASA predictions; real power and RF links require vehicle-specific models.'}
