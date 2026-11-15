# SiteLight AI — Product Requirements Document

**Product:** Lunar Landing Site Navigator  
**Version:** 4.10 — sourced terrain ensembles, extended horizons and NASA reference architecture  
**Updated:** 15 November 2026  
**Owner / submission deadline:** To be recorded  
**Status:** Historical seismic evidence screening is delivered alongside the sourced terrain and NASA reference architecture. Six catalog study points now have 500 km nominal horizons, 600 published local correlated terrain windows, partial confidence-filtered stereo comparisons and a separately labeled NASA reference architecture. Custom coordinates retain their own prepared extent. Full physical scientific acceptance, mission-specific engineering calibration and local extractable-ice evidence remain open; nominal fits stay uncertain. Final regression/browser evidence is recorded in the verification artifacts.

## 1. Purpose and document authority

**v4.10 seismic evidence delivery:** [Moonquake and ground stability context](docs/SEISMIC_CONTEXT.md) adds historical source maps, original catalogs, real Apollo waveform playback and A/B nominal reference-point proximity beside existing terrain evidence. It uses 48 retained polar scarp points, 28 shallow events (including missing/alternate locations), eight controlled impacts, five historical stations and two LPZ records. It does not quantify local shaking hazard, forecast events or evaluate shaking-triggered slope failure. The newer south-polar fault survey is not silently substituted for the retained 2015 point inventory.

**Evidence/export presentation delivery:** [Reference implementation](docs/EVIDENCE_EXPORT_REFERENCE_UI.md) provides searchable source-layer rows and inspectors, dated Validation/Limits views, a live five-section report, independent A/B/source/research inclusion controls, reproducible canonical identity, JSON, actual time-series CSV, interval CSV and browser Print/PDF. All values follow the retained records/current assessment. Report selections do not change scientific results or close acceptance gates.

**UI 1 implementation:** [Release and validation](docs/UI1_RELEASE.md) records the delivered four-tab interface, six Screening sections, draft mission settings, dynamic local footprint ensemble, source-aware 3D overlays and exports. The scientific models and acceptance limits below remain authoritative; the design mockups are illustrative references.

**Current v4.9 delivery:** [Terrain evidence and NASA reference architecture](docs/TERRAIN_REFERENCE_INCREMENT.md) adds 100 source realizations per catalog point for the fixed 100 m/20 m/12 degree reference footprint, corrects 386 horizon sectors across four points using a 125–500 km outer annulus, and retains partial raw-PDS-confidence-filtered stereo comparisons. The 0.1 degree convergence trigger and beyond-500 km exclusion under a declared 20 km height ceiling remain qualified checks. The NASA two-site propellant architecture has 23 checked values and seven bookkeeping/rounding checks; its 5 wt% water is assumed and it does not calibrate the unrelated 20 legacy LCSS inputs. This increment supersedes the horizon/evidence status in the historical entries below. Current test outcomes belong to the final verification artifacts, not earlier test totals.

**Scientific/engineering verification follow-up:** [The audit](docs/SCIENTIFIC_ENGINEERING_VERIFICATION.md) verifies 69 pinned files, 744 expanded geometric/apparent reference comparisons, six denser terrain comparisons and 168 JavaScript/10 Python checks. It records all 20 uncalibrated LCSS inputs and remaining independent terrain/global/correlated-error evidence requirements. This advances reference verification without promoting hypothetical parameters or enabling full scientific/engineering verdicts.

**Browser validation follow-up:** [Playwright and Windows Chrome evidence](docs/BROWSER_VALIDATION.md) records 11 automated UI cases plus one headed hardware/recovery review, selected desktop/mobile screenshot inspection and responsive/recovery corrections. Broader accessibility, cross-device, cold-load and long-duration review remain open; scientific and engineering acceptance gates are unchanged.

**v4.8 delivery:** [Loaded-record landing-start windows](docs/START_WINDOW_SCAN.md) checks every supported UTC ten-minute grid start against the current mission duration, Sun/Earth/overlap and enabled outage rules. Consecutive nominal fits are grouped with inclusive sampled endpoints; unknowns remain distinct. Boundary selection rechecks the complete evaluator, and source/point/requirement changes invalidate incompatible studies. JSON/print/hash evidence and bounded study caching are implemented. This provides finer schedule screening, without implying continuous feasibility or closing scientific/engineering/browser acceptance.

**v4.7 partial radiation delivery:** [Radiation observations and primary-proton screening](docs/RADIATION_MODEL.md) adds 1285 historical CRaTER orbital days with original flags/coverage and a separate NIST CSDA comparison using 396 range rows across three materials. Independent A/B archive and proton/slab settings, residual primary-energy brackets, panel thickness/mass and JSON/print/hash evidence are implemented. Orbital silicon Gy, primary-proton MeV and human Sv remain distinct; no surface dose, full shielding-effectiveness, secondary transport or health/safety result is inferred.

**v4.6 delivery:** [Conditional plume/ejecta exploration](docs/PLUME_EJECTA_MODEL.md) adds prescribed post-acceleration particle trajectories on an ideal nonrotating Moon, up to five hypothetical assets, envelope-entry geometry, flight times and single-grain kinetic energy. Independent A/B settings, two checked JPL constants, three pinned references and JSON/print/hash evidence are included. Engine/nozzle/descent/soil coupling, erosion, launch distributions, real terrain, deposition and damage remain unassessed; no safe radius or operational hazard verdict is produced.

**v4.5 delivery:** [Dust/radiator optical sensitivity](docs/DUST_THERMAL_MODEL.md) adds independent A/B clean-versus-dust-covered radiator comparisons, three pinned laboratory simulant presets (six verified optical values), adjustable coverage/device/heat/environment assumptions, equilibrium temperatures, signed heat-capacity margins and a coverage curve. JSON/print/hash evidence is included. The rule-of-mixtures approximation is not conservative; dust-layer conduction, transients, calibrated coating response and operational thermal acceptance remain open. Historical Diviner context and environmental verdicts remain separate.

**v4.4 delivery:** [Conditional rescue planning](docs/RESCUE_PLANNING.md) adds independent A/B hypothetical asset declarations tied to point/start, availability, outbound/loaded-return speeds, mobilization/handling delays, optional return, endurance/completion comparisons and timestamped JSON/print evidence. It uses the bounded sampled route; all response parameters are assumptions. No operational rescue, medical, energy or safe-return verdict is inferred.

**v4.3 delivery:** [Engineering calibration tracking](docs/ENGINEERING_CALIBRATION.md) adds two pinned NASA primary references, seven verified numeric transcriptions, per-parameter provenance/required evidence, a review checklist and exported evidence. All 20 LCSS architecture inputs remain assumptions pending applicable engineering validation; published context is not automatically transferred into the calculator. Environmental and accepted logistics verdicts retain their previous boundaries.

The [advanced planning increment](docs/ADVANCED_PLANNING.md) implements 84 first-of-month real-geometry windows for 2027–2033, bounded sampled-terrain routes and geometric upward-sky context. Scientific/engineering/browser acceptance and dust/plume/dose/rescue numerical models retain their stated gates; the document defines the concrete input/reference requirements for starting each remaining research model.

The [current implementation/release status](docs/CURRENT_STATUS.md) records the v4.1 reliability fixes, implemented capabilities and remaining evidence-dependent acceptance. An [application review/demo procedure](docs/APPLICATION_REVIEW.md) is prepared for rendered browser review when supported access is available. This status supersedes stale snapshot wording in historical implementation sections.

Current numerical/data changes and acceptance limits are recorded in [the v4.0 sampling refinement](docs/SAMPLING_REFINEMENT.md). Production uses 720 half-degree rays, 2.5 m local radial steps and 40 m far-field radial steps with the existing 5 m/80 m source pixels. All six cases are below the 0.1° diagnostic convergence trigger against the finer audit grid; this is not an absolute accuracy guarantee. Older implementation sections retain their historical recipes.

SiteLight AI helps users compare lunar landing locations and surface start times, understand unmet environmental requirements, and investigate changes that could make a scenario meet those requirements.

