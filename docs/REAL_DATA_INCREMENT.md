# Real-data implementation — increments 1–3

**Date:** 14 November 2026  
**Authority:** [PRDnew.md v3.7](../PRDnew.md) and [implementation plan](../IMPLEMENTATION_PLAN.md)  
**Current delivery:** Six sourced study points, 125 km multiscale horizons, source-RMS sensitivity, ranked interruptions, independent apparent-angle cases, historical Diviner context, and local real dates throughout 2027–2033. See [increment 3](SCIENCE_INCREMENT_3.md) for the current methods and remaining gates. The increment 1 table below is historical. Scientific acceptance remains bounded.

**Coverage correction (v3.6):** See [DATA_COVERAGE_FIX.md](DATA_COVERAGE_FIX.md) for the additional Nobile, Peak-near-Shackleton, and Malapert DEMs, the cause of the empty comparison cards, mode-specific site lists, and the load-before-apply real-date workflow. The default comparison now uses the sourced Shackleton and Nobile points. The mathematical method and initial three-point acquisition below record increment 1; the linked correction documents the current six-point implementation.

Open [lunar-workspace.html](../lunar-workspace.html), or run `npm.cmd run dev`. **Real DEM + DE421 · local model** is now the default. The original six regional reference points and the synthetic demo are retained as separate modes.

## What is implemented, in order

| Step | PRD / feature | Delivered | Remaining acceptance |
| --- | --- | --- | --- |
| 1 | A/I: source and site definitions | NASA PGDA Sites 04, 01, 11 DEMs and RMS products; exact source pixel, coordinate/frame/height definitions, input URLs and SHA-256 | Expand to six source-backed study points; certify no mission landing-coordinate attribution |
| 2 | B: geometric Sun/Earth series | Matched DE421 SPK/PCK/FK + leap-second kernel, UTC → ET/TDB → MOON_ME → elevated local ENU; `NONE`, no refraction; Jan–Mar 2027, ten-minute samples | Independent orientation review, future leap-second policy, more covered dates |
| 3 | B: real terrain horizon | 360 azimuth bins, 5 m radial steps, bilinear surface sampling, 7 km extent, lunar curvature, 2 m observer | Far-field terrain and correlated uncertainty; azimuth-resolution convergence |
| 4 | EXT-01: footprint screening | Real slope at chosen baseline, detrended roughness, finite DEM coverage, area meeting a chosen limit, source height/slope RMS context | Propagated uncertainty for the chosen baseline; independent real-terrain comparison; unresolved rocks remain unassessed |
| 5 | C / EXT-02: visibility and gaps | Same real records produce Sun/Earth/overlap fractions, physical darkness, solar-criterion losses, Earth gaps, and optional maximum-gap rules | Full terrain-model acceptance and event-refined timing |
| 6 | D: explanations | Failed-rule values/deficits and associated gap views; plain/technical wording; qualified uncertainty messages | Ranked causal diagnostic intervals / documented weights are still pending |
| 7 | E/F: changes and comparison | Independent A/B, preview/apply/reset dates, tested nominal alternatives, deltas, shared-time charts, and reports | A complete core acceptance demo after the scientific limits are resolved |
| 8 | I/J: evidence and accessibility | Export includes input/source/algorithm identity, terrain statistics, ray extent, checks and limits; DOM tests; keyboard/native controls and reduced-motion behavior | Browser/GPU/device accessibility and usability verification |
| 9 | Speed | Bounded provider/result/footprint caches; visible-chart updates; measured local compute benchmarks | Browser load/render/interaction timing on the stated reference device/network |

## Real study points

These points are **derived from the center pixel of published terrain tiles**. They are reproducible study locations, not mission landing selections and not claims of favorable conditions. Geographic coordinates are calculated from the source pixel center using its polar-stereographic CRS.

| Source tile | Study region | Latitude °N | Longitude °E | Surface height above reference sphere |
| --- | --- | ---: | ---: | ---: |
| Site04 | Shackleton | −89.7667414771 | −171.8928090830 | 767.9786 m |
| Site01 | Connecting ridge | −89.4631577570 | −137.5019849076 | 1944.7671 m |
| Site11 | de Gerlache | −88.6835255155 | −67.9340775548 | 1793.6644 m |

The source sphere radius is 1,737,400 m. Observer altitude is **surface height + 2 m**, stored separately from observer height. Changing coordinates or altitude without matching precomputed data produces insufficient data. The 5 m finite grid contains interpolated surface values: coverage is not a claim about direct laser-return density.

## Source and coordinate recipe

