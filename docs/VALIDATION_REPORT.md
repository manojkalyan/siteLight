# SiteLight validation report

**15 November 2026 scientific/engineering verification:** [The completed audit](SCIENTIFIC_ENGINEERING_VERIFICATION.md) records 69 pinned files, 744 expanded JPL/CSPICE comparisons across six points and 31 epochs in 2027-2033, six passing terrain convergence cases, 168 JavaScript regressions and 10 Python fixtures. All declared checks pass. Full physical scientific acceptance and engineering calibration remain open: independent terrain/global/correlated-error evidence is incomplete, and all 20 LCSS architecture inputs plus local ice remain assumptions. The report lists required evidence input by input; no accepted-verdict flag or runtime model was changed.

**15 November 2026 rendered-browser follow-up:** **12 Playwright checks pass (11 UI + one headed Windows Chrome review), and all 168 JavaScript/API/DOM regressions pass.** Chrome 157 reports AMD/Direct3D11 hardware rendering. Context loss/restore, rendered desktop/mobile screens and approximately 60 Hz animation-frame cadence were observed. Mobile overflow/layout and the stale recovery notice were corrected. [Methods, retained results, screenshots and remaining limits](BROWSER_VALIDATION.md) distinguish this single-machine review from full accessibility, cross-device, scientific or engineering acceptance. Production/offline builds pass and the four earlier prototype fingerprints are preserved.

**v4.8 start-window follow-up, 15 November 2026:** **168 application checks and eight Python fixtures pass.** [The six-point audit](START_WINDOW_VALIDATION.json) checks 11,953 starts per point, with 270 full-evaluator comparisons and all nominal-fit boundary rechecks. Eight dedicated cases test sliding gaps against an independent brute-force oracle, exact/fractional mission endpoints, missing/malformed samples, coverage overlap/disjointness, invalid or stale selections and real-data parity. The bundled UI case applies a real Nobile boundary, preserves A, invalidates changed requirements and checks JSON/print representation. Local Node scans take approximately 39–144 ms; [compute benchmarks](performance/latest.json) pass, without establishing browser latency. Both builds pass; four prototypes are preserved. Both supported browser/native connectors still fail before inspection, so rendered/GPU acceptance remains open. [Methods and limits](START_WINDOW_SCAN.md) retain the distinction between grid screening and scientific/operational acceptance. Earlier counts below are historical snapshots.

**v4.7 partial radiation follow-up, 15 November 2026:** **159 application checks and eight Python scientific/ingestion fixtures pass.** Preparation verifies nine source assets, 1285 archived CRaTER days and 396 NIST rows. Seven dedicated radiation cases verify source/quantity identities, exact endpoints/exhaustion, bounded inverse interpolation, mass/density units, observed/derived silicon rates, flags and state isolation. Two ingestion cases preserve zeros/flags/coverage and reject changed detector-unit/date contracts. Bundled controls and reports preserve A/B and historical/environmental separation. Both builds pass and four earlier prototypes are preserved. [Methods](RADIATION_MODEL.md) and [examples](RADIATION_VALIDATION.json) record the narrow scope; full dose/secondary transport and browser/GPU acceptance remain open. Earlier counts are historical snapshots.

**v4.6 ejecta follow-up, 15 November 2026:** **151 application checks pass.** Seven dedicated ejecta cases verify pinned constant identities, closed-form surface range, agreement with six independent Cartesian RK4 reference cases, asset geometry/top entry/bearing rotation, grain mass/energy scaling, invalid input handling, transactional assets and A/B isolation. The bundled UI case covers hypothetical release/assets, escaped names, rejected inputs and reports; pending preparation also disables asset actions. Three reference hashes/two JPL constants pass verification; production/offline builds pass and four prototypes remain unchanged. [Methods](PLUME_EJECTA_MODEL.md) and [example results](PLUME_VALIDATION.json) retain the qualifications. Engine-driven erosion, source distributions, actual terrain interception, physical damage and rendered-browser acceptance remain open. Earlier counts below are historical snapshots.

**v4.5 dust/radiator follow-up:** The full application suite has **143 passing JavaScript/API/DOM checks**. Three laboratory material rows/six optical values pass pinned primary-PDF transcription checks. Seven dedicated dust cases cover source identities, exact blackbody balance, area scaling, mixed optics, radiative boundary weighting, signed warming/cooling, negative capacity, input rejection and state isolation. The bundled UI case verifies presets/custom inputs, curve/report output, A/B and historical-observation isolation; loading guards are also checked. Production/offline builds pass and four earlier prototypes are preserved. [Dust methods](DUST_THERMAL_MODEL.md) and [example outputs](DUST_VALIDATION.json) retain assumptions and evidence. The initial mixture model is not conservative and has no dusty-coating, layer-conduction/transient or operational thermal acceptance. Rendered browser/GPU review remains unverified. Earlier counts below are historical snapshots.