This is the current planning baseline for future implementation. It consolidates the latest supplied PRD into feature requirements, priorities, and acceptance criteria. Follow [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for development order and completion tracking.

- [Latest supplied PRD, retained verbatim](docs/reference/user-supplied-lcss-prd.txt).
- [Supplied data-sourcing notes, retained verbatim](docs/reference/user-supplied-data-sourcing-notes.txt).
- [Additional-feature and real-data review](docs/FEATURE_DATA_ROADMAP.md).
- [Implemented real-data increment and ordered remaining work](docs/REAL_DATA_INCREMENT.md).
- [Previous implementation specification](docs/archive/PRD-v2.0.md).
- [Earlier product direction](docs/archive/PRD-v1.0.md).

The source's proposed challenge coverage, judging weights, exclusive novelty, and example scientific results are not independently verified facts. Coverage checkmarks are treated as planned acceptance checks, not completed work.

**Working pitch:** When a lunar surface plan changes, SiteLight shows which evaluated requirement fails, the size of the shortfall, and which tested adjustment resolves it.

## 2. What is changing

The new scope has two main features:

1. **Binding Constraint Explainer:** Explain failed sunlight, Earth visibility, and overlap requirements using values, time intervals, and plain-language sentences.
2. **Life-Support Coupled Site Score (LCSS):** Estimate a defined two-year logistics/system mass, identify its contributors, and compare it against a configurable budget.

The approved additions include slope/terrain screening, continuous darkness and Earth-visibility gaps, historical thermal context, and staged mobility, dust, plume, radiation, and contingency research. Section 14 defines their delivery gates. Slope/gap screening and a bounded Diviner observation layer are implemented; advanced numerical predictions remain dependent on accepted data and models.

The multi-year robustness calendar becomes **stretch scope**. The hackathon does not require 3D terrain rendering or CopperOS research automation.

The original CopperOS application and separate visual prototypes remain synthetic demonstrations. The default workspace now uses real NASA terrain and matched DE421 geometry at six study points, with the bounded scope documented in Sections 16–18. The accepted LCSS model and full scientific/browser acceptance are not complete.

## 3. Users and decisions

| User | Decision SiteLight supports |
| --- | --- |
| Mission concept planner | Which supported site/time meets the selected environmental requirements? |
| Logistics planner | Under stated assumptions, which candidate has a lower estimated two-year mass burden? |
| Science planner | How do conditions change between selected locations and dates? |
| Educator or student | Why do terrain and timing make lunar south-pole planning difficult? |
| Hackathon reviewer | Can the app explain a failure and demonstrate a verified change in under 90 seconds? |

These are preliminary screening decisions. Operational mission control, flight certification, and vehicle-level safety are outside scope.

## 4. Delivery priorities and feature list

| ID | Feature to add | Tier | Completion evidence |
| --- | --- | --- | --- |
| A | Supported site catalog, coordinates, dates, and scenario setup | 1 — MVP | Two valid scenarios can be configured without invented coverage |
| B | Sun/Earth geometry and terrain-horizon visualization | 1 — MVP | Reference geometry/horizon cases pass documented tolerances |
| C | Deterministic environmental verdict | 1 — MVP | Correct Sun, Earth, and overlap metrics and rule margins |
| D | Binding Constraint Explainer | 1 — MVP | Every failing rule has a traceable explanation |
| E | Scenario Surgery and sampled flip search | 1 — MVP | Verified adjustment changes the evaluated verdict |
| F | Side-by-side comparison | 1 — MVP | Scenario A/B results match their evaluations |
| G | LCSS, logistics breakdown, ice assumptions, and logistics flip | 2 — should ship | Reviewed mass model and reproducible logistics cases |
| H | Multi-year robustness calendar | 3 — stretch | Calendar cells reproduce direct sampled evaluations |
| I | Provenance, approximations, and reproducibility | 1; extended in Tier 2 | Results identify all relevant inputs, sources, and versions |
| J | Technical/plain view, accessibility, and basic demo | 1 — MVP | Same result is understandable and keyboard accessible |
| F/J extensions | Delta view, report export, animation, extended demo | 3 — stretch | Added only after core and logistics gates pass |
| EXT-01 | Slope, terrain roughness where supported, footprint coverage, and uncertainty | 1 — next screening addition | Scale-defined terrain record and reference checks; unsupported rock detection remains explicit |
| EXT-02 | Longest darkness and geometric Earth-visibility gaps | 1 — next screening addition | Timestamped intervals, maximum gaps, boundary coverage, and explicit outage requirements |
| EXT-03 | Surface-temperature context | 2 — conditional layer | Suitable Diviner product and correct spatial/temporal interpretation |
| EXT-04 | Terrain/path connectivity | 3 — optional follow-on | Defined geometric screening assumptions and route fixtures |
| EXT-05 | Dust/radiator sensitivity | Research backlog | Accepted device-specific model before numerical penalties |
| EXT-06 | Post-acceleration ejecta exploration | Conditional ballistics implemented | Prescribed ideal-sphere trajectories and hypothetical asset envelopes; engine/soil/erosion and damage predictions remain gated |
| EXT-07 | Radiation observations and primary protons | Partial delivery | Historical orbital silicon rates and NIST primary-proton CSDA comparison implemented; full transport and surface/human dose remain open |
| EXT-08 | Contingency/rescue reachability | Research backlog | Declared assets, response/mobility/endurance assumptions, and reference cases |

**Scope rule:** Protect Tier 1 first. If LCSS is incomplete or unsupported, label it pending and keep it out of final verdicts. Do not display a placeholder mass as a calculated result.

## 5. Shared terms, inputs, and defaults

### 5.1 Scientific terms

- **Landing UTC:** Start of the surface assessment. A launch-date change cannot be converted to a landing-time change without a trajectory relationship; that model is excluded.
- **Solar-eligible time:** Sun clears the terrain horizon and meets the chosen elevation threshold. This is a geometric proxy, not net electrical power.
- **Earth-visible time:** Geometric visibility under a documented body/horizon approximation. It does not establish an RF link or ground-station availability.
- **Overlap:** Solar eligibility and Earth visibility occur simultaneously.
- **Passing scenario:** Meets all enabled, sufficiently assessed requirements under this model. It is not a safe-landing certification.
- **Ice slider:** A hypothetical sensitivity input. Moving it does not establish the site's actual ice concentration.
- **LCSS:** A screening mass in kilograms, with its accounting boundary and assumptions published. It is not a dollar cost or a full ECLSS design.

### 5.2 Initial defaults from the supplied PRD

| Parameter | Initial value | Interpretation |
| --- | --- | --- |
| Comparison | Two scenarios; four as stretch | Same requirements by default |
| Catalog | At least six sourced entries | Validate three first; expand without fabricating data |
| Landing-date target | 2027–2033 | Restrict actual controls to available coverage |
| Surface duration | 168 hours | Slider target 48–336 hours |
| Date sweep | ±60 days, daily steps | First passing sample, unless a finer search is validated |
| Minimum solar elevation | 2 degrees | Editable from 0 to 8 degrees |
| Minimum solar-eligible fraction | 40% | Fraction of the entire requested surface interval |
| Minimum Earth-visible fraction | 30% | Separate from simultaneous availability |
| Minimum overlap fraction | 20% | Intersection of both availability masks |
| Geometry step | No coarser than 10 minutes | State transition/integration precision |
| Horizon grid | 360 bins at 1-degree spacing | Document interpolation and ray sampling |
| Logistics baseline | Four crew, 730 days | Separate from the seven-day environmental scenario |
| Logistics budget | 18,000 kg | Assumed editable budget, not a published vehicle limit |
| Hypothetical ice sweep | 0.1–6.0 wt% | Unit conversion and evidence status must be explicit |

The two time horizons must remain separate in the interface: surface visibility is evaluated over the selected hours; LCSS uses a two-year architecture baseline. Any coupling between them requires a defined model.

## 6. Functional requirements

### Module A — Site, date, and scenario selection

**User need:** Configure comparable, supported site/time scenarios.

- **FR-A1:** Target six curated entries covering Shackleton Rim, Malapert Massif, de Gerlache Rim, Connector Ridge, Nobile Rim, and a separately identified Apollo/CLPS reference. Obtain exact coordinates from sources before scientific evaluation.
- **FR-A2:** Store coordinates/frame, terrain elevation/height reference, observer height, horizon reference, and available ice evidence. Unknown fields stay unknown. Use the source register and evidence rules in Section 13.
- **FR-A3:** Validate custom coordinates and coverage. Use the DEM tile containing the actual location; another site's horizon cannot stand in for it.
- **FR-A4:** Support two independent scenarios A/B; up to four is stretch.
- **FR-A5:** Restrict the date picker to actual full-interval data coverage within the target dates.
- **FR-A6:** Validate mission duration and explicit UTC timestamps. Use half-open intervals [start, end).
- **FR-A7:** Show documented local solar phase/longitude context alongside UTC.

**Acceptance:** Invalid inputs are rejected clearly. Unsupported custom sites produce a coverage message. Non-polar references are not presented as supported south-polar candidates. Selecting one scenario does not overwrite the other.

### Module B — Geometry, terrain horizon, and skyplot

- **FR-B1:** Generate Sun/Earth geometric altitude and azimuth at the declared step.
- **FR-B2:** Pin a documented JPL ephemeris and compatible lunar orientation inputs; document the exact lunar-fixed/local-frame and time transformation chain.
- **FR-B3:** Include lunar orientation/libration in the model and record its treatment.
- **FR-B4:** Use real LOLA-derived terrain from the Section 13 source register, with resolution, units, height reference, coverage, and no-data masks. Synthetic terrain is limited to labeled development/test fixtures.
- **FR-B5:** Precompute a 1-degree horizon for each site/observer/terrain configuration, reusable across dates.
- **FR-B6:** Apply a declared visibility convention; initial body-center test is geometric elevation > terrain horizon. Document ray extent, terrain sampling, curvature, and edge treatment.
- **FR-B7:** Display a polar horizon silhouette and Sun/Earth tracks colored by evaluated visibility.
- **FR-B8:** Expose raw geometric elevation and terrain-masked status separately in a timeline/table.

**Acceptance:** Independent geometry and horizon cases satisfy approved numerical tolerances. Charts and evaluator use the same records. Missing DEM values are not converted to a flat horizon.

### Module C — Environmental verdict engine

- **FR-C1:** Calculate duration-weighted solar eligibility, Earth visibility, and overlap. PASS requires all enabled minimum fractions to be met.
- **FR-C2:** Use the defaults in Section 5, with explicit thresholds, operators, measured values, and margins.
- **FR-C3:** Verdicts are deterministic and rule based; no ML or LLM is in the calculation path.
- **FR-C4:** Distinguish illumination, communication, overlap, and enabled logistics failures. Preserve multiple failing labels.
- **FR-C5:** Include INSUFFICIENT_DATA and UNCERTAIN states where appropriate. Missing required inputs cannot create PASS.
- **FR-C6:** Keep logistics disabled until Module G is accepted. An absent logistics model is not a passing logistics assessment.
- **FR-C7:** Display EXT-01 terrain screening and EXT-02 continuous-gap checks alongside environmental fractions. Keep their coverage/status distinct; an environmental PASS must not imply the footprint, vehicle safety, or an unsupported operational model passed.

**Acceptance:** Test exact thresholds, disjoint sunlight/Earth windows, partial final intervals, invalid fractions, gaps, and multiple failures. Cumulative availability is not described as continuous operation.

### Module D — Binding Constraint Explainer

- **FR-D1:** Identify failed aggregate rules and their deficits, then compute relevant contiguous interruption intervals.
- **FR-D2:** Rank environmental diagnostic intervals by documented weight × duration; initial weights are solar loss 1.0 and Earth visibility loss 0.6.
- **FR-D3:** Show requirement, shortfall, start/end UTC, duration, relevant azimuth span when justified, and modeled consequence.
- **FR-D4:** Generate technical and plain-language explanations from structured templates.
- **FR-D5:** Update explanations from the same result after any supported scenario edit.
- **FR-D6:** Do not double-count terrain blockage and nested elevation-threshold loss. Do not call the longest gap a binding cause when the actual enabled rule passes.
- **FR-D7:** Verify a claimed fix through re-evaluation. If a setting resolves only one failure, show the remaining failures.

**Acceptance:** Three independently specified fixtures produce correct rules, deficits, intervals, and sentences. A passing scenario containing dark intervals is not falsely labeled failing. Wording describes geometric eligibility rather than guaranteed electrical power loss.

### Module E — Scenario Surgery and flip points

- **FR-E1:** Offer landing-time offset, duration, solar elevation, environmental requirement settings, and, when Module G is ready, hypothetical ice concentration.
- **FR-E2:** Update supported cached results within one second of a settled edit; disclose loading, stale, and failed calculations.
- **FR-E3:** Search a declared grid for the nearest tested passing configuration; show search bounds, direction/tie-break rule, and resolution.
- **FR-E4:** Snap to flip applies exactly the evaluated values and displays every change.
- **FR-E5:** Show No flip within this range when appropriate. Preserve unknown coverage rather than claiming an unqualified earliest solution.
- **FR-E6:** Do not interpolate binary verdicts. Continuous-data interpolation requires validation; label sampled flips at their actual precision.
- **FR-E7:** Preserve an immutable baseline and prevent older requests from replacing newer results.

**Acceptance:** Verified flip and no-flip fixtures behave correctly. Reverting edits reproduces baseline. No slider silently relaxes another requirement.

### Module F — Comparison and reporting

- **FR-F1:** Display scenario A/B cards with comparable units and visible differences in assumptions.
- **FR-F2:** Show solar-eligible %, Earth-visible %, overlap %, and accepted Tier 2 LCSS in kg.
- **FR-F3:** Show the failed-rule caption and unknown/not-evaluated checks.
- **FR-F4:** Stretch: display metric and binding-requirement deltas.
- **FR-F5:** Stretch: export printable HTML/PDF and JSON with settings, completed results, explanations, provenance, limitations, and timestamp.

**Acceptance:** Card values match their evaluations; self-comparison gives zero differences; unknown values are not zero. Reports preserve classification and never export pending results as final.

### Module G — Life-Support Coupled Site Score

**Priority:** Tier 2, after the environmental core works.

- **FR-G1:** Attach sourced ice evidence with measurement/proxy location, depth/coverage where available, uncertainty, and a defined evidence category: measured, orbital proxy, inherited assumption, or user-adjusted.
- **FR-G2:** Implement a reviewed, documented 730-day, four-crew mass model. Publish equations, units, accounting boundary, parameter sources, and assumptions before treating it as a logistics constraint.
- **FR-G3:** LCSS is the sum of explicitly defined non-overlapping mass contributors. Compare it to an editable budget, initially 18,000 kg.
- **FR-G4:** Once accepted and enabled, logistics participates in the overall verdict. Otherwise label it not evaluated.
- **FR-G5:** Show Earth-supplied water, reactor/equipment, ISRU power system, ECLSS hardware, and spares separately. Define what other required equipment is included or excluded.
- **FR-G6:** Explain logistics failures using kg contributions and the budget deficit. Raw contributor size alone does not prove that contributor is avoidable.
- **FR-G7:** Template a plain-language explanation using the same calculated mass breakdown.
- **FR-G8:** Let users vary assumed ice concentration while preserving the original sourced value and evidence label.
- **FR-G9:** Search for a passing concentration within the supported grid, or report no flip. Do not assume monotonic behavior without testing reactor-count steps and other model effects.
- **FR-G10:** Display evidence categories as provenance labels, not calibrated confidence probabilities.
- **FR-G11:** Show parameter-specific evidence requirements and related primary references, including exact PDF pages and pinned checksums. Distinguish verified transcription from architecture applicability and engineering acceptance.
- **FR-G12:** Retain engineering evidence/gates in JSON and print reports. Matching a reference number must not accept a parameter or automatically change its value. Unreviewed LCSS remains excluded from final verdicts.

**Acceptance:** Unit conversions, mass balance, contributor totals, budget boundaries, reactor-count discontinuities, no-extraction and high/low-yield cases pass. A verified logistics-only failure also passes environmental checks. If those cases cannot be supported, label LCSS in progress and exclude it from final verdicts.

#### Model inputs that must be resolved before implementation acceptance

The source's parameter table is a starting point, not a complete executable model. Resolve:

1. Gross water demand, recovery/loop closure, net makeup demand, initial inventory, and reserves.
2. Ice mass fraction, extractable fraction, recovery efficiency, throughput, and operational duty cycle.
3. Energy per kg processed/extracted and its relationship to reactor count and output.
4. Equipment sizing/mass relationships, solar/storage assumptions, and site energy availability.
5. ECLSS hardware, spares, replacement consumables, double-count prevention, and excluded equipment.
6. Numerical reference outputs or justified analytical checks for the completed screening model.

Source placeholders such as 75% recovery, 2.5 kW per reactor, 20 kg/kW, 8,000 kg hardware, and 10% spares remain labeled assumptions until justified. A simple reactor shell estimate is not automatically complete installed equipment mass.

An LCROSS/Cabeus measurement must not be assigned as a measured concentration at another site. Upper/lower bounds are not point estimates. No site receives a numeric ice value merely to make the demo flip.

### Module H — Epoch-Robustness Envelope

**Priority:** Tier 3, stretch.

- **FR-H1:** Evaluate a declared monthly grid over supported 2027–2033 dates; 84 starts if fully covered.
- **FR-H2:** Show a 7×12 calendar with passing, failing, uncertain, and insufficient-data cells.
- **FR-H3:** Show pass fraction with requested/evaluated/unknown counts and the exact sampling definition.
- **FR-H4:** Any robust/marginal/limited category needs documented thresholds and must say it applies to sampled starts. A monthly grid cannot establish continuous feasible windows or complete seasonal behavior.
- **FR-H5:** Clicking a cell loads the identical scenario and explanation.
- **FR-H6:** Offer a separate ten-minute UTC start scan over currently loaded finite coverage. Require each complete mission to be supported by the provider; never bridge unavailable source windows or fabricate missing records. Preserve partial final-bin weighting and all enabled environmental/outage rules.
- **FR-H7:** Group only consecutive fitting tested starts, label inclusive endpoints and sampling limitations, and retain failed/unknown/excluded counts, requirements, source metadata and grouped ranges in exported evidence. Real nominal fits retain scientific uncertainty.
- **FR-H8:** Re-evaluate a selected sampled boundary before applying it to the active scenario. Invalidate visible/exported studies after incompatible point, requirements or source changes; preserve the other scenario. Report loading and keep the study cache bounded.

**Acceptance:** Cells match direct evaluation under identical settings. Unknown starts are not hidden. Passing fraction is not mission-success probability. Logistics assumptions remain explicit and consistent across epochs.

### Module I — Provenance and reproducibility

- **FR-I1:** Expose ephemeris/orientation inputs, frame/time chain, sampling, horizon/DEM metadata, uncertainty treatment, and Tier 2 ice/model sources.
- **FR-I2:** List approximations, excluded physics, data gaps, and real versus synthetic status.
- **FR-I3:** Hash canonical scientific inputs plus data/model/algorithm versions; include LCSS assumptions when enabled.
- **FR-I4:** Identical versioned inputs yield byte-identical scientific result and attribution. Export generation time is outside the deterministic payload.
- **FR-I5:** A hash establishes identity, not physical correctness. Show synthetic, real-data/unvalidated, and real-data/validated statuses separately.

**Acceptance:** Relevant input/version changes alter identity; repeat runs reproduce; unsupported confidence claims and secrets never enter outputs.

### Module J — Accessibility, education, and demonstration

- **FR-J1:** Technical/plain-language toggle changes presentation, not calculations. Plain view leads with the explanation and keeps advanced controls discoverable.
- **FR-J2:** Keyboard navigation, labels, focus states, text alongside colors, and WCAG AA contrast targets.
- **FR-J3:** Basic demo mode loads verified scenarios and relevant controls. Extended narrated/animated scripting is stretch.
- **FR-J4:** Responsive comparison at 1024px and tablet widths; stacked cards remain usable.

**Acceptance:** Keyboard can complete the primary journey; plots have text/table alternatives; demo can finish in 90 seconds without fabricated values.

## 7. Experience and screens

1. **Header:** Product identity, result classification, view toggle, demo, provenance.
2. **Scenario Builder:** A/B sites and landing dates, duration, shared requirements, coverage messages.
3. **Comparison:** Verdict cards, environmental metrics, optional accepted logistics metric, failed rules.
4. **Scenario Surgery:** Controls, baseline changes, sampled flip banner, snap action.
5. **Deep Dive:** Horizon, Explanation, Logistics, optional Robustness, and Provenance tabs.

**User flow:** Configure → Compare → Understand failure → Test change → Inspect evidence → Optionally inspect logistics/robustness → Export if implemented.

## 8. Technical plan

| Layer | Planned implementation |
| --- | --- |
| Frontend | React + Vite, responsive static application |
| Scientific preprocessing | Python with a verified geometry engine and pinned compatible JPL/lunar-frame inputs |
| Terrain | Versioned LOLA-derived DEMs and precomputed horizons |
| Evaluation | Shared deterministic rules and templates; parity fixtures across runtimes |
| Data delivery | Static JSON bundle and provenance manifest |
| LCSS | Reviewed parameterized mass model and versioned result table |
| Hosting | Static build; provider verified during packaging |

**Pipeline:** Sourced assets → frame/time normalization → site horizons/geometry → validated series bundle → verdict/explanation → comparison/surgery → optional logistics/calendar.

Precompute expensive geometry and terrain work. Re-evaluate inexpensive thresholds against stored data or use validated table lookups. Do not precompute a full date × duration × threshold × concentration product without checking bundle size and regeneration cost.

Charts must use the same series as verdicts. Custom coordinates on a static site need actual precomputed coverage or a preprocessing step; dynamic arbitrary-site analysis requires additional architecture.

## 9. Non-functional targets

| Area | Target / check |
| --- | --- |
| Initial comparison | Under 5 seconds on the recorded reference laptop/browser |
| Cached verdict | Under 2 seconds per scenario |
| Settled edit | Updated cached verdict/explanation within 1 second |
| LCSS | Under 200 ms lookup/evaluation after accepted model/data are loaded |
| Determinism | Identical versioned inputs reproduce identical scientific payloads |
| Robustness | Invalid inputs and missing assets produce useful states, not invented values |
| Portability | Static bundle, no required login or CopperOS service |
| Offline resilience | Retained local assets remain usable where supported; cold-start offline is not promised without caching implementation |
| Transparency | No opaque ML in verdicts, explanations, or LCSS |

Record device, browser, dataset size, cache state, and measurements. Targets are not current results.

## 10. Verification and release gates

### Tier 1 gate

- [x] Supported catalog, dates, frames, observer definition, and source usage conditions recorded.
- [ ] Numeric geometry and horizon reference cases pass approved tolerances.
- [ ] Environmental rule/interval fixtures and browser/reference parity pass.
- [x] A real environmental failure, re-evaluated sampled nominal fit and no-flip case pass software checks; nominal fits retain uncertainty qualifications.
- [x] Explanations match actual failed rules and measured deficits; independently specified interval-ranking fixtures pass.
- [x] Coverage gaps, invalid inputs, and unknowns handled explicitly with load-before-apply preservation.
- [ ] Provenance, deterministic identity, accessibility, and performance checked.
- [ ] A/B comparison and basic demo work from the retained data bundle.
- [x] EXT-01 slope/footprint/RMS-context output is implemented at a declared scale, with unavailable data and unresolved uncertainty explicit; no unassessed terrain is labeled passed.
- [x] EXT-02 longest-gap and interval outputs are implemented and checked against boundary/missing-data fixtures.

### Tier 2 gate

- [ ] LCSS equations, assumptions, units, and accounting boundary reviewed.
- [x] Ice values retain explicit hypothetical labels and separate source observations; no site-applicable concentration is claimed.
- [x] Mass balance, contributor sum, independent analytical fixtures and budget boundaries pass for the exploratory model; architecture calibration remains open.
- [ ] Verified logistics-only failure and supported flip, or no-flip outcome.
- [x] The selected short environmental interval and two-year logistics horizon remain clearly separate.
- [x] Primary-reference transcription, per-parameter evidence requirements and open engineering gates are visible and exported; no parameter is automatically accepted.

### Tier 3 gate

- [ ] Core and logistics acceptance are stable before stretch work.
- [x] Bounded daily and 84-start monthly calendar cells reproduce direct evaluation and disclose their sample limitations.
- [ ] Optional reports, deltas, or animation preserve source results and classification.

## 11. Exclusions and unresolved decisions

Exclude full descent/vehicle dynamics, rover traverses, relay/DSN link budgets, complete ECLSS reliability simulation, dollar costs, multi-user cloud features, sub-meter landing certification, 3D rendering, and LLM-generated verdicts/explanations.

Before implementation acceptance, resolve exact curated coordinates/terrain products, real date coverage, numerical tolerances/reference reviewer, complete LCSS equations and water evidence, bundle-size limits, and submission details.

The source's named sites, dates, 41-hour blockage, approximately 14-day flip, and concentration examples are **unverified proposed fixtures**. Replace them with computed, checked cases before a demonstration.

## 12. Implementation status

- [x] Latest supplied PRD captured and consolidated.
- [x] Feature tiers, defaults, dependencies, and acceptance criteria documented.
- [x] Ordered implementation plan linked.
- [x] Official source register and real-versus-synthetic policy documented.
- [x] Terrain/environment additions accepted into the feature register and staged implementation backlog.
- [ ] EXT-01 terrain screening implemented and accepted.
- [ ] EXT-02 continuous visibility-gap screening implemented and accepted.
- [x] Six study-point terrain/uncertainty sets and compatible geometry sources downloaded, pinned and checksum-checked; absolute scientific acceptance remains separate.
- [x] Initial three PGDA study tiles and compatible DE421 sources acquired and checksum-verified; full catalog acceptance remains separate.
- [x] Bounded local DEM horizon/footprint pipeline connected to comparison and gap screening, with uncertainty qualifications.
- [x] Analytic preprocessing fixtures and external geometric-vector cross-checks implemented.
- [x] Local compute benchmarks measured; browser performance remains unverified.
- [ ] Real scientific inputs and reference tolerances accepted.
- [ ] Tier 1 implemented and verified.
- [ ] Tier 2 LCSS model implemented and verified.
- [ ] Optional Tier 3 delivered and verified.
- [ ] Static build, deployment, and submission demonstration verified.

**Next priorities:** Map an architecture-specific LCSS water/equipment/energy model to applicable engineering evidence, resolve global horizon completeness and correlated uncertainty with independent scientific review, and complete rendered browser/GPU/accessibility and submission review when the required access/evidence is available. See [engineering calibration](docs/ENGINEERING_CALIBRATION.md) and [current status](docs/CURRENT_STATUS.md). Numerical dust/plume/dose/rescue models retain their research gates.

**Workspace implementation update (v3.4):** The new [reference-style workspace](lunar-workspace.html) and Vite entry now implement site/UTC setup, two-scenario comparison, continuous-gap rules, shared-record horizon/skyplot views, time-to-set brackets, date preview/search, a bounded daily calendar, reports, and explicit pending-model states. A January 2027 JPL Horizons dataset is acquired for six user-supplied regional reference coordinates. The terrain footprint remains a synthetic demonstration. These increments do not check the scientific acceptance boxes above; see Section 15 and [NASA coverage review](docs/NASA_CHALLENGE_COVERAGE.md).

## 13. Real-data sourcing and collection requirements

**Source pages checked:** 14 November 2026. Checking a portal establishes a collection route; it does not mean its scientific assets have been downloaded or validated in this project. Implementation will acquire and pin the selected files rather than wait for an assumed event data package. Recheck the registered challenge's actual Resources page when available.

### 13.1 Real data versus development samples

| Data | Required for the scientific demonstration | Development/test allowance |
| --- | --- | --- |
| Sun/Earth geometry | Derive positions from pinned real JPL ephemeris and compatible lunar orientation inputs | Synthetic series for deterministic unit/UI tests, visibly classified |
| Terrain and horizon | Use real DEMs covering each actual site and the surrounding horizon search area | Synthetic ridges/flat horizons for controlled reference fixtures only |
| Site coordinates | Sourced exact points, or clearly identified analyst-selected points derived from documented GIS products | Imaginary training sites must not appear as real candidate recommendations |
| Ice concentration | Site-applicable published measurement/proxy/bound, or an explicitly assumed sensitivity input | Hypothetical values allowed in LCSS exploration; never relabeled as measured |
| LCSS engineering parameters | Published relationships where available and explicitly documented assumptions elsewhere | No invented calibration or unsupported mass estimate presented as validated |

Synthetic data must not silently replace a missing real asset. Precomputed or cached values derived from real inputs remain real-data-derived; caching does not turn them into mock data, and real inputs alone do not establish validation.

### 13.2 Source register

| Source ID | Need | Official/primary source and collection route | What to retain |
| --- | --- | --- | --- |
| DS-01 | Planetary/lunar ephemeris | [JPL ephemeris download guidance](https://ssd.jpl.nasa.gov/ephem.html) and [NAIF planetary SPK directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/) | Selected DE421/DE440-family file, exact name, coverage, checksum, documentation |
| DS-02 | Lunar frame, orientation, and time inputs | [NAIF generic kernels](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) and [lunar frame files](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/) | Compatible frame/orientation/constants/time files and transformation recipe |
| DS-03 | High-resolution polar terrain | [NASA PGDA Product 78](https://pgda.gsfc.nasa.gov/products/78) | Selected elevation GeoTIFF, README, coverage/ROI, and uncertainty products if used |
| DS-04 | Terrain archive and broader coverage | [PDS LOLA archive and LOLA Data Node links](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) | Exact product/label and metadata; additional or coarser coverage where justified |
| DS-05 | Geometry cross-check | [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) | Saved observer/query settings, site/frame, corrections, timestamps, and response |
| DS-06 | LCROSS evidence | [PDS LCROSS archive](https://pds-geosciences.wustl.edu/missions/lcross/default.htm) and [NASA LCROSS results reference](https://ntrs.nasa.gov/api/citations/20160011273/downloads/20160011273.pdf) | Exact reference location, reported quantity/uncertainty, citation, and applicability |
| DS-07 | Orbital hydrogen evidence | [PDS LRO LEND archive](https://pds-geosciences.wustl.edu/missions/lro/lend.htm) | Product footprint/depth interpretation, units, uncertainty, and cited conversion method if used |
| DS-08 | Published Artemis water bound | [NASA SMD-LUN-102 Revision A, page 15](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf?attachment=true) | Bound type, applicable regions/context, assumptions, and publication/version |
| DS-09 | Context and reference-site research | [Moon Trek](https://trek.nasa.gov/moon/), [LROC QuickMap](https://quickmap.lroc.asu.edu/), and [PDS Apollo documentation](https://pds-geosciences.wustl.edu/missions/apollo/index.htm) | Underlying product or coordinate citation; a screenshot or viewer URL alone is not the scientific asset |

Skyfield is a proposed processing library, not a data source. Its [planetary-frame documentation](https://rhodesmill.org/skyfield/planetary.html) provides a lunar observer example using an ephemeris plus additional frame/constants/orientation files. Verify library support and input compatibility before choosing the recipe. Other helpers, including Lunar Toolkit or JavaScript libraries mentioned in the notes, are optional and need separate capability/source verification before adoption.

### 13.3 Initial terrain-product candidates

PGDA lists the following useful region/product associations: Connecting Ridge — Site01; Shackleton Rim — Site04; Nobile Rim 1 — Site06; de Gerlache Rim — Site11; Malapert Massif — Site23. These are terrain-region references, not exact approved touchdown coordinates. Select each assessment point within documented coverage. [NASA PGDA product description](https://pgda.gsfc.nasa.gov/products/78)

That product describes 5 m/pixel GeoTIFFs in a DE421 mean-Earth lunar frame. Preserve its frame/height metadata, interpolation limits, and uncertainty; pixel spacing is not demonstrated landing accuracy. A DE440 calculation must not silently treat a DE421-based terrain frame as identical. Use a compatible recipe or a documented tested transformation. [NASA PGDA metadata](https://pgda.gsfc.nasa.gov/products/78)

Start with three covered points, then expand toward the six-entry catalog. Obtain separate source coordinates and terrain coverage for an Apollo/CLPS reference; never borrow a polar horizon for it.

### 13.4 Water-ice evidence rules

- The reported LCROSS concentration of **5.6 ± 2.9 wt%** pertains to the impact sampling at Cabeus. Store it as a location-specific literature anchor, not a default measurement for all Cabeus-adjacent or Artemis sites. [NASA LCROSS results](https://ntrs.nasa.gov/api/citations/20160011273/downloads/20160011273.pdf)
- NASA SMD-LUN-102 Rev A discusses **no more than 2.0% water by mass as an upper-limit assumption** for the candidate regions in that document. It is not an exact measured value for each curated site. Retain that context and bound semantics. [NASA report, page 15](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf?attachment=true)
- LEND supplies neutron data. Any hydrogen/WEH-to-extractable-water interpretation requires its own cited method and spatial applicability. Do not equate orbital proxy units with local recoverable ice. [PDS LEND documentation](https://pds-geosciences.wustl.edu/missions/lro/lend.htm)
- Do not adopt a universal PSR lower bound or a numeric default for an unmeasured point from the pasted notes. Keep it unknown or explicitly hypothetical until a relevant reference supports it.
- Preserve evidence value/bounds separately from user-adjusted assumptions. The UI must identify which value actually entered LCSS.

### 13.5 Data acceptance requirements

- **DATA-REQ-01:** Every acquired asset has provider/product ID, source URL, retrieval UTC, local path, version/release, file size, and SHA-256. Compare provider checksums where supplied.
- **DATA-REQ-02:** Record units, frame/projection, height reference, spatial/temporal coverage, no-data handling, resolution, and uncertainty information as applicable.
- **DATA-REQ-03:** Cover the full selected mission interval plus date-sweep margins and the terrain extent needed for horizon calculations. A tile containing the point may still be too small for the horizon.
- **DATA-REQ-04:** Record geometry correction choices and configure reference comparisons consistently. Archive reference outputs; do not rely on a changing live service during the demo.
- **DATA-REQ-05:** Keep raw source assets separate from derived horizons/series and small test fixtures. Derived records identify source checksums, recipe/code version, and processing settings.
- **DATA-REQ-06:** Track each item as identified, downloaded, integrity-checked, processed, or numerically validated. A source-page check cannot complete later states.
- **DATA-REQ-07:** On missing spatial coverage, obtain valid additional/coarser terrain and disclose its limits, or mark the location unsupported. Never substitute the nearest unrelated site's data.
- **DATA-REQ-08:** Keep source usage/attribution conditions and regenerate only affected bundles after input/version changes. Documentation records sources now; actual downloads and scientific validation remain implementation tasks.

## 14. Staged terrain and environmental extensions

The [feature/data roadmap](docs/FEATURE_DATA_ROADMAP.md) evaluates the latest supplied research notes. The following additions are approved as a staged plan: EXT-01/02 are next required screening capabilities, EXT-03 is conditional on data readiness, EXT-04 is an optional follow-on, and EXT-05 through EXT-08 are research/model-definition work. Approval includes the backlog and its gates; it does not establish that every topic is implemented or mandatory for the hackathon. Core exclusions remain in force for full vehicle, RF, radiation-dose, plume, and rescue simulation.

| ID | Approved addition | Stage | Required output and acceptance boundary |
| --- | --- | --- | --- |
| EXT-01 | Terrain screening | Required next addition with real DEM ingestion | Local slope at a defined scale, optional defined roughness, assessment footprint/coverage, and uncertainty; no universal safe-angle or unresolved-rock claim |
| EXT-02 | Continuous darkness/Earth gaps | Required alongside core visibility | Timestamped contiguous intervals and longest gaps; compare with explicit user requirements, not an automatic relay-mass penalty |
| EXT-03 | Surface-temperature context | Conditional next layer | Selected Diviner product with units, resolution, period/local-time meaning, and gaps; not hardware survival or radiator performance |
| EXT-04 | Terrain connectivity | Optional later demonstration | Declared slope-filtered connectivity/path; vehicle/energy-aware safe-return claims remain excluded until supported |
| EXT-05 | Dust/thermal sensitivity | Optical exploration implemented; engineering model remains gated | Declared radiator/coverage/load/view-factor assumptions, laboratory simulant endmembers, clean/dusty equilibrium temperature and signed heat margins. No layer-conduction, survival or mass-penalty claim |
| EXT-06 | Plume/ejecta | Post-acceleration ballistics implemented; engineering gate remains | Conditional single-grain ideal-sphere trajectories and hypothetical asset envelopes; engine/soil/erosion, actual terrain, damage and safe distances remain unassessed |
| EXT-07 | Radiation context and primary protons | Orbital observations / CSDA exploration implemented; full dose model open | Historical silicon detector rates, separate NIST proton range/residual-energy and mass comparison; no terrain-to-dose multiplier or human/surface protection claim |
| EXT-08 | Contingency reachability | Conditional timing implemented; operational model remains gated | Scenario-scoped hypothetical assets, availability, sampled-route response/return time and declared time limits; otherwise not evaluated. Energy, communication, medical and actual vehicle feasibility remain unassessed |

### 14.1 Extension source routes

Reuse DS-01 through DS-05 for real geometry, terrain, and reference checks. Additional routes are:

| Source ID | Route | Use and limitation |
| --- | --- | --- |
| DS-10 | [PDS Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm) | Surface-temperature observations/derived products; select and inspect temporal/spatial applicability |
| DS-11 | [LROC product selector](https://data.lroc.im-ldi.com/lroc/rdr_product_select) and [PDS archive](https://pds.lroc.im-ldi.com/data) | Image/DTM selection; footprint, lighting, scale, and detection limits must be checked |
| DS-12 | [PDS PPI CRaTER](https://pds-ppi.igpp.ucla.edu/data/lro-crater/) | Radiation observations and metadata; a separate model is needed for surface/shelter dose |
| DS-13 | [NASA dust/thermal study](https://ntrs.nasa.gov/citations/20240009989) | Published reference/model development, not a regional radiator-efficiency map |
| DS-14 | [NASA PSI project](https://www.nasa.gov/directorates/stmd/plume-surface-interaction-psi/) | Model/test research route; not an arbitrary-site ejecta probability dataset |
| DS-15 | [NASA rover mobility guidance](https://ntrs.nasa.gov/api/citations/20250003470/downloads/Mobility%20Test%20Best%20Practices%20-%20STRIVES%20April2025.pdf) | Vehicle-assumption and test reference; not a universal slope/endurance limit |

### 14.2 Additional acceptance rules

- Terrain and environmental states remain separate in the UI/report. Passing light/visibility requirements does not imply the touchdown footprint was assessed.
- Slope/roughness outputs include their method/window, units, resolution, and footprint. Missing footprint coverage prevents an unqualified pass.
- Temperature products preserve observed versus modeled/aggregate meaning. Historical observations are not automatic forecasts for a selected future mission time.
- Add an extension to a verdict only after the enabled check has sufficient data, declared thresholds, and accepted reference tests.
- Unsupported physics or absent operational assets stay not evaluated. Simple heuristic scores must not be presented as crew/vehicle safety predictions.
- No numerical checks or data downloads are completed by adding these source routes to the documents.

### 14.3 Requirements for the next screening increment

- **FR-EXT-01.1:** Let the user select or inspect an explicit terrain assessment area/footprint and published measurement scale. Store slope units, method, and DEM/product versions.
- **FR-EXT-01.2:** Report representative and maximum slope over the assessed area, documenting the statistic and any filtering. Compare to an explicitly supplied screening limit; do not invent a universal spacecraft limit.
- **FR-EXT-01.3:** Report coverage fraction, no-data cells, resolution, and available uncertainty. Derive roughness only with a published window/detrending definition and supported resolution.
- **FR-EXT-01.4:** Show rocks/boulders as not evaluated unless suitable imagery and a documented method establish detection limits. A DEM's absence of visible hazards is not proof of an obstacle-free footprint.
- **FR-EXT-01.5:** Verify the method using known planes/terrain cases, scale changes, edges, and missing inputs. Link every displayed statistic to the assessed area.
- **FR-EXT-02.1:** Calculate all contiguous solar-ineligible and geometric Earth-invisible intervals from the same series used for the environmental verdict.
- **FR-EXT-02.2:** Report start/end UTC, durations, longest gap, and whether an interval is truncated by the assessment boundaries or missing data.
- **FR-EXT-02.3:** Accept optional user-defined maximum darkness/outage requirements. Show violations as rule-specific findings without inferring battery endurance, RF performance, relay necessity, or relay mass.
- **FR-EXT-02.4:** Verify no-gap, interior-gap, boundary-gap, exact-threshold, and missing-series cases. Unknown spans cannot be reported as known available time.

## 15. Reference design implementation and challenge coverage

The supplied [workspace design](docs/reference/user-workspace-design.html) is retained unchanged as a design reference. Its compact editor layout, outliner, viewport, comparison strip, inspector, and timeline inform the new implementation. Its example temperature, terrain, ice, and “reviewed dummy” logistics values are not accepted evidence and are not carried into scientific results.

The [supplied challenge text](docs/reference/nasa-challenge-2026.txt) was cross-checked against the [official 2026 Lunar Landing Site Navigator challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/). The core goal is rapid site/date comparison with Sun/Earth positions relative to the horizon for power-potential and communication-window assessment. The objective list uses suggestions; optional topography and modeling considerations are recorded as such. The implementation and remaining evidence are mapped in [NASA_CHALLENGE_COVERAGE.md](docs/NASA_CHALLENGE_COVERAGE.md) and the app's Evidence screen. This is a coverage assessment, not NASA approval or a guarantee of judging eligibility.

- **Workspace entry:** `src/workspace/main.mjs`, built by Vite; standalone output `lunar-workspace.html`.
- **Reference geometry:** Sun/Earth airless apparent azimuth/elevation, 2027-01-01 through 2027-02-01 at ten-minute intervals, for six regional reference points. Source responses report DE441 and high-precision MEAN_ME orientation. Raw responses, request URLs, API signature, and SHA-256 checksums are pinned in `data/horizons/`.
- **Frame and method limit:** Horizons apparent observer angles include light-time/aberration and are not the uncorrected geometric states specified in FR-B1/B2. This reference-data mode is an explicit interim implementation; the final geometric recipe, independent reference tolerances, and real DEM horizon remain required for scientific acceptance.
- **Horizon separation:** JPL mode uses a declared 0° tangent reference, without interpreting absent DEM as measured flat terrain. Sample mode uses a separately labeled synthetic horizon. Unsupported custom points and incomplete intervals return insufficient data.
- **Catalog status:** Names and approximate coordinates come from the user's design. They are regional reference points, not independently verified mission targets or accepted DEM sample locations. Their zero-kilometer reference altitude is not a measured surface height.
- **Extensions:** Computed synthetic footprint and source-backed/sample gap calculations are implemented; temperature, LCSS, paths, dust, plume, radiation, and contingency numerical predictions retain their existing gates. The bounded daily calendar does not complete the multi-year robustness envelope.
- **Verification boundary:** Automated evaluator, source-integrity, state, and DOM startup tests plus a production build are implemented. Browser/GPU rendering, user studies, independent scientific validation, deployment, and submission remain unverified.

**Remaining stages:** EXT-03 through EXT-08 use the acceptance boundaries and real-data/model gates in the linked roadmap. Add a numerical model to the verdict only after its gate passes; otherwise preserve a visible not-evaluated state.

## 16. Real-data increment v3.5

The default workspace now uses real NASA PGDA 5 m terrain at three **data-derived study points**, with coordinates taken from the center pixel of Sites 04, 01, and 11. These are reproducible points in published study regions, not attributed mission landing coordinates. Surface height and observer height are separate; the initial observer is 2 m above the DEM surface. The source polar-stereographic grid and 1737.4 km reference sphere are retained in the MOON_ME realization of DE421.

The geometric recipe now uses matched DE421 planetary SPK, lunar binary PCK, frame kernel, and leap-second kernel. UTC is converted to ET/TDB; geometric `NONE` Sun/Earth center vectors are transformed to MOON_ME and projected from the elevated observer into local east/north/radial-up. The packaged series covers 2027-01-01 through 2027-04-01 at ten-minute intervals. Reference-mode apparent Horizons data and synthetic sample data remain separate modes.

The initial **local** terrain horizon uses 360 azimuth bins, 5 m radial spacing, spherical curvature, bilinear terrain sampling, and a 7 km ray extent. Missing rays do not become flat terrain. Terrain beyond that extent and correlated uncertainty propagation remain unassessed. A nominal fit is therefore **UNCERTAIN**, not an unqualified PASS. Search results preserve this qualification.

EXT-01 now computes nominal slope at the declared measurement baseline, detrended footprint roughness, finite-grid coverage, area meeting the selected slope limit, and published height/source-slope RMS context. Finite DEM coverage includes interpolated surface pixels; it is not laser-return coverage. Source slope RMS is not relabeled as propagated uncertainty for a different chosen baseline. No unresolved rock or vehicle safety claim is added. EXT-02 uses the same real geometry/horizon records for durations, gaps, and optional outage requirements.

Analytic axes, pixel-center/no-data tests, smooth-sphere horizon dip, source checksums, projection round trips, a second SPICE transform path, and external Horizons DE441 inertial-vector cross-checks are implemented. The external check does not independently certify lunar orientation or terrain horizons. Full scientific acceptance remains open.

Bounded provider/result/footprint caches reduce repeat work. [Recorded Node benchmarks](docs/performance/latest.json) identify the machine, dataset, cache state, and timings. Browser load, rendering, and user-perceived latency are not inferred from these compute-only measurements. The standalone HTML is approximately 8.5 MB; asset size and browser timing must be included in later release checks.

Next order: validate far-field horizon/uncertainty and independent orientation cases; inspect a suitable Diviner product; then accept the LCSS model before numerical logistics. The catalog/date expansion in v3.6 is recorded below. Connectivity remains optional; dust, plume, radiation-dose, and contingency models retain their research gates.

## 17. Coverage-safe real-data workflow v3.6

The real catalog now contains six source-derived PGDA study points: Sites 04, 01, 11, 06, 07, and 23. Approximate reference-only points are no longer offered as compatible real-DEM choices. Each data mode preserves a separate valid scenario history. Custom scientific points require their own preparation and are blocked before changing an existing covered scenario.

The packaged geometric data remains January–March 2027. In the local application, an optional scientific service generates missing real DE421/MOON_ME records for supported study points throughout 2027–2033. It uses pinned kernels and exact source coordinates; it does not extrapolate percentages or fall back to sample geometry. New records carry date/source/algorithm identity and retain the existing terrain-model qualifications.

Scenario changes are transactional: fetch and validate missing complete-interval records before committing the proposed date/site/duration. Show a loading state while retaining the previous covered result. On failure, preserve the old scenario and provide the actual failure message. Direct-file/static use restricts date ranges and disables unsupported calendar selections; a valid UI interaction must not create an empty missing-data card.

The lower-level insufficient-data state is retained for genuinely missing scientific inputs. This corrects unsupported selection paths rather than relabeling unknown results. The initial sourced Shackleton/Nobile comparison uses actual computed defaults; no data values or requirements are altered to force a favorable outcome. See [DATA_COVERAGE_FIX.md](docs/DATA_COVERAGE_FIX.md) for source coordinates, service contracts, cache behavior, and regression evidence.

## 18. Implemented increment 3 — v3.7

This section supersedes the local-only horizon and pending diagnostic/temperature statements in earlier implementation snapshots. See [increment 3 evidence and remaining order](docs/SCIENCE_INCREMENT_3.md).

- **B / EXT-01:** Six study points combine PGDA 5 m terrain to 7 km with the compatible MOON_ME/DE421 80 m polar DEM from 7 to 125 km. All retained rays have finite samples. The wider terrain raises 644 of 2,160 azimuth sectors. Terrain beyond 125 km and unresolved peaks remain unassessed.
- **Uncertainty context:** Componentwise ±1 interpolated source height RMS plus opposite observer-height perturbations now generate horizon and Sun/Earth/overlap sensitivity scenarios. They are not statistical confidence bounds and do not complete correlated uncertainty propagation. Nominal fits remain UNCERTAIN.
- **B / I validation:** 18 independent Horizons apparent AZ/EL cases at Shackleton, de Gerlache, and Nobile pass a predeclared 0.01° tolerance; maximum discrepancy is 0.0000085066°. The validation recipe includes apparent corrections; production geometry continues to use NONE. Terrain, all-date orientation, and broader scientific acceptance remain separate.
- **D:** Ranked contiguous interruption intervals use solar weight 1.0 and Earth weight 0.6, duration × active weights, UTC boundaries, failed-rule values/shortfalls, sampled azimuth spans, and plain/technical wording. Terrain blockage and nested elevation-criterion loss are exclusive solar causes. Passing rules and unknown records do not receive failure attribution.
- **EXT-03:** Two pinned Diviner PCP southern-summer bins (00:00–00:15 and 12:00–12:15 local time) provide historical average bolometric brightness-temperature context near the six real points. Product period is 2009–2019, grid spacing 240 m, and units Kelvin. Eight matching source bins and four explicit gaps are retained. These observations are not mission UTC forecasts or daily extremes and do not alter environmental verdicts.
- **F / I:** Reports preserve structured diagnostics, source checksums, sampling bands, perturbation interpretation, independent angle cases, and site-scoped thermal evidence. Synthetic/reference modes do not inherit real observations.

**Still required:** terrain/convergence/global-horizon and correlated-uncertainty acceptance; independently accepted LCSS engineering calibration and applicable ice evidence; browser/GPU/user and release checks. Custom-coordinate preparation inside covered DEM interiors is implemented. Connectivity, multi-year robustness, and dust/plume/radiation/rescue numerical models retain their optional or research status.

## 19. LCSS assumption explorer — v3.9

The [defined water-logistics model](docs/LCSS_MODEL.md) now implements four crew over 730 days, explicit demand/recovery/reserves, yield and throughput/power constraints, discrete installed units, independently assumed storage, non-overlapping mass contributors, shared budget, independent A/B hypothetical ice inputs, plain explanations and a 61-point concentration search. Analytical water/mass/capacity fixtures and UI interactions are verified. JSON/canonical identity includes the settings, results and evidence categories.

This numerical feature is opt-in **exploration under declared planning assumptions**. It is not an accepted logistics constraint: `acceptedForVerdict` remains false and accepted logistics status remains not evaluated. The implementation completes the mathematical/accounting specification for this screening version; hardware sizing, energy coefficients, two-year operations and local resource evidence still require engineering review. LCROSS Cabeus evidence remains separate from user-adjusted site assumptions. No remote measurement is automatically assigned to a study point.

## 20. Dust/radiator optical exploration — v4.5

- **FR-EXT-05.1:** Configure independent A/B coating, assumed dust area coverage, device area/internal heat, incident shortwave flux, radiative sky/ground boundaries and a user temperature limit. Start disabled.
- **FR-EXT-05.2:** Offer verified laboratory optical endmembers and explicit custom assumptions, retaining particle-size fraction, 300 K emittance reference, PDF page/source hashes and separate evidence labels. Do not transfer them into a selected-site material measurement.
- **FR-EXT-05.3:** Compare clean/dusty steady-state temperatures, signed capacity/margins at the chosen limit and a bounded coverage curve from the same declared energy balance. Preserve negative capacity and possible cooling; no universal penalty.
- **FR-EXT-05.4:** Display the nonconservative rule-of-mixtures limitation and unassessed coating response, dust-layer/grain conduction, transients, aging and hardware-survival conditions. Keep terrain solid angle and Diviner observations separate from assumed radiative view factors/sinks.
- **FR-EXT-05.5:** Preserve settings, optical properties, heat terms/residuals, constants, source identities and limitations in JSON/print and canonical hashing. Keep `acceptedForVerdict: false`.

**Implementation verification:** 143 application checks pass, including seven dust data/numerical/state cases and a bundled interaction case. Three source rows/six optical values are transcription-verified; both builds pass. These checks validate the declared optical calculator and provenance, not an accepted hardware response. [Model specification](docs/DUST_THERMAL_MODEL.md) records equations, exact analytical fixtures, defaults and remaining engineering gates.

## 21. Conditional post-acceleration ejecta — v4.6

- **FR-EXT-06.1:** Start disabled; configure independent A/B assumed release speed/elevation/bearing/height and grain diameter/density. Do not derive these from an unaccepted thrust/nozzle/descent/soil model.
- **FR-EXT-06.2:** Use documented ideal spherical central-gravity ballistics within the explicit 1–500 m/s and 0.1–80° numerical domain. Reject unsupported values; show range/time/peak/landing speed and labeled trajectory/layout graphics. Faster/escape trajectories remain unassessed.
- **FR-EXT-06.3:** Add/edit/remove at most five hypothetical circular-footprint/radial-height asset envelopes. Distinguish excluded, footprint miss, outside flown segment, above-envelope and first geometric-entry cases. Report entry time/height/speed and single-grain kinetic energy; never classify asset safety or damage probability.
- **FR-EXT-06.4:** Retain source hashes/constant identity, illustrative site/start, assumptions, trajectory samples, asset geometry and limitations in JSON/print/canonical hashing. Keep terrain application and accepted mission participation disabled.
- **FR-EXT-06.5:** Preserve environmental/historical thermal results and independent A/B ownership. Disable release/asset inputs and add/remove actions during scientific preparation; reject invalid edits transactionally.

**Implementation verification:** 151 application checks pass, including seven dedicated ejecta cases and the bundled asset/release flow. Closed-form range and six independent Cartesian integration cases verify the declared ideal physics; three source hashes/two JPL constants are checked. Both builds pass. [Methods and remaining engineering requirements](docs/PLUME_EJECTA_MODEL.md) distinguish numerical agreement from physical plume/asset acceptance.

## 22. Orbital radiation context and primary protons — v4.7

- **FR-EXT-07.1:** Show explicitly historical CRaTER silicon absorbed-dose rates by archive month/detector, preserving source lunar-shadow-correction choice, daily coverage, flagged/missing data and null uncertainty. Do not map orbital detector values to a selected surface point or future mission date.
- **FR-EXT-07.2:** Provide a separately labeled monoenergetic, normal-incidence proton/slab CSDA comparison with checked NIST material, energy, range and density units. Offer exact tabulated incident energies within 1–1000 MeV and reject unsupported settings.
- **FR-EXT-07.3:** Report residual primary-energy estimate/bracket and interpolation provenance, or exact CSDA exhaustion/below-table status without extrapolation. Preserve density-based thickness and mass-per-area conversion; do not interpret residual energy as dose-reduction percentage.
- **FR-EXT-07.4:** Keep archived mGy in silicon, proton MeV and human Sv distinct. Do not use sky solid-angle obstruction as a dose multiplier, infer zero total dose from exhausted primary range, or apply unverified clinical/operational exposure limits.
- **FR-EXT-07.5:** Maintain independent A/B settings, transactional invalid-input handling, preparation loading guards, JSON/print evidence and canonical identity. Keep surface/effective dose and secondary transport `not_evaluated`, `terrainApplied: false`, and `acceptedForVerdict: false`.

**Implementation verification:** 159 application checks and eight Python scientific/ingestion fixtures pass. Preparation verifies nine source assets, 1285 historical days, three material identities/densities and 396 NIST rows. Tests distinguish actual zero from flags, exact range exhaustion from unassessed secondary dose, range from projected range, and source observations from site/date assumptions. Production/offline builds pass. [Radiation model/source decision](docs/RADIATION_MODEL.md) records the full transport/dose gate and deferred ambiguous-unit/corrigendum candidate tables.


## 23. Moonquake and ground stability context - v4.10

- **FR-SEIS-01:** Map retained source coordinates for polar scarp reference points, shallow-event nominal/alternate locations, artificial impacts and historical stations with declared projections and off-region/missing handling. Preserve source uncertainty and original magnitude definition.
- **FR-SEIS-02:** Compare A/B great-circle proximity to retained reference coordinates and the existing real terrain footprint. Keep physical fault distance, shaking, probability and operational safety unquantified.
- **FR-SEIS-03:** Replay two original LPZ records with lazy acquisition from the prepared bundle, peak-preserving window display, declared window normalization, visual play/pause/seek, reduced-motion behavior and every-sample CSV with full-record normalization. Do not infer event duration or apply an unverified physical calibration.
- **FR-SEIS-04:** Preserve record/source search and inspectors, historical/missing/alternate data, source provenance, JSON/print and canonical hashing. Historical seismic context remains separate from exploratory research inclusion and mission verdicts.
- **FR-SEIS-05:** Operate without WebGL, handle failed waveform requests explicitly, preserve both scenarios and mission clock, and support tested mobile through large-screen layouts.
- **Future research gate:** Applicable local soil strength, validated ground-motion/rupture and structural models, measured applicability and uncertainty, then independent physical/scientific acceptance. No slope-failure or equipment-survival verdict is enabled by this delivery.
