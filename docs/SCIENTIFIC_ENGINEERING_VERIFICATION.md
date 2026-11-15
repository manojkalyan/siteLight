# Scientific and engineering verification

Review date: **15 November 2026 (Asia/Calcutta)**. PRD v4.9; evaluator `workspace-evaluator-11`; unchanged scientific bundle `dem-de421-4` plus the separate terrain-reference evidence layer. See [the current increment](TERRAIN_REFERENCE_INCREMENT.md).

**Result: source integrity and the declared numerical checks pass. Full scientific acceptance and mission-specific engineering calibration remain open.** This audit verifies the evidence currently available and records missing evidence explicitly; it does not turn assumptions into measurements.

## What was checked

| Area | Observed result | What that establishes |
| --- | --- | --- |
| Pinned source identity | **681/681 retained source records** pass SHA-256 checks; byte counts also match where specified | Includes 600 retained clone windows, not 600 whole remote TIFF hashes. Source records may reference the same retained README; this is not a count of unique whole remote files |
| Derived artifacts | **7/7 artifact checks and 13/13 report/validator linkages** pass | Scientific/radiation/evidence bundles, source manifests, audits and preparer/validator identities remain linked |
| Production geometric positions | **372 comparisons pass**: six points × two bodies × 31 epochs across 2027–2033 | The production DE421/NONE directions agree with external Horizons/DE441 geometric reference vectors within inherited software-comparison thresholds |
| Apparent direction/orientation check | **372 additional comparisons pass**, covering the same sites/epochs | A separate CSPICE reception CN+S observer recipe agrees with independent Horizons airless apparent AZ/EL. These apparent angles are never substituted into production NONE geometry |
| Terrain sampling | All six 500 km catalog horizons remain within the existing **0.1 degree diagnostic trigger** against denser 0.25 degree / 60 m outer sampling; maximum difference **0.0793465 degrees** | Same-source numerical convergence, not independent physical terrain truth. The wider terrain raises 386 half-degree sectors across four points, by at most 2.027678 degrees |
| Local correlated terrain | **100 published NASA realizations per point, 600 retained windows**, propagated through the reference 100 m radius / 20 m baseline / 12 degree footprint | Actual correlated absolute-height realizations, empirical 2.5th-97.5th percentiles. Does not cover global/far-field or orientation covariance and does not guarantee confidence bounds |
| Camera-stereo comparison | Raw PDS confidence classes 10-14 retain **57/317, 215/317 and 56/317** height samples for SHACKRDGE02, MALAPERT02 and MALAPERT03; height RMSE **0.835, 0.674 and 0.612 m** | Partial cross-product comparison at matching coordinates/baseline. Shared LOLA geodetic control, remaining artifacts and PDS/TIFF header-registration limits prevent independent absolute certification |
| NASA architecture reference | **23 published values and seven bookkeeping/rounding checks pass** for the 225-day propellant architecture | A separately labeled published reference case. Its 5 wt% water is assumed; it does not calibrate the 20-input LCSS architecture or establish local ice |
| JavaScript/API/DOM regression | **179/179 pass** | Defined evaluator, state, source, model, API and packaged-application contracts remain consistent |
| Python scientific/source fixtures | **14/14 pass** | Analytic geometry, pixel registration/no-data, bounded horizon/sensitivity behavior, independent ENU projection and radiation ingestion contracts |
| LCSS references | **Seven numeric transcriptions** from two pinned NASA PDFs pass | Published values were copied with their source/page boundaries intact; applicability remains a separate question |
| LCSS arithmetic | Water/mass balances, capacity discontinuities, power/storage units and proposal re-evaluation pass existing independent numerical fixtures | The declared hypothetical accounting model behaves as specified |
| LCSS calibration | **0/20 architecture parameters accepted**; seven have related published context | The selected architecture has not supplied applicable hardware/process/operations evidence. The separate default 1 wt% ice input is also hypothetical |
| Dust/radiator | Three laboratory rows/six optical properties pass primary-PDF checks; blackbody/energy-balance and state-isolation cases pass | A limited steady optical approximation using laboratory endmembers; not a calibrated dust-covered device |
| Ejecta | Three source files/two JPL constants verified; conic results agree with six separate Cartesian RK4 reference cases | Prescribed post-acceleration spherical-vacuum ballistics; not engine-driven soil erosion or a damage model |
| Radiation | Nine source assets rechecked/prepared: **1285 CRaTER days and 396 NIST range rows**; units, flags and interpolation/mass fixtures pass | Historical orbital silicon context and a primary-proton CSDA approximation, not surface/human dose or full shielding transport |
| Route/rescue | Known-plane/blocked-route fixtures and independently calculated response times pass | Sampled geometric connectivity and conditional timing under hypothetical assets/speeds; not vehicle or operational rescue feasibility |