**v4.1 reliability follow-up:** [Current status](CURRENT_STATUS.md) records stronger custom response/source-index contracts, loading guards, service error/timeout handling and corrected unsupported-search summaries. The prepared [rendered review procedure](APPLICATION_REVIEW.md) does not constitute a browser pass. The latest supported inventory still reports an unavailable browser access host and native pipe OS error 2.

**Follow-up:** The sampling findings below describe the original production grid. [The v4.0 refinement](SAMPLING_REFINEMENT.md) extends the audit to all six points and refines production sampling. All six refined comparisons are below the 0.1° diagnostic trigger; 114 application checks and 6 scientific checks pass. The remaining global/engineering/browser limits still apply. The current audit JSON is version-tied; original-grid values are retained in [the baseline JSON](HORIZON_SAMPLING_BASELINE.json).

Date: 14 November 2026. Scope: PRD v3.9 implementation, local numerical/data checks, application/DOM/API regression, production packaging, and attempted rendered browser inspection.

**Outcome: software and bounded numerical checks pass; full scientific, engineering and rendered browser acceptance is incomplete.**

## Evidence

| Area | Result | Practical limit |
| --- | --- | --- |
| Application regression | 113 JavaScript/API/DOM checks pass after the fixes below | DOM execution is not rendered browser/GPU validation |
| Scientific fixtures | 5 Python checks pass | Local axes, pixel registration/no-data, analytic spherical dip, multiscale coverage and perturbation ordering; no global accuracy certification |
| Independent angle cases | All 18 apparent AZ/EL cases pass predeclared 0.01° tolerance; maximum error 0.0000085066° | Three points, two targets, three epochs; production remains geometric NONE |
| Raw data integrity | Every input in the scientific bundle reproduces its pinned SHA-256 | Provenance verifies identity, not source accuracy |
| Terrain convergence | New denser-ray audit completed for Shackleton and Nobile | Both exceed the 0.1° diagnostic review trigger in a few directions; see below |
| LCSS | Independently calculated water/capacity/mass fixtures, power/storage behavior, threshold/search and UI/isolation checks pass | Engineering masses/energy/operations remain assumptions; result stays exploratory |
| Production / offline build | Both pass; four earlier prototype fingerprints preserved | Main script approximately 13.26 MB / 4.83 MB gzip; offline HTML approximately 14.03 MB |
| Local service | Application responds HTTP 200; existing regressions cover real future-date loading | No claim of hosted-service deployment |
| Browser / GPU / real accessibility | Could not complete | Windows computer-use native pipe returned OS error 2 before any window could be inspected; fresh-session retry returned the same error |

## New terrain convergence audit

`scripts/validate-horizon-sampling.py` verifies all pinned raw input hashes and compares the production 1°/5 m/80 m horizon with 0.5° azimuths, 2.5 m local radial steps and 40 m far-field radial steps, retaining the same source DEMs, observer and 125 km extent. It processes rays in small batches and reads a bounded polar raster window. It does not change the production terrain artifact or its algorithm hash.

| Point | Maximum difference | 95th percentile | Half-degree sectors above 0.1° | Geometric visibility samples changed, Sun / Earth |
| --- | --- | --- | --- | --- |
| Shackleton | 0.125173° | 0.035656° | 2 of 720 | 1 / 0 |
| Nobile | 0.111460° | 0.031917° | 3 of 720 | 1 / 0 |

The comparison includes 12,961 packaged time records per point, including its terminal record. These changed-sample counts are not event-time errors or daily availability guarantees. The 0.1° threshold was declared in the validation script as a **diagnostic review trigger**, not an approved mission accuracy requirement. Dense sampling of the same interpolated raster is a convergence study, not independent terrain truth. The finer local spacing also samples terrain between the first production 5 m point and the observer.

For the default 13 January 2027 / 168-hour / 2° minimum-solar-elevation case, replacing the nominal horizon with the dense audit horizon leaves both assessed fractions and statuses unchanged: Shackleton fails (0% Sun/Earth/overlap); Nobile remains uncertain/nominal fit (about 73.115% Sun/overlap and 100% Earth). This verifies only these two default cases. The changed Sun samples over the longer packaged period demonstrate that finite sampling can matter near crossings.

