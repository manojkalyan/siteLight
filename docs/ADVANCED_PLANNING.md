# Advanced planning increment — v4.2

**v4.7 partial radiation follow-up:** [Historical CRaTER observations and NIST primary-proton screening](RADIATION_MODEL.md) are implemented with independent A/B controls and source/quality evidence. This supplies orbital silicon context and a separate CSDA slab approximation. Surface/human dose, realistic spectra, secondary/albedo transport and health/operational shielding acceptance remain open.

**v4.6 follow-up:** [Conditional ejecta trajectories](PLUME_EJECTA_MODEL.md) are implemented for prescribed post-acceleration release states and hypothetical asset envelopes. This supersedes the ballistic exploration backlog only. Engine/soil erosion, launch distributions, terrain interception, flux/deposition and damage remain unassessed.

**v4.5 follow-up:** [Dust/radiator optical exploration](DUST_THERMAL_MODEL.md) is implemented using explicit device assumptions, laboratory endmember properties and an initial steady-state radiation balance. It supersedes the optical-comparison backlog only; calibrated coating response, layer/conduction/transient effects and engineering acceptance remain open.

**v4.4 follow-up:** [Conditional rescue timing](RESCUE_PLANNING.md) is now implemented with scenario-scoped hypothetical assets, availability, mobilization/handling, declared speeds, optional return and elapsed-time limits. This supersedes the earlier implementation backlog for conditional response timing only; operational vehicle/energy/communications/medical validation remains open.

14 November 2026. This increment implements monthly robustness, bounded terrain connectivity and geometric sky context. It starts the remaining research work through explicit model/data requirements, without inventing operational predictions.

## Monthly robustness

Open Calendar and choose **Evaluate 84 real monthly starts**. The local service generates body-center geometric Sun/Earth positions for the first day of each month at 00:00 UTC from January 2027 through December 2033, using the selected point, duration and every enabled environmental rule. Each window is separate. The same evaluator/horizon recipe produces the daily and monthly results.

Only the required windows are generated: the default seven-day study has 84 × 1009 records, rather than a continuous seven-year time series. Partial final bins retain their weights and the source coverage endpoint rounds up to the next ten-minute sample. The source/data/generator hashes, coordinates and duration form the persistent cache identity. Prepared custom points are supported through their existing validated source metadata. The UI retains at most two studies; selecting a cell registers only that window's data and applies its exact tested UTC start. Changing the point or environmental requirements makes the old grid unavailable until recomputed.

The seven-by-twelve table reports nominal fits, requested/evaluated/unknown counts and unqualified passes. Unknown windows never count as fits. Neither monthly nor daily sampling proves continuous feasible windows. No robust/marginal category or confidence probability is invented. Nominal fits remain uncertain under the current scientific acceptance limits.

JSON exports retain the study's settings, sampling, cell results and source identities while omitting bulk geometry rows. This study is environmental; historical Diviner context and hypothetical LCSS inputs remain separate.

## Terrain connectivity

Open Screening and choose a destination direction in source-grid axes. Start is the footprint center; destination is the sampled cell near 80% of the footprint radius in that direction. A deterministic A* search uses the existing circular 21 × 21 sample grid. Cells need finite height and slope below the selected slope limit. Edges must also meet a height-difference grade limit. Eight-neighbor moves are permitted; diagonals require both orthogonal side cells to be valid, preventing corner cuts through blocked/missing cells. Edge cost is three-dimensional segment length; the horizontal straight-line heuristic is admissible.

The white overlay follows the returned samples. Grid positive Y is drawn upward; these are source polar-stereographic axes, not a claim of celestial north/east. Real paths remain qualified uncertain. A route does not establish vehicle clearance, traction, soil bearing, boulder detection, energy, communication, thermal feasibility, crew safety or safe return. Missing/steep endpoints and disconnected graphs produce no route. JSON terrain summaries include the requested direction, method, limitations, path and sampled length.

For a 100 m footprint / 20 m slope baseline / 12° limit and +X destination, the default Connecting ridge, de Gerlache, Peak and Malapert study points have sampled paths about 80.1–80.3 m long. Shackleton and Nobile have no route under those sampled constraints. These examples are not mission traversability findings.

## Radiation research foundation: sky geometry

Screening now reports the nominal visible solid-angle fraction of the upward hemisphere. For uniform azimuth bins with horizon elevation h, the fraction is the mean of `1 − sin(clamp(h, 0°, 90°))`. This follows the solid-angle integral of cos(elevation) from the local horizon through zenith, divided by 2π. Flat/negative horizons give 1; a constant 30° horizon gives 0.5; a constant 90° horizon gives 0. Missing sectors prevent a whole-hemisphere result.

