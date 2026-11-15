# Current implementation and release status

**15 November UI reference correction:** [UI 1 now follows the approved composition](UI1_REFERENCE_MATCH.md), with a black background, larger neutral Moon, compact separated panels, open horizon, real DEM thumbnail and slim timeline. The calculation engine and scientific bundles are unchanged. See the linked record for current test results and screenshots.

**Current v4.9 - 15 November 2026:** [Terrain and NASA reference evidence](TERRAIN_REFERENCE_INCREMENT.md) is implemented in evaluator `workspace-evaluator-11`, on the unchanged `dem-de421-4` scientific bundle plus a separate versioned evidence layer. All six catalog points use the sourced 500 km nominal horizon correction; 100 published correlated local terrain realizations per point and quality-filtered partial stereo comparisons are visible in Screening and exported. The selected published NASA architecture is a separate propellant reference study with 23 checked values and seven passing bookkeeping/rounding checks; it is not a calibration of the four-crew/730-day LCSS system.

**Current scientific/engineering verification:** [The audit](SCIENTIFIC_ENGINEERING_VERIFICATION.md) records **681 retained source records, seven artifact checks, 13 linkages, 179 JavaScript regressions and 14 Python fixtures passing**, alongside 744 expanded JPL/CSPICE comparisons. The 500 km dense audit stays below the existing 0.1 degree sampling diagnostic (maximum 0.0793465 degrees). The added terrain raises 386 half-degree sectors across four points, by up to 2.027678 degrees. Full physical scientific and engineering acceptance remains open: stereo coverage/control/registration limits, unresolved terrain, a conditional beyond-500 km height ceiling, full global/orientation covariance, all 20 legacy LCSS equipment/operations assumptions and local extractable ice are not closed.

The dated version notes below retain earlier delivery history; the current v4.9 scope above supersedes their old extent, test-count and unavailable-browser statements.

**15 November 2026 browser validation follow-up:** [Playwright and Windows Chrome review](BROWSER_VALIDATION.md) is now recorded: 11 automated UI cases and one headed visual/GPU case pass, alongside 168 JavaScript/API/DOM regressions. Installed Chrome 157 on Windows reports AMD hardware rendering; deliberate WebGL context recovery works. Selected desktop/mobile screenshots were inspected. The review corrected mobile slider overflow, crowded comparison cards, table scrolling and the stale recovery notice. Broader accessibility, cross-device, cold-load and long-duration review remain open. Earlier unavailable-connector notes describe the preceding workflow; the separately authorized Playwright path works.

**v4.8 start-window update:** [Loaded-record landing-start scanning](START_WINDOW_SCAN.md) tests every supported ten-minute UTC start using current mission and outage requirements. Grouped sampled windows, rechecked boundary application, stale-study invalidation, two-study caching and JSON/print/hash evidence are implemented. Each of the six points has 11,953 starts for the default mission in the packaged quarter; Nobile has 2,303 uncertain nominal fits. Browser testing is now recorded through Playwright-launched Windows Chrome; see the follow-up above for its scope.

**v4.7 partial radiation update:** [Radiation observations and primary-proton screening](RADIATION_MODEL.md) is implemented in Screening. It retains 1285 CRaTER orbital days (2009–2012), source flags/coverage and measured versus source-corrected silicon rates. A separate NIST CSDA model compares normal-incidence primary-proton energy, reference-density thickness and panel mass using 396 range rows/three materials. Surface/human dose and full shielding effectiveness remain unassessed; neither archive rates nor terrain sky geometry are converted into health or mission verdicts.

**v4.6 update:** [Conditional post-acceleration ejecta exploration](PLUME_EJECTA_MODEL.md) is implemented in Screening. Prescribe a particle release state, place up to five hypothetical assets, and inspect ideal-sphere trajectories, envelope crossings, time and single-grain energy. Two checked JPL constants/three pinned references and JSON/print evidence are included. Engine-driven erosion, launch distributions, terrain effects, particle flux, deposition and damage remain unassessed.