Raw values, dense horizons, source-bundle identity and validator identity are retained in [HORIZON_SAMPLING_VALIDATION.json](HORIZON_SAMPLING_VALIDATION.json). Global terrain beyond 125 km, missing subpixel features, correlated height error, orientation uncertainty and event-refined timing remain open. Nominal fits must retain their uncertainty qualification.

## Defects found and corrected

1. **Custom-point completion tracking:** `whenIdle()` did not wait for the real custom-coordinate preparation request. It now tracks that promise.
2. **Stale custom preparation:** a response could apply after the selected scenario changed. The request now fingerprints mode, active scenario, scenarios and requirements; changed inputs reject the stale response before commit.
3. **Incomplete prepared point acceptance:** registration checked only a subset of the response. It now verifies requested observer/coordinates, finite values, source hashes, time boundaries, complete ten-minute record sequence, angle domains and actual coverage of the current mission before changing the catalog or selected scenario.

New regression cases reject truncated/malformed records, coordinate/observer mismatches, missing pinned sources and insufficient mission coverage before mutation. A deferred UI-response case verifies pending completion and rejects a stale scenario response. These fixes preserve the other scenario.

## LCSS engineering assessment

The implementation matches the equations and non-overlapping subtotal in [LCSS_MODEL.md](LCSS_MODEL.md). Unit conversion, water balance, discrete unit sizing, power limits, storage efficiency, contributor totals and budget equality are numerically checked. The default import-only subtotal is 11,940 kg; the independent capacity fixture produces 1,330 kg. Source identity and evidence categories remain separate from user-adjusted assumptions.

The linked sources do not calibrate the assumed 150 kg installed unit, 500 kg shared plant, process-energy coefficients, storage sizing or 730-day reliability at a selected site. [NASA's ISS water recovery result](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/) is an ISS-architecture result. [The NASA lunar ISRU study](https://ntrs.nasa.gov/citations/20210016820) examines architecture-specific propellant production and resource unknowns. [LCROSS](https://pubmed.ncbi.nlm.nih.gov/20966242/) reports a Cabeus ejecta-derived estimate; it does not measure extractable ice at the current study points. Those sources support the app's context/limitations, not independent validation of the default engineering parameters.

LCSS therefore remains an **assumption-driven exploratory budget**, with `acceptedForVerdict: false`. No accepted logistics-only mission pass or site-specific extraction feasibility is established by these checks.

## Performance

The local Node benchmark records approximately 101 ms for data decode plus initial A/B evaluation, 7.45 ms p95 for a settled requirement edit, 0.0123 ms p95 for an unchanged cached verdict, and 215 ms p95 for a bounded date search. See [performance/latest.json](performance/latest.json) for machine/run details. These measurements omit network transfer, browser layout, GPU work and real user interaction latency.

## Remaining acceptance work

1. Establish approved terrain tolerances, broaden convergence/reference cases to the other points and relevant directions, and determine whether adaptive/refined sampling is needed near crossings.
2. Establish global-horizon exclusion/completeness and correlated uncertainty treatment, retaining missing/unassessed classifications meanwhile.
3. Review/calibrate the LCSS architecture, equipment/energy/storage parameters and site-applicable resource evidence with qualified engineering references/review.
4. Complete rendered browser checks for 3D scene behavior, layout at desktop/mobile sizes, keyboard/screen-reader use, actual load/edit timing and the timed demo once supported browser access works.

This report records bounded validation and specific findings. It does not declare operational mission readiness or close the remaining PRD scientific/engineering/release gates.
# Conditional rescue follow-up — v4.4, 14 November 2026

The current application suite has **135 passing JavaScript/API/DOM checks**. Five rescue numerical/state cases cover independent 80 m timing (33 min round trip), exact time limits, no/unavailable/stale asset declarations, route gaps/malformed paths, input rejection, A/B isolation and environmental-result isolation. The bundled real-terrain flow checks declaration/availability, source-qualified paths, shortfalls, invalid input preservation, report markup, route direction and changed incident start. Pending preparation disables rescue inputs. Both production and offline builds pass; four prior prototype fingerprints remain unchanged.

[Rescue methods and limits](RESCUE_PLANNING.md) and [six real-point examples](RESCUE_VALIDATION.json) retain the evidence. Conditional timing uses hypothetical response assumptions; no operational, medical, energy, vehicle or communications acceptance is inferred. Rendered browser/GPU review remains unavailable in the last supported connection check. Earlier sections below are historical validation snapshots.