Terrain: [NASA PGDA Product 78](https://pgda.gsfc.nasa.gov/products/78), its [README](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README), and the surface, total-height RMS, and slope RMS GeoTIFFs for each selected tile. The source study is [Barker et al., improved LOLA maps](https://ntrs.nasa.gov/citations/20205009660). It distinguishes map height, orbital/geolocation error, surface-height uncertainty, and slope uncertainty; they are not interchangeable.

Kernels:

- `de421.bsp` — planetary ephemeris from the [NAIF archive](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/).
- `moon_pa_de421_1900-2050.bpc` — matched lunar orientation, with [kernel comments](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de421_1900-2050.cmt).
- `moon_080317.tf` — [DE421 PA/ME frame definitions](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_080317.tf).
- `naif0012.tls` — pinned UTC/leap-second input. Future UTC assumes the retained leap-second table; new leaps are not predicted.

`spkpos(target, et, MOON_ME, NONE, MOON)` supplies a geometric vector in kilometers. The observer position is subtracted, then projected onto spherical east, north, and radial-up axes. Azimuth is clockwise from north. The source DEM frame and orientation recipe use the same DE421 realization. Reference-mode Horizons apparent angles are not silently mixed into this calculation.

The initial horizon follows spherical great-circle directions. Target surface points use their sampled radius, and the elevation is calculated from the actual three-dimensional vector relative to the observer. Missing bilinear neighbors invalidate coverage; no zero-height filling is applied. The local horizon can be negative. Both horizon/profile and skyplot display negative local horizons.

Footprint slopes use central differences at the selected measurement baseline, with the local polar-projection scale accounted for. Roughness is the RMS residual after fitting a plane over the footprint. Published slope RMS belongs to the source product's method; it is not propagated or relabeled as uncertainty for every user-selected baseline.

The real-mode 3D patch uses the same packaged DEM grid, rotated for polar-grid convergence into local ENU. It is a local visual patch; the full 7 km horizon is calculated separately from the larger tile. Whole-Moon rendering maps and artistic studio lighting remain visualization-only assets.

## Qualification of results

- Nominal criteria met in this local terrain model → **UNCERTAIN**, with `nominalStatus: pass`.
- Nominal local criteria unmet → explicit rule failures, within the declared model.
- Missing point, full time coverage, or horizon inputs → **INSUFFICIENT_DATA**.
- Footprint limits that are nominally met retain an uncertainty qualification; an unresolved rock is never treated as absent.
- A searched alternative preserves its qualification. It is not advertised as an unconditional mission fix.

Terrain beyond 7 km can change visibility. Horizon uncertainty has not been propagated using correlated DEM clones. One-degree azimuth interpolation can miss narrow peaks. These are explicit remaining scientific tasks; passing software tests does not remove them.

## Reproduce the data build

The Windows preprocessing runtime is installed **inside this workspace**; no system Python or PATH changes are made. Raw DEMs/kernels and local tools are ignored by Git. Compact derived scientific data and input manifests are retained.

```powershell
npm.cmd run science:bootstrap
npm.cmd run science:acquire
npm.cmd run science:prepare
npm.cmd run science:test
npm.cmd run build:workspace
npm.cmd test
npm.cmd run benchmark
npm.cmd run build
```

The bootstrap uses an isolated pinned CPython build; scientific dependency versions are in [requirements-science.txt](../requirements-science.txt). Other platforms can use those requirements with their own Python and run `scripts/science_pipeline.py` directly.

The acquisition resumes completed assets, downloads large TIFFs in verified byte ranges, records checksums, and rejects changed pinned local inputs. Raw inputs occupy hundreds of MB and are not sent to the browser. The derived scientific payload is about 5.3 MB; the complete offline HTML is about 8.5 MB. Vite warns about its large data-bearing chunk. It is intentional in this offline increment; network/browser budgets remain to be measured before release.

Artifacts:

- [Input manifest](../data/science-inputs.json)
- [Scientific build report](../data/science/build-report.json)
- [External reference settings and source hashes](../data/validation/reference-vectors.json)
- [Latest compute benchmark](performance/latest.json)
- [Scientific preprocessing](../scripts/science_pipeline.py)
- [Browser data adapter](../src/workspace/real-data.mjs)

## What has been checked

Numerical preprocessing tests cover ENU direction/orientation, pixel-center interpolation, missing input preservation, and a constant-height spherical DEM horizon compared with its analytic dip. Source checks cover file hashes, projection round trips, kernel/frame identity, and a second SPICE transformation path.

An external Horizons DE441 **geometric inertial-vector** comparison at three epochs checks the DE421 position results at predeclared tolerances of 0.0001° for the Sun and 0.005° for Earth after projection. Recorded differences are smaller. This is a useful cross-check, not independent certification of the lunar orientation, terrain, or entire future interval.

JavaScript/DOM checks cover data coverage, missing cells/azimuth bins, negative horizons, nominal-versus-uncertain states, cache reuse/invalidation, independent scenarios, qualified date proposals, real-footprint reports, view navigation, and no-GPU startup. Browser rendering, actual frame rate, full load latency, and graphics recovery remain unverified because browser preview infrastructure was unavailable.

## Remaining features, in dependency order

1. **Complete the scientific core:** broader terrain coverage/far-field horizons, uncertainty propagation/convergence, independent orientation/terrain references, ranked diagnostic intervals, six sourced sites, and broader dates.
2. **Validate real-device speed and usability:** initial comparison <5 s, cached verdict <2 s, settled edit <1 s, measured in a browser with machine/network/data/cache conditions recorded.
3. **EXT-03 temperature context:** select a suitable Diviner product, pin units/missing values/resolution/period and local-time meaning. No temperature or hardware-survival result is currently calculated.
4. **G / LCSS:** accept the two-year mass accounting model, engineering parameters, ice evidence applicability, and reference cases before numeric logistics or ice-driven flips.
5. **EXT-04 connectivity:** optional geometric path layer after terrain coverage and assumptions are established; traversability is not implied.
6. **H and presentation stretch:** multi-year sampled envelope and a verified short demo after the core gate; a 29-day sweep already exists.
7. **EXT-05–08 research:** device-specific dust/thermal, descent/plume/regolith, radiation transport, and declared contingency assets/endurance. These remain not evaluated until their models pass their own gates.

The feature order starts implementation; it does not recast every research topic as mandatory hackathon scope. See [NASA challenge coverage](NASA_CHALLENGE_COVERAGE.md) for the separate challenge mapping.
