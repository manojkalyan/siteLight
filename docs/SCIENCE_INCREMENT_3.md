# Implementation increment 3 — terrain, explanations, and temperature context

**Date:** 14 November 2026  
**Authority:** PRDnew.md v3.8  
**Result:** Multiscale terrain, ranked explanations, historical Diviner context, independent orientation cases, and prepared real custom coordinates implemented with explicit remaining research gates.

## Delivered in dependency order

| Item | Implementation | Acceptance boundary |
| --- | --- | --- |
| Wider terrain horizon | Six study points now combine their 5 m PGDA local DEM to 7 km with the compatible 80 m polar DEM from 7 to 125 km | Complete finite samples on all 360 retained rays; no proof of global or subpixel completeness |
| Height-error sensitivity | Recompute lower/upper horizon perturbation scenarios using terrain ±1 interpolated source height RMS and opposite observer-height perturbations; evaluate Sun/Earth/overlap ranges | Sensitivity scenarios, not confidence bounds; correlated uncertainty remains open |
| Independent orientation cases | Compare CSPICE apparent topocentric AZ/EL against independent Horizons outputs at three sites × two targets × three epochs | All 18 cases pass predeclared 0.01° tolerance; this does not validate all dates or terrain |
| Binding Constraint Explainer | Rank contiguous causal intervals, expose UTC boundaries/durations, failed-rule shortfalls, sampled azimuth spans, and plain/technical wording | Only unmet enabled rules contribute; timing retains ten-minute sample precision |
| Diviner temperature context | Two historical southern-summer cumulative brightness-temperature bins near each real study point, with period, local time, distance, units, and missing coverage | Separate observational context; no future mission-time temperature, hardware survival, or radiator verdict |
| Custom coordinate preparation | A local service selects the containing pinned PGDA 5 m tile, derives that coordinate's own terrain, observer, 125 km horizon, RMS inputs, Diviner context, and date records before applying it | Available only inside supported high-resolution tile interiors with complete terrain rays; unsupported coordinates preserve the previous scenario |
| Reports and UI | Screening includes sensitivity and temperature cards; constraints/reports include ranked diagnostics; exports preserve sources, scope, and orientation checks | Reference/sample modes never inherit real observations |

## Real sources and reproducibility