**v4.5 update:** [Dust/radiator optical sensitivity](DUST_THERMAL_MODEL.md) is implemented in Screening: three checked laboratory simulant endmembers or custom optics, independent A/B device assumptions, clean/dusty equilibrium temperatures, signed heat margins at a user limit and a coverage curve. JSON/print evidence includes pinned sources and assumptions. The mixture approximation is not conservative; measured coating response, dust-layer conduction and transient/operational thermal validation remain open.

**v4.4 update:** [Conditional rescue planning](RESCUE_PLANNING.md) is implemented in Screening. Declare a hypothetical asset for the selected point/start, explicitly assume availability, set speeds/delays/endurance/completion limits and optionally include loaded return. Independent A/B settings, route/timing qualifications and UTC timestamps travel with JSON/print evidence. Actual asset, energy, communication, medical and vehicle feasibility remain unassessed; environmental verdicts are unchanged.

**v4.3 update:** The Logistics inspector/report now includes [engineering evidence and calibration tracking](ENGINEERING_CALIBRATION.md): two pinned NASA PDFs, seven checked values, source-page links, all 20 architecture assumptions with evidence requirements and explicit review gates. Published context does not replace assumptions or enable accepted logistics verdicts. The browser connection was retried and remains unavailable.

**v4.2 update:** Monthly robustness (84 real starts over 2027–2033), sampled terrain connectivity and upward-sky geometric context are implemented. [Advanced planning](ADVANCED_PLANNING.md) records their boundaries and the model/data requirements for dust, plume, dose and rescue. The earlier optional-backlog snapshot below is superseded for these implemented components; vehicle-level routes and radiation transport remain unassessed.

15 November 2026 - PRD v4.9; evaluator `workspace-evaluator-11`; scientific bundle `dem-de421-4` with the separate terrain-evidence layer.

## Delivered and checked

Current numerical verification: **179 JavaScript/API/DOM checks and 14 Python scientific/ingestion fixtures pass**. The six-point start-window audit has 270 direct evaluator comparisons; fractional ends, unknowns, coverage boundaries and the gap algorithm also have numerical fixtures. Nine radiation sources, CRaTER detector/date/unit/flag contracts and three NIST material/range/density contracts are checked during preparation. Earlier plume, dust and LCSS reference checks remain valid for unchanged inputs. Production/offline builds pass, and four prototype fingerprints are preserved. These checks verify declared numerical/source/software scope, not full radiation transport, physical plume, rendered browser or engineering acceptance.

- Six real PGDA study points and supported custom coordinates inside available high-resolution DEM interiors. Unsupported coordinates, incomplete rays, malformed grids and invalid responses preserve the last assessment.
- Matched DE421/MOON_ME geometric Sun/Earth records, 2027–2033 local date loading, source hashes and explicit UTC/observer definitions.
- Six catalog horizons extend to 500 km with 720 half-degree rays, 2.5 m / 40 m / 120 m radial steps and 5 m / 80 m / 240 m source pixels. All six dense comparisons are below the 0.1 degree diagnostic trigger. Beyond-extent exclusion is conditional on a declared 20 km height ceiling. Source-RMS perturbations cover 0-125 km with the outer annulus held fixed; custom points retain their own extent.
- 600 published correlated terrain windows support empirical footprint percentiles at 100 m radius, 20 m slope baseline and a 12 degree limit. These are not guaranteed confidence bounds. Stereo comparison uses raw PDS confidence classes 10-14 at every interpolation support; shared LOLA control, partial coverage and source-header registration remain limits.
- Published NASA 225-day water-ISRU propellant reference study, separately labeled and exported: 23 checked values, seven bookkeeping/rounding checks, assumed 5 wt% concentration and documented exclusions. The legacy LCSS inputs are not promoted to calibrated values.
- Environmental fractions, enabled outage limits, ranked interruption causes, A/B comparison, schedule previews/search and a bounded 29-day calendar.
- Historical Diviner observation context with missing bins preserved.
- Opt-in LCSS assumption exploration: defined four-crew/730-day subtotal, contributor breakdown, shared architecture/budget, independent A/B hypothetical ice and a sampled budget-fit search. Accepted logistics status remains not evaluated.
- JSON/CSV/print evidence exports, scientific/model versions, keyboard controls, reduced-motion behavior and a no-GPU fallback.

