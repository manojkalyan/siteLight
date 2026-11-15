# NASA challenge coverage review

Reviewed: 14 November 2026. Source: [official 2026 Lunar Landing Site Navigator challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) and [user-supplied challenge text](reference/nasa-challenge-2026.txt).

The core goal is rapid comparison of site/date options with Sun and Earth positions relative to the horizon, supporting power-potential and direct-to-Earth-window assessment. The challenge lists suggested objectives and optional considerations; these are not all mandatory features. This review records implementation evidence and limits. It is not NASA certification, an endorsement, or a guarantee of judging eligibility.

| ID | Objective / consideration | Current status | Evidence and remaining limit |
| --- | --- | --- | --- |
| C01 | Rapid site and date comparison | Implemented | Two independent scenarios, identical shared requirements, persistent comparison cards and full comparison view. |
| C02 | Site selection and custom coordinates | Implemented with limits | Six data-derived PGDA study points in real mode; regional references stay in their separate mode. Validated custom coordinates; no borrowed terrain or invented coverage. Study points are not certified mission landing sites. |
| C03 | Dates, times, and schedule changes | Implemented with limits | UTC setup, independent previews, tested nominal alternatives. Packaged geometry covers January–March 2027; the local service computes and caches other supported dates throughout 2027–2033 before applying them. Daily alternatives preserve model/uncertainty qualifications. |
| C04 | Sun and Earth relative to the horizon | Implemented with limits | Real-mode PGDA DEM horizon at 0.5° azimuth, 2.5 m near-field and 40 m far-field radial sampling (5 m / 80 m source pixels), 125 km extent and 2 m observer. Same records feed charts/verdicts. Beyond-extent/unresolved terrain and correlated uncertainty remain unassessed; source-RMS sensitivity is separate. |
| C05 | Sunset and Earthset information | Implemented | Time-to-set brackets within the available assessment window; already-below and no-crossing-in-window states. Ten-minute sample precision. |
| C06 | Power potential and direct-to-Earth windows | Implemented with limits | Solar elevation, eligible sunlight, geometric visibility proxy, overlap, longest gaps, and timestamped windows. No electrical wattage or RF link budget is inferred. |
| C07 | Multiple visualizations and temporal dynamics | Implemented; one Windows GPU reviewed | 3D globe and source DEM local patch in real mode, separate procedural demo, 2D horizon/skyplot, timeline and bounded daily calendar. Windows Chrome hardware rendering and context recovery are checked; broader devices remain open. |
| C08 | Different user skill levels | Implemented; bounded browser review | Plain/technical wording, labeled controls, keyboard timeline and scene controls, reduced-motion handling, and a guided review. Playwright navigation and selected rendered layouts pass; broader accessibility and usability remain open. |
| C09 | Ephemeris and lunar orientation | Implemented; acceptance bounded | Matched DE421 SPK/PCK/FK and MOON_ME geometric NONE recipe. Analytic axes, projection, transform path, and external Horizons inertial-vector checks. Separate geometric and apparent checks each cover 372 comparisons across six points and 31 epochs over 2027-2033. Physical terrain truth, continuous-date validation and future leap seconds remain limitations. |
| C10 | Actual topography and terrain horizons | Partially implemented: bounded local model | Six real PGDA 5 m DEMs plus height/slope RMS products. Computed footprint/slope/roughness, 500 km catalog horizons, 100 published local correlated realizations per point and partial stereo comparisons. Shared control, incomplete stereo coverage and full global covariance remain limitations; nominal fits stay uncertain. |
| C11 | Intuitive, efficient comparison | Implemented; user validation pending | Reference workspace, A/B summaries, deficits, qualified date proposals, and reports. Local compute benchmarks recorded; bounded Playwright and Windows Chrome review recorded. Broader cold-load, device and usability review remains open. |
| C12 | Submission and judging eligibility | Outside app verification | Registration, team page, submission assets, citations, and event-specific eligibility must be completed separately. This matrix is not NASA certification or a judging guarantee. |

## Honest conclusion

The main workflow now has real NASA PGDA terrain and matched DE421 geometry at six sourced study points, plus separate reference/sample modes. Packaged records cover January–March 2027; the local scientific service computes other supported dates throughout 2027–2033 before applying them. Source heights, a 2 m observer, curved multiscale 500 km catalog rays, footprint statistics, 100 published local correlated realizations per point, partial stereo comparisons, and source-RMS context are implemented. Full scientific acceptance is **not complete**: independent absolute terrain truth, global/orientation covariance, broader scientific and engineering acceptance remain open. Beyond 500 km exclusion is conditional on a declared 20 km height ceiling. Custom points retain their own prepared extent. Historical Diviner context, 372 expanded geometric and 372 separate apparent comparisons, and a published NASA water-ISRU reference study are implemented. Nominal fits remain uncertain; no advanced model is assumed to pass.

The recent terrain, gap, thermal, connectivity, dust, plume, radiation, rescue, and logistics features support the product plan. They are not additional NASA challenge mandates. Numerical temperature, logistics, dose, plume, and rescue predictions retain their PRD data/model gates.

## Verification evidence

- Implementation: [workspace source](../src/workspace/main.mjs), [evaluator](../src/workspace/engine.mjs), [state](../src/workspace/store.mjs), [coverage source](../src/workspace/coverage.mjs).
- Data: source manifests in data/science-inputs.json; local DEM/kernel assets in data/raw; scientific bundle in data/science; external Horizons geometric-vector references in data/validation. Reference-mode responses remain in data/horizons. External vector checks do not certify the terrain/orientation model.
- Automated evaluator, source-integrity, state, and DOM contracts: [workspace tests](../tests-js/workspace.test.mjs).
- Delivery and remaining work: [workspace implementation notes](WORKSPACE_IMPLEMENTATION.md).
- Real-data increment, feature order, and acceptance limits: [real-data implementation](REAL_DATA_INCREMENT.md). Local compute measurements: [performance report](performance/latest.json).
- Coverage-safe selection, six-site source definitions, and real date-block loading: [coverage correction](DATA_COVERAGE_FIX.md).
- Production build: **npm.cmd run build**. Offline standalone build: **npm.cmd run build:workspace**. Tests: **npm.cmd test**.
- Playwright UI and headed Windows Chrome hardware/GPU review are recorded in [browser validation](BROWSER_VALIDATION.md); broader devices, accessibility and cold-load performance remain open.

This file is generated from the same coverage records shown in the Evidence screen.