The [source audit](ACCEPTANCE_SOURCE_AUDIT.json), [JavaScript JUnit results](ACCEPTANCE_JS_TESTS.xml) and [Python results](ACCEPTANCE_PYTHON_TESTS.json) retain machine-readable evidence. The [browser checks and selected visual/GPU review](BROWSER_VALIDATION.md) remain separate from scientific/engineering acceptance. Evaluator 11 applies the supported outer-horizon correction and exports the new reference evidence. Legacy engineering defaults and accepted-verdict flags remain unchanged.

## Expanded independent comparisons

The original geometric comparison covered three closely spaced epochs on one day; the original apparent check covered three sites at three epochs. This audit adds quarterly samples on 13 January/April/July/October in each supported year, leap days in 2028 and 2032, and 31 December 2033 at 23:50 UTC: **31 epochs**, with 372 cases per comparison family.

[Geometric case results](EXPANDED_GEOMETRY_VALIDATION.json) retain maximum absolute azimuth/elevation component errors of:

- Sun: **0.000000571907°**, against the existing **0.0001°** threshold.
- Earth: **0.000001755875°**, against the existing **0.005°** threshold.

[Apparent case results](EXPANDED_ORIENTATION_VALIDATION.json) retain a maximum component difference of **0.00001562655°**, against the inherited **0.01°** threshold. All thresholds were inherited before inspecting the new results; they are software screening criteria rather than approved mission accuracy requirements.

The geometric comparison uses JPL Horizons ICRF vectors centered on the Moon, with `VEC_CORR=NONE`, `TIME_TYPE=UT` and kilometers/seconds. Production uses the pinned DE421 kernels; external responses identify DE441. The local lunar rotation kernel is shared for the inertial-vector projection, so that comparison alone does not independently validate orientation. The separately requested topocentric apparent comparisons exercise that additional convention through Horizons' MEAN_ME output and CSPICE observer-fixed MOON_ME reception CN+S. The independent reference ENU projection is expressed separately from the production basis/angle functions and has analytic fixtures.

Raw source responses, exact request URLs, observer coordinates and hashes are under `data/validation/expanded/`. Validators reparse the raw rows and require them to match the stored numeric references, retain exact epoch sequences, and reject changed case/threshold contracts. Future UTC conversion retains current leap-second assumptions. Sampled agreement does not prove every intervening instant, physical surface visibility, global terrain or complete uncertainty coverage. [JPL's API specification](https://ssd-api.jpl.nasa.gov/doc/horizons.html) documents the time and correction parameters; [NAIF's correction reference](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/abcorr.html) distinguishes geometric and apparent recipes.

## Scientific acceptance still missing