See [the validation report](VALIDATION_REPORT.md), [sampling refinement](SAMPLING_REFINEMENT.md), and [LCSS equations and boundaries](LCSS_MODEL.md) for numerical evidence and practical limits.

## Reliability corrections in v4.1

1. Loading guards apply to logistics changes and timeline/offset input. Opening a new inspector while a calculation is pending creates disabled model controls.
2. No-fit logistics explanations disclose evaluated and unsupported grid samples. Invalid global search inputs are rejected rather than represented as an unsuccessful search.
3. The local service client reports network, timeout, unreadable-response and scientific-rejection errors clearly. Native fetch requests use bounded probe/preparation timeouts where AbortSignal.timeout is supported; previous scenarios remain displayed.
4. Prepared custom-point caches validate both terrain algorithm identity and thermal-index identity, including the entry's preparation metadata. Index changes require refreshed evidence. Publishing point-cache files uses unique temporary names so independent local service processes do not share a temporary filename.
5. Prepared custom responses validate coordinates/observer, full ray coverage, finite angular spacing, grid shape/data, pinned sources and complete mission-time records before registration. Malformed points cannot replace a working scenario and crash its terrain renderer.
6. Terrain accessibility text describes a terrain footprint without falsely labeling real NASA terrain synthetic.
7. Implementation-plan entries no longer label delivered data collection or the exploratory LCSS calculator as not started.

## What is not closed

| Item | Why it remains open | Evidence needed to close it |
| --- | --- | --- |
| Absolute terrain accuracy / global completeness | 500 km nominal rays and partial confidence-filtered stereo checks are implemented; stereo shares LOLA control and the beyond-extent exclusion assumes a 20 km height ceiling | Approved physical accuracy tolerances, independent terrain truth with adequate coverage, review of source registration/artifacts and a defensible physical maximum or global terrain treatment |
| Correlated scientific uncertainty | 100 published local correlated realizations per point cover the reference footprint; global/far-field and orientation covariance remain absent | An applicable joint global terrain/orientation model with validated uncertainty interpretation; local empirical percentiles alone do not establish mission confidence |
| Accepted LCSS engineering constraint | Installed equipment masses, energy/storage sizing, two-year operations and local extractable ice remain assumptions | Reviewed architecture-specific equipment/energy/operations data and applicable resource evidence; acceptance under the PRD model gate |
| Broader browser / accessibility acceptance | One Windows Chrome configuration and selected screenshots are checked; full accessibility and cross-device behavior are not established | Screen-reader/contrast review, target-device coverage, cold-load/network and long-duration checks under [the review guide](APPLICATION_REVIEW.md) |
| Submission/demo acceptance | A product coverage matrix is not event eligibility or a judged submission | Timed demonstration, final submission assets, registration/team details and citations reviewed by the team |

The chat browser/native connectors previously reported unavailable hosts. Playwright now launches and inspects Windows Chrome directly under the user's explicit instruction. [The evidence](BROWSER_VALIDATION.md) includes actual screenshots, reported hardware and browser-frame cadence; it does not establish full accessibility, isolated GPU timing or cold-load acceptance.

## Optional research backlog

The monthly 2027–2033 robustness grid, sampled-route connectivity, upward-sky context, conditional rescue timing, optical dust/radiator comparison and post-acceleration ejecta trajectories are implemented. Calibrated dusty-coating/layer/transient response, engine/soil/erosion and damage, radiation dose/shielding and operational rescue retain their research gates. [Advanced planning](ADVANCED_PLANNING.md), [rescue methods](RESCUE_PLANNING.md), [dust methods](DUST_THERMAL_MODEL.md) and [ejecta methods](PLUME_EJECTA_MODEL.md) distinguish exploratory outputs from operational feasibility.

## Run and review

```powershell
npm.cmd run dev
```

Use the URL printed by Vite, normally `http://127.0.0.1:5173/`. Local Python/raw inputs are needed to prepare new dates or custom points. The standalone `lunar-workspace.html` embeds the checked data and constrains choices to its loaded records; preparing new coordinates requires the local app.
