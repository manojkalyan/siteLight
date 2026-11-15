# Terrain sampling refinement — PRD v4.0

Date: 14 November 2026. Scientific artifact: `dem-de421-4`.

## Delivered

- Extended the sampling convergence audit from two points to all six sourced study points.
- Refined production horizons from 360 one-degree rays to **720 half-degree rays**. Local radial steps are now **2.5 m**, and polar far-field radial steps **40 m**. Source DEM pixels remain 5 m and 80 m respectively; finer sampling does not create finer measured terrain.
- Kept the 125 km extent, source-derived surface height, 2 m observer, matched DE421/MOON_ME geometry, missing-data behavior and explicit uncertainty qualifications.
- Applied the same recipe to newly prepared custom coordinates. Their high-resolution radial extent still depends on actual tile-edge coverage; the polar DEM completes the remaining sampled domain.
- Batched preprocessing into 24-ray groups to bound transient geometry/error arrays. The six-point reproducible build took about 60 seconds on the reference laptop; this preprocessing is outside normal UI edits.
- Generalized circular interpolation and response validation to the declared angular sampling. Horizon and skyplot contours now render every retained half-degree point, including peaks between whole degrees.
- Bumped the scientific version and algorithm identity. New date/custom cache keys include that identity; old prepared custom points must be prepared again rather than silently reused.

## Measured convergence

The first audit compared the original production grid against 0.5° azimuth / 2.5 m local / 40 m far-field steps. The second compared the refined production grid against **0.25° / 1.25 m / 20 m** steps. These are successive convergence comparisons of the same bilinearly interpolated source rasters, not errors against independent terrain truth.

| Point | Original-grid maximum difference | Refined-grid maximum difference | Refined-grid 95th percentile | Reference directions above 0.1° |
| --- | --- | --- | --- | --- |
| Shackleton | 0.125173° | 0.079347° | 0.019965° | 0 / 1440 |
| Connecting ridge | 0.052146° | 0.029598° | 0.009246° | 0 / 1440 |
| de Gerlache | 0.103102° | 0.076498° | 0.014972° | 0 / 1440 |
| Nobile | 0.111460° | 0.075312° | 0.015271° | 0 / 1440 |
| Peak near Shackleton | 0.107140° | 0.044007° | 0.012295° | 0 / 1440 |
| Malapert | 0.166423° | 0.061883° | 0.012591° | 0 / 1440 |

All six refined cases are within the **0.1° diagnostic review trigger**. That trigger is not an approved mission accuracy tolerance. Finite-grid comparison does not bound every azimuth, date, unresolved peak or physical modeling error. Across each point's 12,961 packaged records, geometric Sun visibility still differs in 1–9 samples between refined and finer grids; Earth differs in one sample at de Gerlache and none at the other five points. This supports retaining uncertainty and ten-minute event precision.

Full reproducible values, source/validator identities, and dense reference contours are retained in [the baseline audit](HORIZON_SAMPLING_BASELINE.json) and [the refined audit](HORIZON_SAMPLING_VALIDATION.json). Production source hashes and algorithm identity are in the scientific bundle and [build report](../data/science/build-report.json).

## Verification

**114 JavaScript/API/DOM checks and 6 Python numerical checks pass.** New/expanded checks cover half-degree wrap interpolation, missing sectors, chart peaks between whole degrees, batched sensitivity-array lengths, equality at shared azimuths, and rejecting mismatched near/far angular grids. Existing data hashes, JPL angle cases, default comparisons, custom coverage, future-date loading and LCSS isolation checks remain passing. Production and offline builds pass; the four earlier prototypes remain unchanged.

A live custom-coordinate request at −89.76674°, −171.85° also returned the new `dem-de421-4` recipe with 720 rays and 2.5 m/40 m radial bands, passed the workspace's source/coordinate/coverage registration checks, and retained its nominal failure. A later real-date request for this prepared point returned 145 MOON_ME/NONE records over 1–2 May 2033. Both endpoints returned HTTP 200. See [the custom-flow check](CUSTOM_REFINEMENT_CHECK.json); this validates that one supported custom flow, not every coordinate.

The final local Node benchmark records about 111 ms for scientific data decode plus first A/B evaluations, 7.66 ms p95 for a settled requirement edit, and 282 ms p95 for the bounded date search. These measurements do not cover browser loading/layout/GPU. The production script is about 13.42 MB before gzip; offline HTML about 14.20 MB.

## Remaining acceptance

- Independent terrain truth and approved accuracy tolerances; event-refined timing if needed.
- Global horizon completeness beyond 125 km and correlated terrain/orientation uncertainty. One-source-RMS sensitivity remains non-probabilistic.
- Engineering calibration/review of the LCSS architecture and applicable ice/extraction evidence. Its result remains exploratory and outside final environmental verdicts.
- Rendered browser/GPU, real accessibility, actual user-perceived speed and demo review. The last supported Windows computer-use attempt failed because its native connection was unavailable; no rendered check is claimed.

Sampling refinement closes the six-point diagnostic sampling task at the stated trigger. It does not close these broader scientific, engineering or release gates.