1. **Independent physical terrain/reference cases with an agreed accuracy requirement.** Partial camera-stereo comparisons now use source-confidence filtering, but share LOLA control and retain coverage, artifacts and source-registration limitations. The denser-ray comparison resamples the same data. [NASA PGDA Product 78](https://pgda.gsfc.nasa.gov/products/78) documents substantial interpolation between LOLA samples; 5 m pixels do not mean every pixel is an independent measured elevation. No new subpixel truth is created by finer ray steps.
2. **A physically supported global treatment or exclusion bound.** The six catalog horizons now sample to 500 km, using a 240 m source beyond 125 km. A spherical calculation excludes farther terrain only under a declared 20 km height ceiling. That ceiling is not an independently certified physical maximum; unresolved terrain and finite sampling remain. Custom points retain their own prepared extent.
3. **Full global terrain/orientation uncertainty with a validated interpretation.** Published local correlated ensembles are implemented at the reference footprint, but do not supply outer-domain/orientation covariance. One-source-RMS sensitivity perturbs 0-125 km while holding the nominal outer annulus fixed. Neither those scenarios nor empirical local percentiles are guaranteed confidence intervals or landing-safety probabilities.
4. **An accepted relationship to the intended physical mission outputs.** The current body-center geometric sunlight/visibility proxies do not establish electrical power, finite-disk illumination, RF link performance or terrain/hardware safety.

[NASA PGDA Product 90](https://pgda.gsfc.nasa.gov/products/90) supports the declared source frame and height/error units. It does not itself approve this application's error limits or global completeness. The independent comparisons above substantially broaden software/reference evidence while leaving those physical gates explicit.

## Engineering applicability findings

[NASA BVAD Rev. 2](https://ntrs.nasa.gov/citations/20210024855) is a baseline assumptions document. Its 3.217 kg/crew/day potable-water value is one stream, whereas the app's assumed 4 kg/crew/day input describes gross circulating demand. Replacing one with the other would change the accounting boundary.

[The NASA lunar water ISRU study](https://ntrs.nasa.gov/citations/20210016820) concerns a human-scale **propellant-production** architecture. Its checked extraction, battery, production-time, mass and power values do not identify the app's hypothetical per-unit extraction equipment or complete installed LCSS system. Maximum battery discharge is also distinct from conversion efficiency. Values were not scaled or copied into unrelated parameters merely because the units appear compatible.

The user-selected [NASA reference architecture, Kleinhenz and Paz (2020)](https://ntrs.nasa.gov/citations/20205007966) is now available as a separate 225-day propellant study. Its 23 pinned source values and seven accounting/rounding checks retain the 4.89 tonne component sum versus printed 4.9 tonne subtotal and 398 tonne regolith versus rounded 15 tonne water distinctions. The study assumes 5 wt% water; it excludes surface power generation/transmission, additional communications/autonomy equipment and propellant delivery to its user, while water cleanup is not explicitly included. It does not reproduce an unpublished subsystem design, prove flight performance or turn the unrelated four-crew/730-day LCSS inputs into applicable hardware calibration.

The separate default ice concentration of **1 wt%** has no selected-site extractable-ice measurement loaded. The LCROSS context observation remains associated with Cabeus ejecta; it is not transferred to the six study points. No applicable source found in this audit supplies the chosen hardware bill of materials, full electrical/thermal process loads, 730-day schedule or local extraction-yield evidence. This is a finding about the available inputs, not a claim that no such evidence could exist elsewhere.

### All 20 architecture inputs

| Parameter | Current assumed value | Evidence required |
| --- | --- | --- |
| Gross loop water demand | 4 kg / crew / day | Define potable, hygiene, food, EVA and other streams and their recovery boundaries. |
| Loop water recovery | 0.75 fraction | Demonstrate architecture-specific stream recovery, losses and degradation. |
| Initial water inventory | 100 kg | Size startup inventory with a commissioning and water-loop balance. |
| Makeup-water reserve | 30 days | Define reserve policy and credible outage/replenishment cases. |
| Fraction of makeup supplied by ISRU | 1 fraction | Define the imported/produced water allocation and startup schedule. |
| Extractable fraction of ice | 0.5 fraction | Measure accessible local ice fraction, depth, distribution and excavation losses. |
| Water capture / purification recovery | 0.75 fraction | Separate extraction, capture and purification yields using an applicable process. |
| Regolith throughput per unit | 20 kg / h | Validate excavation/feed throughput against material and operating conditions. |
| Electrical capacity per unit | 2.5 kW | Size electrical and thermal loads, auxiliaries, startup and peak demand. |
| Process energy per regolith mass | 0.1 kWh / kg | Validate full regolith process energy with temperature and heat recovery. |
| Additional process energy per water mass | 0.5 kWh / kg | Validate additional capture/purification energy without double counting. |
| Operating duty over 730 days | 0.5 fraction | Validate a 730-day operating/maintenance and energy-availability schedule. |
| Installed extraction unit mass | 150 kg / unit | Provide an installed equipment bill of materials and declared margins. |
| Shared ISRU balance of plant | 500 kg | Inventory shared plant, deployment, controls and thermal equipment. |
| Power generation specific mass | 20 kg / kW | Select a generator and include distribution, conversion and deployment. |
| Independent storage autonomy | 72 h | Size autonomy against a declared load and accepted outage schedule. |
| Usable storage efficiency | 0.9 fraction | Separate usable depth of discharge, conversion losses and degradation. |
| Storage specific mass | 10 kg / kWh | Validate installed storage mass per nameplate energy, thermal control and margins. |
| Life-support hardware | 8000 kg | Provide an architecture-matched life-support equipment inventory. |
| Dry-system spares fraction | 0.1 fraction | Define reliability, maintenance, replacement inventory and allocation basis. |

## Reproduce

Run the source/reference checks in the project terminal:

```powershell
npm.cmd run engineering:verify
npm.cmd run engineering:verify-nasa
npm.cmd run dust:verify
npm.cmd run plume:verify
npm.cmd run radiation:prepare
npm.cmd run science:expanded-acquire
npm.cmd run science:expanded-verify
npm.cmd run science:expanded-orientation-acquire
npm.cmd run science:expanded-orientation-verify
npm.cmd run science:horizon-verify
npm.cmd run terrain:acquire-ensembles
npm.cmd run terrain:compare-stereo
npm.cmd run terrain:extend-horizon
npm.cmd run terrain:prepare-evidence
npm.cmd run science:test
npm.cmd test
npm.cmd run acceptance:audit
```

Raw scientific files and the local Python environment are required. Expanded acquisition reuses pinned local responses; it only downloads missing references from JPL and refuses silent changes to existing pinned sources/specifications. Terrain acquisition uses bounded concurrent source-window transfers and resumes pinned cached windows; source integrity remains checked. `acceptance:audit` verifies raw/source hashes and current result/validator linkages; it does not itself rerun every preceding numerical task or grant physical/engineering acceptance.

## What closes the remaining engineering gates

Define one equipment architecture, supply its installed bill of materials and operating conditions, establish stream-by-stream water recovery and extraction/capture yields, size peak/auxiliary energy and installed storage, and validate startup/outage/degradation/maintenance across 730 days. Supply applicable local resource evidence or retain an explicitly hypothetical resource study. Then compare independent architecture-matched cases under agreed tolerances and record engineering review. Dust, engine/soil plume, full radiation transport and operational vehicle/rescue models need their own applicable physical reference cases; their current exploratory outputs do not close those requirements.