This is not a diffuse-radiative view factor, radiation-dose attenuation, shielding efficiency or particle transport model. [The CRaTER archive](https://pds-ppi.igpp.ucla.edu/data/lro-crater/) is the observation-source route for future instrument-context work; no orbital measurement is assigned to a particular surface point here. JSON exports retain this geometric method and limitation.

## Remaining research implementations and acceptance inputs

| Workstream | Required model inputs | Next implementation / reference gate |
| --- | --- | --- |
| Dust/radiator | Device geometry, coating, clean/dusty optical properties, dust loading/thickness and measurement method, heat loads, temperatures, conduction and environmental fluxes | Select a coating-specific measured response and verify a thermal balance against published/device cases. Do not impose a universal positive penalty: [NASA thermal work](https://ntrs.nasa.gov/citations/20240003496) describes competing emissivity/conduction effects; [the lunar thermal guide](https://ntrs.nasa.gov/citations/20210010030) supplies analysis context. |
| Plume/ejecta | Thruster/nozzle geometry, time-resolved descent/thrust/flow, exhaust properties, soil cohesion/particle distribution, surface geometry and asset locations | Choose a validated model/test domain and compare erosion/ejecta outputs with its reference cases. [NASA PSI](https://www.nasa.gov/directorates/stmd/plume-surface-interaction-psi/) develops modeling/testing for particular plume/surface systems; distance alone does not give an arbitrary-site hazard probability. |
| Radiation dose/shielding | Particle spectra/event assumptions, observation product/calibration and geometry, materials/thickness, transport model and response quantity | Inspect a suitable CRaTER product's labels before observational context; validate transport/reference cases before surface dose or shielding output. Sky geometry is already implemented separately. |
| Rescue/contingency | Declared assets, actual start/destination coverage, vehicle/load/terrain limits, mobilization/handling time, speed/energy/endurance, communications and environmental constraints | Extend the sampled route foundation with declared operational assets and compare known reachability/no-reachability cases. [NASA rescue research](https://ntrs.nasa.gov/citations/20220019030) and [the lunar rescue design challenge](https://www.nasa.gov/get-involved/south-pole-safety-designing-the-nasa-lunar-rescue-system/) identify an operational design problem; route connectivity alone is not a rescue verdict. |
| LCSS engineering calibration | Installed equipment architecture/masses, energy/throughput curves, storage/power architecture and lifetime assumptions, applicable ice evidence | Calibrate the explicitly hypothetical explorer against accepted architecture-specific cases. Preserve external/context measurements separately. See [LCSS model](LCSS_MODEL.md). |
| Full scientific acceptance | Approved accuracy tolerances, independent terrain truth, global far-field treatment and correlated terrain/orientation errors | Six-point same-raster convergence is implemented; it does not close the global/covariance/reference-review gates. See [sampling refinement](SAMPLING_REFINEMENT.md). |
| Browser/GPU review | A working supported browser connection and recorded device/browser/viewport | Complete [the rendered application procedure](APPLICATION_REVIEW.md). The last supported browser inventory returned no usable browser host; no visual pass is claimed. |

These are concrete model-definition/data tasks. Numerical dust loading, plume danger, dose and operational rescue predictions remain unassessed until their evidence and reference gates can be met. The v4.4 conditional rescue-time exploration is implemented under explicit assumptions, separate from operational acceptance.

## Evidence and reproducibility

The retained [advanced planning validation](ADVANCED_PLANNING_VALIDATION.json) records a real Nobile seven-day monthly study: 84 evaluated, 9 nominal fits, 0 unknown and 0 unqualified passes under the unchanged default environmental requirements. It also records the six sample route/sky-context results. This result is specific to the declared monthly starts, inputs and scientific bundle.

Tests cover independent flat-plane lengths, blocked endpoints/barriers, diagonal corner constraints, analytic sky fractions, missing sectors, all 84 real monthly windows, direct evaluator parity, unknown-window accounting, bounded JSON export, and actual API/calendar cell selection. The monthly generator/source metadata and raw geometry are cached locally; the UI report contains the provenance needed to repeat the calculation.

The partial-bin check also generates a 48.25-hour study: source coverage rounds to 48 h 20 min, while the actual evaluated mission remains 48 h 15 min. The UTC grid preserves February/March spacing in leap year 2028. Invalid durations and unknown/inherited object-property site names are rejected by the service contract.

Final verification: **126 JavaScript/API/DOM checks and 6 Python numerical checks pass**. Production and offline builds pass; the earlier prototype fingerprints remain unchanged. The local application and new monthly endpoint respond successfully. These checks do not constitute rendered browser/GPU review or operational model acceptance.