The far-field inputs are `LDEM_80S_80MPP_ADJ.TIF` and `LDEM_80S_80MPP_ADJ_ERR.TIF`, from [NASA PGDA Product 90](https://pgda.gsfc.nasa.gov/products/90). Its documented MOON_ME/DE421 frame matches the [Product 78](https://pgda.gsfc.nasa.gov/products/78) local DEMs. Units are meters and the reference sphere is 1,737,400 m. Input URLs, byte sizes, and SHA-256 values are pinned in `data/science-inputs.json`.

The interpretation of the error layer was checked against [Barker et al. 2023](https://ntrs.nasa.gov/api/citations/20230014419/downloads/BarkernewviewSTIupdated.pdf), Section 3. Its height-uncertainty construction does not supply the complete spatial covariance needed for a correlated horizon confidence calculation. The implemented perturbation envelope makes no statistical coverage claim.

The local 5 m DEM remains authoritative inside 7 km. Each far-field ray starts at 7 km and samples every 80 m through 125 km. Spherical great-circle geometry and bilinear interpolation retain lunar curvature. The combined nominal horizon is the maximum of the two domains; an incomplete domain remains unknown. The same maximum operation combines the sensitivity scenarios. Observer height stays 2 m above the local DEM; source errors also perturb its absolute surface height.

At the six study points, the polar DEM's interpolated center heights differ from the local DEM by approximately −1.79 to +1.01 m. This is a diagnostic of the two source products, not a fitted correction or an accuracy guarantee. Distant terrain raises the nominal horizon in **644 of 2,160** retained azimuth sectors. Sector counts by point are 153, 84, 181, 87, 120, and 19. No sector's combined horizon becomes lower than its retained local horizon.

The independent angle check uses [CSPICE `spkcpo`](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/spkcpo_c.html), observer-fixed MOON_ME, reception `CN+S`, and local ENU. Independent [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html) references use airless apparent center AZ/EL and MEAN_ME/DE441. This recipe is for validation only. The production evaluator continues to use geometric `NONE` positions. The maximum observed angular discrepancy is **0.0000085066°**. The source responses, case-by-case values, tolerances, and script hash are retained in `data/validation/orientation-report.json`.

## Ranked explanation method

Solar interruption weight is **1.0** and Earth interruption weight is **0.6**. A diagnostic interval's score is its duration multiplied by the sum of its active cause weights. Scores are prioritization aids in weighted hours, not lost energy, risk probabilities, or physical penalties.

The algorithm segments the existing evaluated records. Solar causes are exclusive: either the Sun is at/below terrain, or it clears terrain but misses the selected minimum elevation. Earth blockage may occur simultaneously and adds its distinct 0.6 weight once. Each segment identifies only the enabled rules it actually contributes to. A longest-gap failure includes only gaps exceeding that limit; a passing aggregate or passing outage rule does not become a binding failure. An overlap deficit can reference solar loss, Earth loss, or both.

Intervals include start/end UTC, duration, whole-window clipping flags, relevant rule values and shortfalls, and an unwrapped span of sampled azimuths. The span excludes the unsampled endpoint. Unknown records do not receive causal attribution. Ranking sorts by descending score, then ascending start time. Reports retain all intervals and the nominal verdict qualification.

## Diviner observations

Source route: [PDS Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm), derived PCP collection, diurnal/local-time/south-pole products. The two acquired products are:

- `pcp_avg_tbol_pols_sum_ltim01_240`: 00:00–00:15 local time.
- `pcp_avg_tbol_pols_sum_ltim49_240`: 12:00–12:15 local time.

The labels specify **average bolometric brightness temperature in Kelvin**, 240 m bins, all nadir observations from 5 July 2009 through 17 February 2019 with subsolar latitude below zero, and omitted empty bins. These two samples do not establish the daily minimum or maximum. Their local times are not UTC.

Acquisition pins the complete source tables and both PDS3/PDS4 labels in `data/thermal-inputs.json`. Extraction verifies record counts and product semantics, rejects −9998/−9999 and invalid temperatures, and selects the nearest valid observed bin center within a declared 171.71 m search radius (half a 240 m grid diagonal plus 2 m for coordinate rounding). Distances use spherical great-circle separation of the published planetocentric coordinates. No spatial interpolation or missing-bin fill is applied. Matching a nearby bin does not demonstrate subpixel registration to the 5 m DEM or that its average equals the temperature at the exact study coordinate.

| Study point | 00:00–00:15 | 12:00–12:15 |
| --- | --- | --- |
| Shackleton | 89.2 K; 55 m away | 90.2 K; 55 m away |
| Connecting ridge | 140.8 K; 44 m away | No matching bin |
| de Gerlache | 169.9 K; 119 m away | No matching bin |
| Nobile | 80.0 K; 62 m away | 110.7 K; 62 m away |
| Peak near Shackleton | No matching bin | 155.1 K; 80 m away |
| Malapert | 149.9 K; 43 m away | No matching bin |

These are eight source matches and four explicit gaps. They do not change when a user changes the mission UTC. Observation counts, temperature error bars, validated subpixel co-registration, and operational thermal models are not provided by this integration.

## Commands and evidence

```powershell
npm.cmd run science:acquire
npm.cmd run science:thermal
npm.cmd run science:prepare
npm.cmd run science:test
npm.cmd run build:workspace
npm.cmd test
npm.cmd run benchmark
npm.cmd run build
```

Acquisition reuses verified pinned inputs. Large raw rasters and the local scientific runtime remain outside the UI bundle. The thermal step expects the included study-point bundle for its source coordinates; it is then incorporated by `science:prepare`. That command validates the independent orientation cases before preparing the dataset. BLAS uses one worker within scientific processes, and GDAL's cache is bounded at 32 MiB to limit pressure on the reference machine. No global machine settings are changed.

The retained [numerical summary](SCIENCE_INCREMENT_3.json), [orientation report](../data/validation/orientation-report.json), and [Node performance report](performance/latest.json) record measured results. JavaScript/API/DOM checks cover the existing application plus three independently specified explanation fixtures, partial/missing records, sensitivity enclosure, real source matches, mode isolation, and future-date loading. Python fixtures cover ENU axes, bilinear registration/gaps, analytic spherical dip, multiscale obstruction handling, and sensitivity ordering. Browser/GPU and real-user checks remain pending.

Final verification: **103 JavaScript/API/DOM checks and 5 Python numerical checks pass**. Production and standalone builds pass; all four earlier prototype fingerprints are unchanged. The local service also returns 145 real MOON_ME/NONE records for Nobile over 1–2 May 2033. These HTTP/DOM checks do not substitute for rendered browser review. The final local Node benchmark records approximately 101 ms for parsing plus first A/B computations and 8.7 ms p95 for a settled requirement edit.

A real nominal flip fixture starts Nobile at 1 January 2027 with the unchanged seven-day default requirements. It fails with zero solar eligibility and Earth visibility. The nearest available tested daily fit is +9 days: approximately 51.19% solar/overlap and 65.87% Earth visibility. Re-evaluation reproduces it, and its status remains **uncertain / nominal pass**. A strict all-availability Shackleton case produces no fit within the loaded tested range; unavailable dates are counted, not extrapolated.

An initial unrestricted production build encountered a native allocation failure under the host's memory pressure. The Vite launcher now bounds its Node heap at 768 MiB and its compiler pool at two workers for development/build/preview. The bounded production build passes; this changes only child-process settings, not the machine environment. The offline artifact is approximately 14.0 MB; the production main script remains large (about 13.24 MB before gzip). These are measured size limits, not browser-load guarantees.

## Remaining work, in order

1. **Scientific acceptance:** independent terrain reference cases and azimuth/radial convergence; global-horizon completeness or a documented far-field exclusion argument; correlated height/orientation uncertainty. Current nominal fits remain uncertain.
2. **LCSS and ice evidence:** complete the water/recovery/throughput/energy/equipment mass accounting, applicable evidence, and reference outputs required by PRD Module G and implementation-plan Section 6. No numerical logistics verdict is enabled before that gate.
3. **Custom coordinates:** prepared coordinates are now supported inside the six available source DEM footprints, with their own local terrain, far-field rays, RMS inputs, observer, and date coverage. Coordinates outside these footprints, near tile edges, or with incomplete rays are rejected. Broader custom-site source acquisition is still pending.
4. **Browser/release verification:** rendered layout, GPU behavior, keyboard/screen-reader usability, measured browser speed, a timed demo, and submission assets.
5. **Optional/research scope:** multi-year robustness, connectivity, dust, plume, dose, and rescue models. These are separate model-development tasks with the PRD's existing gates.

## Increment 4 — prepared custom coordinates

In the local Vite app, the custom-coordinate form now requests a real point preparation before selection. The local service accepts coordinates only when they fall inside a pinned 5 m PGDA DEM tile with enough finite area around the point. It samples that coordinate's own surface elevation, uses the selected observer height, constructs a local 5 m horizon joined to the compatible 80 m polar data through 125 km, retains the local footprint's height/slope RMS grids, and generates matching DE421/MOON_ME geometric records for the mission window plus date-preview coverage. Missing horizon rays or unsupported/tile-edge locations leave the previous scenario in place.

The resulting custom point is source/version tied, cached locally, added to the real-point selector, and reused when loading later dates. Its thermal context is sampled only from the pinned Diviner context index and remains explicitly observational. Custom points are not advertised as a global arbitrary-coordinate service or as certified landing sites. Preparation reads only the needed far-field raster window and runs in the already installed local scientific runtime. Direct-file/standalone mode cannot prepare a new coordinate.

This feature uses the existing terrain/horizon recipe; global completeness, correlated uncertainty, external orientation checks at every custom point, and review of non-polar locations remain acceptance limits. A live local-service request prepared `−89.76674°, −171.85°` from Site04: it returned 11,377 ten-minute records for 1 January–21 March 2027 and complete 360-ray coverage to 125 km. This confirms one new coordinate path end to end; it does not validate every tile edge or location.

Implementation of this increment does not close the LCSS, global scientific, or browser/release gates.
