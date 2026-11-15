# Terrain evidence and NASA reference architecture — v4.9

Review date: **15 November 2026 (Asia/Calcutta)**. Requirements: [PRDnew.md](../PRDnew.md). Runtime evaluator: `workspace-evaluator-11`; base scientific bundle: `dem-de421-4`; additional terrain evidence: `sitelight-terrain-acceptance-evidence-1`.

The six catalog study points now use a corrected nominal horizon out to 500 km, published local correlated terrain realizations, and available quality-filtered camera-stereo comparisons. A separate published NASA water-ISRU architecture provides a reference accounting case. These additions improve the evidence and expose a real obstruction missed by the previous 125 km cutoff. They do not establish complete physical terrain accuracy, global scientific confidence bounds, flight hardware calibration, or measured local extractable ice.

## Delivered scope

| Component | Implemented evidence | Declared boundary |
| --- | --- | --- |
| Correlated local terrain | 100 published NASA realizations at each of six points: **600 retained windows** | Reference footprint: **100 m radius, 20 m slope baseline, 12 degree slope limit**; no global/orientation covariance |
| Nominal horizon | Existing 5 m local / 80 m polar terrain plus a NASA 240 m outer annulus from 125 to 500 km | Finite spatial sampling; unresolved peaks and outer-domain height errors remain |
| Wider-horizon diagnostic | Six comparisons against denser rays; maximum difference **0.0793465 degrees** | The inherited **0.1 degree** trigger is a sampling diagnostic, not physical truth or an approved mission accuracy tolerance |
| Camera-stereo comparison | Three partial product comparisons at two exact study points, filtered using raw PDS confidence classes | Shared LOLA control, incomplete coverage, image artifacts and source registration remain limitations |
| NASA reference architecture | **23 checked published values** and **7 bookkeeping/rounding checks** | Published two-site propellant reference study; distinct from the 20-input four-crew/730-day LCSS explorer |

## Published correlated terrain

