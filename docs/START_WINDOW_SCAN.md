# Loaded-record landing-start windows

PRD v4.8, 15 November 2026. Application `workspace-evaluator-10`; scan `loaded-ten-minute-starts-1`.

Open **Calendar → Scan loaded ten-minute starts**. This complements the existing daily preview and 84-start monthly study: it tests every UTC ten-minute grid start whose complete mission is supported by one loaded record window. It uses the selected point, current 48–336-hour duration, solar-elevation requirement, Sun/Earth/overlap fractions and enabled physical-darkness/Earth-outage limits.

## Data and interpretation

- Real mode uses the existing pinned NASA PGDA terrain horizons and DE421 geometric records. No new observations, synthetic replacements or extrapolated dates are introduced. JPL reference mode works with its own declared tangent horizon. Sample mode has no finite record coverage and cannot run this study.
- The initial real bundle covers 1 January through 1 April 2027. The seven-day default therefore has 11,953 candidate grid starts per point. Loaded local-service date blocks can extend the study, within supported 2027–2033 dates. Monthly studies remain a distinct 84-start sample rather than implicit continuous coverage.
- Overlapping source windows are deduplicated for sampling. Every start still passes the provider's full-interval coverage check; disjoint or individually insufficient source windows cannot be bridged into a supported mission.
- Geometry and visibility rules are shared with the full evaluator. Strict horizon comparison, solar-elevation eligibility, separate physical darkness, missing-data handling and partial final-bin weighting remain unchanged.
- Consecutive nominal fits are grouped into ranges of **tested grid starts**, with the last listed start inclusive. The grouping does not establish feasibility at intervening times, continuous event boundaries, global terrain accuracy or operational safety. Real nominal fits remain uncertain. Unknown starts are counted separately and never counted as fits.
- Applying a first/last boundary runs the full evaluator again, including available source-RMS sensitivity. A changed point, source context or requirements invalidates the visible study; changing the selected start alone keeps the applicable loaded-record study. Only the selected scenario changes.

## Algorithm and software behavior

Each loaded time grid is sampled once. Prefix sums compute weighted Sun/Earth/overlap/known hours. A monotone deque over complete false runs, plus clipped boundary runs, computes sliding maximum outages. Unknown bins break known outage continuity. Fractional mission ends retain exact partial-bin weights.

The scan is linear in source bins and candidate starts, rather than running a complete mission evaluator for every start. The UI yields before scanning, exposes busy state and disables scenario/model changes during preparation. Two studies are cached. Large date ranges may still briefly occupy the main thread; worker execution and actual browser responsiveness have not been measured.

JSON and canonical SHA inputs include `landingStartWindows`: model, point, requirements, source windows, counts, grouped fits/unknown ranges and source/acceptance metadata. The print report provides a summary and up to 50 fit windows; the JSON retains all windows. Selecting another point/requirements does not export an old, incompatible study.

## Recorded checks

Run:

```powershell
npm.cmd run start-windows:verify
npm.cmd test
```

[Machine-readable results](START_WINDOW_VALIDATION.json) preserve the scientific-bundle SHA, environment, settings, fit ranges and direct evaluator comparisons at all six study points. Under the default requirements:

| Point | Tested starts | Nominal fits | Unknown |
| --- | ---: | ---: | ---: |
| Shackleton | 11,953 | 0 | 0 |
| Connecting ridge | 11,953 | 0 | 0 |
| de Gerlache | 11,953 | 0 | 0 |
| Nobile | 11,953 | 2,303 | 0 |
| Peak | 11,953 | 0 | 0 |
| Malapert | 11,953 | 0 | 0 |

All 2,303 Nobile fits retain the uncertainty qualification. These results apply to the exact study coordinates and current thresholds, not entire named regions. A no-fit result is valid evidence under those inputs; it is not missing data.

The six local Node scan times were approximately 39–144 ms. There are 270 direct evaluator comparisons, including all fit-range boundaries. Numerical tests additionally compare sliding gaps with an independent brute-force oracle, exercise fractional durations, missing/malformed geometry, strict thresholds, overlapping/disjoint coverage, invalid selections and stale requirements. The bundled DOM test scans real records, applies a boundary, preserves the other scenario and checks report/stale-result behavior. These are software checks; evaluator parity is not independent scientific validation.

## Remaining acceptance

The separate chat browser/native connectors were unavailable. The user-authorized Playwright path now launches Windows Chrome successfully. [The review record](BROWSER_VALIDATION.md) includes the actual start-window UI flow, mobile/table checks, selected screenshot inspection and hardware/context-recovery evidence. Broader accessibility, cross-device and cold-load/long-duration checks remain open.

Global terrain completeness, correlated uncertainty, accepted LCSS equipment/energy/operations data, calibrated dust/plume/full radiation transport and operational vehicle/rescue evidence remain open under [current release status](CURRENT_STATUS.md). This search adds schedule detail without closing those scientific or engineering gates.