The [NASA PGDA high-resolution south-pole products](https://pgda.gsfc.nasa.gov/products/78) supply 100 clones for each selected tile: Site04, Site01, Site11, Site06, Site07 and Site23. Each retained window is 149 by 149 native 5 m pixels centered on the exact source pixel used for that catalog point. Despite the remote `_err.tif` filename, these clones contain **absolute surface elevations**. The nominal surface is not added a second time.

Each realization passes through the declared footprint calculation: bilinear heights, centered finite-difference slopes, a fitted-plane detrended roughness, and area within the reference slope limit. The bundle retains member statistics and empirical 2.5th, 50th and 97.5th percentiles. These are **ensemble percentiles**, not guaranteed confidence bounds or probabilities of a safe landing. Error correlations across members at neighboring source pixels are retained; their 5 m and 100 m separations describe projected-grid offsets.

The displayed applicability flag matches the current radius, baseline and limit against the frozen reference settings. Changing those controls does not relabel the precomputed ensemble as a newly evaluated uncertainty result. Another coordinate, a custom point, a different scientific source identity, or a different data mode cannot inherit the catalog evidence. No independent synthetic pixel noise is substituted for missing source realizations.

Retained subset files have SHA-256 identities and declared source URLs/windows. Acquisition metadata records byte ranges where available. A subset hash is not represented as a hash of the entire remote TIFF. The additional bundle records the scientific input identities, preparation identity and acquisition manifest identity. Source checks and software tests verify those linkages.

## Corrected 500 km nominal horizons

The wider annulus uses [NASA's polar 240 m DEM](https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_60S_240MPP_ADJ.TIF). Production rays retain 0.5 degree azimuth spacing and use 120 m radial steps over 125–500 km. They are combined by taking the maximum of the nearer and outer sampled horizons. The near-field model remains 5 m terrain to 7 km with 2.5 m radial steps; the intermediate domain uses 80 m terrain to 125 km with 40 m steps.

| Catalog point | Horizon sectors raised out of 720 | Largest increase, degrees | Maximum dense-comparison difference, degrees |
| --- | ---: | ---: | ---: |
| Shackleton rim | 0 | 0 | 0.0793465 |
| Connecting ridge | 0 | 0 | 0.0295975 |
| de Gerlache rim | 97 | 2.027678 | 0.0764980 |
| Nobile rim | 105 | 1.443851 | 0.0753120 |
| Peak near Shackleton | 130 | 1.332335 | 0.0530825 |
| Malapert massif | 54 | 0.695593 | 0.0618830 |

The additional annulus raises **386 sectors across four points**, by as much as **2.027678 degrees**. The evaluator, charts and schedule calculations include those nominal obstructions. A denser check uses 0.25 degree azimuths and 60 m outer radial steps, combined with the earlier dense near/intermediate audit. All six cases remain within the 0.1 degree diagnostic trigger. This compares sampling of sourced terrain; it does not validate the physical terrain independently.

A spherical geometric calculation also bounds apparent terrain elevation beyond 500 km **conditional on all such terrain remaining below a declared 20 km height ceiling**. Under that assumption, the bound is below the modeled horizon in all 720 sampled directions at each point. The ceiling is not independently certified as a physical maximum here. Neither this calculation nor the finite ray sampling promotes `farFieldComplete` to true.

The source-RMS sensitivity remains deliberately partial: it perturbs the original 0–125 km terrain/observer cases while holding the 125–500 km annulus at its nominal horizon. It is not a full-domain statistical uncertainty calculation. Local clone footprint statistics are separate from those horizon sensitivity cases. Custom points retain their own prepared horizon extent and do not receive this catalog extension automatically.

Numerical details and source hashes: [far-field audit](FARFIELD_EXTENSION.json), [earlier near/intermediate sampling audit](HORIZON_SAMPLING_VALIDATION.json), and [prepared terrain evidence](../data/science/terrain-acceptance-evidence.json).

## Quality-filtered stereo comparisons

The [LROC stereo terrain archive](https://data.lroc.im-ldi.com/lroc/rdr_product_select) supplies image-derived terrain for comparison at the same geographic coordinates and 20 m slope baseline. No fitted height bias or horizontal registration shift is used to improve agreement. Every bilinear support pixel must have a successful-correlation raw PDS confidence class in 10–14. Slope comparisons additionally require qualified support at all finite-difference endpoints. Shadowed, saturated, suspicious, interpolated/extrapolated and manually edited classes are excluded by this declared policy.

| Point / stereo product | Accepted height samples out of 317 | Raw finite height samples | Height RMSE, m | Mean stereo-minus-PGDA height, m | Accepted slope samples | Slope RMSE, degrees |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Connecting ridge / SHACKRDGE02 | 57 | 66 | 0.835194 | +0.688489 | 22 | 1.209934 |
| Malapert / MALAPERT02 | 215 | 224 | 0.673627 | +0.498417 | 159 | 1.295103 |
| Malapert / MALAPERT03 | 56 | 73 | 0.612295 | −0.438441 | 19 | 1.171928 |

The other four study points have no matching coverage in the compared products at their exact coordinates. Nearby products are not substituted. The three rows are separate comparisons, not independent or additive coverage measurements.

The confidence input is the categorical PDS `.IMG`, not a display-stretched browse TIFF. Categorical nearest-neighbor resampling follows each source's declared georeferencing onto its DTM grid; a PDS/TIFF header registration difference is retained as a review limitation. This operation is not independently validated image registration. Source-confidence selection cannot remove all jitter, seams, shadows or geolocation differences. Both camera products and the PGDA surface use LOLA geodetic control, so their agreement cannot certify fully independent absolute terrain accuracy. These rows have `acceptedAbsoluteAccuracy: false`.

Retained windows, confidence policy, source READMEs, detailed samples and hashes are recorded in the [stereo audit](STEREO_TERRAIN_COMPARISON.json).

## Published NASA water-ISRU reference study

The selected [Kleinhenz and Paz NASA reference architecture](https://ntrs.nasa.gov/citations/20205007966) is a two-site water mining, transport and propellant-production study. Its source values and PDF page references are retained in [the reference specification](../data/engineering/nasa-reference-case.json), with [23 verified transcriptions](../data/engineering/nasa-reference-validation.json).

The source reports a 225-day production period, 4.9 tonne hardware subtotal, 68 kW power demand and 15 tonnes of water. Its **5 wt% water concentration is an assumed deposit**, not a measurement at any selected SiteLight point. The seven numerical checks cover mass/power ledgers, idealized water/hydrogen/oxygen bookkeeping, effective regolith yield and square-mine geometry. They preserve printed precision: components sum to 4.89 tonnes against the printed 4.9 tonne subtotal, and 398 tonnes of regolith at the assumed effective yield produce 14.925 tonnes of water against the printed 15 tonnes. The model does not force those rounded values into false exact equalities.

Published exclusions remain visible: power generation/transmission, additional communications/autonomy equipment, cleanup not explicitly modeled, and delivery of propellant to its user. The calculation does not reproduce an unpublished subsystem spreadsheet or demonstrate flight equipment performance.

The reference panel/report is separate from the existing four-crew/730-day LCSS explorer. **Zero of its 20 legacy parameters are claimed calibrated by this reference study.** Its equipment, operations, storage and local ice inputs remain assumptions. Neither reference output changes the environmental verdict or enables an accepted logistics constraint.

## Reproduction and verification

Run these commands from the project root in PowerShell. Acquisition is resumable and uses the declared primary sources; it requires network access and local storage. Preparation and verification use the retained assets.

```powershell
npm.cmd run terrain:acquire-ensembles
npm.cmd run terrain:compare-stereo
npm.cmd run terrain:extend-horizon
npm.cmd run terrain:prepare-evidence
npm.cmd run engineering:verify-nasa
npm.cmd run acceptance:audit
npm.cmd run science:test
npm.cmd run build:workspace
npm.cmd test
npm.cmd run build
npm.cmd run test:ui
npm.cmd run test:chrome
```

The current regression and browser runs are recorded in the final verification artifacts; this increment does not predeclare their test totals. Consult [the source audit](ACCEPTANCE_SOURCE_AUDIT.json), [verification summary](ACCEPTANCE_VERIFICATION_SUMMARY.json), [JavaScript results](ACCEPTANCE_JS_TESTS.xml), [Python results](ACCEPTANCE_PYTHON_TESTS.json) and [browser review](BROWSER_VALIDATION.md). Their dates, model versions and recorded scope determine which completed run they describe.

## Remaining physical acceptance gates

| Gate | Evidence still needed |
| --- | --- |
| Independent absolute terrain accuracy | Mission-approved accuracy tolerances and independently controlled reference measurements/terrain covering each actual footprint; review of source registration and artifacts |
| Global scientific uncertainty | A sourced joint model for near/intermediate/outer terrain and observer/orientation errors, or suitable full-domain correlated realizations, with documented statistical interpretation |
| Physical horizon completeness | A defensible physical global height/exclusion argument and unresolved-terrain treatment; the declared 20 km ceiling and sampling diagnostic alone do not establish this |
| Engineering calibration | Architecture-specific equipment masses, process yield/energy, storage, duty cycles, losses, reliability and operations evidence, with independent engineering review and applicable hardware tests |
| Local extractable ice | Measurements or appropriately qualified resource evidence at the actual extraction location/depth, including accessibility, concentration, recovery and contamination uncertainty; a regional indication or reference-study assumption is insufficient |

Nominal environmental fits therefore remain **uncertain**. The software can preserve measurements, calculate declared models and expose missing evidence; it cannot replace unperformed physical measurements or certify NASA/mission acceptance.
