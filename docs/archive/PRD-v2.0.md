# SiteLight AI — Lunar Landing Site Navigator

**Product Requirements Document · version 2.0 · 13 November 2026**  
**Status:** Current implementation specification; application implementation remains pending.  
**Intended event:** NASA Space Apps 2026, Lunar Landing Site Navigator, as identified in the supplied brief. Event rules and judging claims have not been independently verified here.

## 1. Authority and scope change

This PRD replaces the [earlier PRD](docs/archive/PRD-v1.0.md) for future development. It incorporates the supplied hackathon requirements and the proposed **Epoch-Robustness Envelope with Uncertainty Attribution**.

The [original supplied text](docs/reference/user-supplied-hackathon-prd.txt) is preserved for reference. It includes conversational research notes and unsupported competitive claims; those notes are background, not executable requirements. This document defines implementation behavior. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) defines the ordered backlog.

**Approved direction:** A focused comparison and explanation tool built around the **Binding Constraint Explainer**, **Scenario Surgery**, and a subsequent **Multi-Year Robustness Envelope**.

**Changes from v1:** 3D exploration is removed from hackathon scope; CopperOS and the earlier Evidence Coverage experiment are deferred; the default delivery is a static app using precomputed scientific bundles.

**Current code:** The existing FastAPI/CopperOS integration and dark dashboard use synthetic data. They do not satisfy the scientific acceptance gates below. Existing runtime files remain unchanged by this documentation update.

## 2. Problem and intended outcome

When a lunar surface date, location, or requirement changes, users need to compare alternatives, identify which evaluated requirement fails, quantify the shortfall, and investigate a supported adjustment.

SiteLight should answer:

1. Does this site and landing time meet the selected environmental requirements?
2. Which requirement fails, by how much, and during which intervals?
3. Which tested date or threshold change makes all requirements pass?
4. Across a declared multi-year sample, how often does the same site meet those requirements?
5. Which conclusions depend on uncertain or missing terrain evidence?

The interface supports technical planners, science planners, educators/students, and a short hackathon demonstration. Preliminary screening does not establish flight readiness.

### Terminology and scientific limits

- **Landing time:** The UTC start of surface evaluation. A launch date needs a launch-to-landing trajectory relationship, which this build does not model. Use Landing UTC in controls and explanations.
- **Solar-eligible time:** Time when the Sun clears terrain and meets the selected elevation rule. This is a geometric power proxy, not net-positive electrical power.
- **Earth-visible time:** Geometric direct-to-Earth visibility under the declared body/horizon approximation; it does not establish antenna availability or RF performance.
- **Meets evaluated requirements:** A model-specific result, not a safe-landing verdict.
- **Binding:** A requirement that blocks the current decision. A weighted list of long visibility gaps alone does not prove causation.
- **Robustness:** Sensitivity across explicitly tested dates and terrain variants; it is not a mission-success probability.

## 3. Goals and priorities

| ID | Goal | Acceptance target |
| --- | --- | --- |
| G1 | Compare two to four scenarios | Cached evaluation under 2 seconds per scenario; first comparison under 5 seconds |
| G2 | Explain every failing scenario | Violated rule, deficit, supported intervals, and evidence shown |
| G3 | Adjust scenarios interactively | Cached verdict/explanation update within 1 second of a settled edit |
| G4 | Serve technical and public users | Technical/plain-language views using the same structured results |
| G5 | Keep calculations inspectable | Horizon, sources, sampling, assumptions, and gaps visible |
| G6 | Compare multi-year decision stability | Same evaluator and constraints across a declared epoch grid; uncertainty distinguished |

**P0:** Core demonstration, FR-1 through FR-10, subject to the explicit scope decisions below.  
**P1:** Required follow-on differentiator FR-11, after the core evaluator is validated.  
**Stretch:** Arbitrary supported custom-site preprocessing, delta visualization, dedicated PDF generation, weekly multi-year sampling, extended animation/demo scripting.

## 4. Functional requirements, one by one

### FR-1 — Site selection and scenario builder

**User story:** Select real supported sites and compare their environmental conditions.

- FR-1.1 Target at least eight curated entries with sourced coordinates, frame, height reference, observer height, and coverage status. Start validation with three; expand only with valid inputs.
- FR-1.2 Accept custom latitude/longitude and terrain/observer-height inputs with explicit units and bounds. Evaluate only where a horizon/geometry bundle exists for that position, or after preprocessing it. Unsupported inputs return a clear coverage state.
- FR-1.3 Keep at least two scenarios active; support up to four.
- FR-1.4 Separate south-polar candidates from any non-polar educational references. An Apollo reference cannot silently count as a supported south-polar site.
- FR-1.5 A DEM tile may support a new location, but another site's horizon cannot be substituted as that location's horizon.

**Acceptance:** Inputs and coverage are validated; scenario selection is independent; unavailable locations receive no fabricated verdict. Final catalog target is eight; any reduced delivery is explicitly recorded.

### FR-2 — Date, duration, and local solar context

- FR-2.1 Offer landing UTC dates within actual bundle/ephemeris coverage. Planning target: 2027–2033, subject to asset coverage.
- FR-2.2 Duration is in hours, default 168 hours. Reject invalid durations and windows extending outside coverage.
- FR-2.3 Provide a ±60-day landing-time sweep at one-day steps, preserving selected UTC time of day.
- FR-2.4 Show documented local solar longitude/phase context alongside UTC; do not invent a conventional lunar clock.
- FR-2.5 Use half-open intervals [start, end), explicit UTC timestamps, and declared temporal resolution.

**Acceptance:** Timezone and endpoint tests pass; coverage includes the whole mission duration; displayed dates match evaluated starts.

### FR-3 — Sun/Earth ephemeris and geometry

- FR-3.1 Generate site-based Sun/Earth altitude/azimuth at a step no coarser than 10 minutes for core scenarios.
- FR-3.2 Use a pinned JPL ephemeris and compatible lunar orientation/frame inputs. Record the exact Moon-fixed-to-local-horizon transformation.
- FR-3.3 Include lunar orientation/libration through the supported model and document the treatment.
- FR-3.4 Expose geometric altitude separately from terrain-masked availability.
- FR-3.5 Retain raw series in the bundle so charts, evaluator, and explanation use identical data.
- FR-3.6 Document time conversion, longitude/latitude conventions, angle units, observer height, and body-center/limb approximation.

**Acceptance:** Independent reference cases pass approved angular/time tolerances. A descriptive illumination pattern alone is insufficient numeric validation. Missing frame or ephemeris inputs block scientific acceptance.

### FR-4 — Terrain horizon and visualization

- FR-4.1 Use a sourced LOLA-derived DEM covering each evaluated location and the required surrounding terrain.
- FR-4.2 Precompute a 360-value, 1-degree azimuth horizon for each distinct site/observer configuration; reuse it across dates.
- FR-4.3 Define ray distances, terrain sampling, curvature handling, azimuth interpolation, and edge/no-data behavior.
- FR-4.4 Compare geometric body altitude with terrain horizon using a declared strict boundary rule. Default center approximation: altitude > horizon.
- FR-4.5 Render an azimuth/elevation silhouette or polar plot with Sun/Earth tracks and a selected timestamp.
- FR-4.6 Mark data gaps; do not turn missing or invalid terrain into a zero-height horizon.

**Acceptance:** Known obstruction and open-horizon reference cases match within approved tolerances; unsupported terrain remains unknown; plot values match the stored series/horizon.

### FR-5 — Deterministic environmental verdict

For a fully covered interval:

- solar eligible = Sun above the terrain horizon AND Sun geometric elevation at least the chosen solar threshold;
- Earth visible = Earth above the terrain horizon AND Earth geometric elevation at least the chosen Earth threshold;
- overlap = both true at the same time.

Integrate duration-weighted intervals, with boundary/refinement policy documented.

- FR-5.1 PASS requires cumulative solar-eligible, Earth-visible, and overlap hours to meet all configured minimums.
- FR-5.2 Initial demonstration defaults: solar elevation 5 degrees; Earth elevation 0 degrees; cumulative solar/Earth minimums 6 hours each; overlap minimum 4 hours. These are editable example requirements, not spacecraft limits.
- FR-5.3 Return each rule's value, threshold, operator, and signed margin/deficit.
- FR-5.4 Use deterministic rules; no LLM or opaque score in the verdict path.
- FR-5.5 Return INSUFFICIENT_DATA for unresolved coverage and UNCERTAIN for unresolved supported uncertainty. A proven violated rule can produce FAIL while unknown checks remain visible.
- FR-5.6 Validate thresholds and avoid misleading silent clamping. Invalid requests return structured errors.
- FR-5.7 Display that cumulative availability does not establish uninterrupted power, communications, or storage endurance.

**Acceptance:** Test independent Sun/Earth availability with zero overlap, exact-threshold boundaries, partial final intervals, invalid settings, and missing data. Missing inputs never count as PASS.

### FR-6 — Binding Constraint Explainer

**Highest-priority interaction:** Explain a failed decision using values and traceable intervals.

- FR-6.1 First identify failed aggregate rules and their deficits. Then show relevant contiguous intervals of Sun below terrain, Sun below elevation threshold, Earth obstruction/elevation loss, and absent overlap.
- FR-6.2 Distinguish geometric-horizon loss from additional threshold loss. Do not double-count nested intervals or add overlapping deficits as independent lost hours.
- FR-6.3 Rank explanatory intervals using documented criticality weights times duration, with deterministic tie-breaking. Proposed demo weights: solar obstruction 3, Earth obstruction 2, additional solar-threshold loss 1. These are presentation priorities, not physical importance or proof of the binding rule.
- FR-6.4 Include rule, measured deficit, start/end UTC, duration, relevant azimuth band, and modeled consequence. Include azimuth only when geometry supports that attribution.
- FR-6.5 Produce a plain-language sentence from templates and structured values, with matching technical detail.
- FR-6.6 A reason is binding only insofar as it blocks an enabled rule. Use counterfactual re-evaluation where claiming that changing one setting resolves failure; otherwise label it a contributing limitation.
- FR-6.7 If several requirements fail, list them. Do not suggest one slider will fix all unless re-evaluation confirms it.
- FR-6.8 Explanations describe solar eligibility and geometric visibility rather than guaranteed power or communication loss.

**Acceptance:** Three independently specified scenarios produce correct rules, deficits, intervals, and sentences; a long gap in an otherwise passing scenario is not falsely called the cause of failure; multiple-failure and no-data templates remain accurate.

### FR-7 — Scenario Surgery and flip search

- FR-7.1 Provide controls for landing UTC, duration, minimum Sun/Earth elevation, cumulative Sun/Earth requirements, and overlap requirement.
- FR-7.2 Re-evaluate the shared series within 1 second for supported cached edits; expose loading/stale/error states for other work.
- FR-7.3 Search a declared ordered date/threshold grid and report the first tested passing configuration with the requirements relieved.
- FR-7.4 Label a daily-grid result as the first feasible sampled landing date within search bounds, not an exact continuous flip time. Refine boundaries only with a validated refinement method.
- FR-7.5 Snap to flip applies the evaluated configuration and displays changed values; it never silently relaxes requirements.
- FR-7.6 If no tested configuration passes, show that result. No-data gaps cannot be skipped while claiming an unqualified earliest solution.
- FR-7.7 Do not interpolate binary verdicts. Any continuous-series interpolation requires documented validation before evaluation.
- FR-7.8 Preserve an immutable baseline and reject stale responses after rapid edits.

**Acceptance:** A verified failing case has a reproducible sampled flip; a no-flip case remains unresolved; threshold edits update all views; unchanged inputs reproduce baseline.

### FR-8 — Comparison and reporting

- FR-8.1 Show two to four cards with verdict, solar/Earth/overlap hours, failed rules, margins, and explanation.
- FR-8.2 Use common units and highlight different durations, requirements, data versions, and models. A visual delta view is stretch scope.
- FR-8.3 Provide printable HTML containing scenario settings, completed results, explanations, provenance, approximations, and generation time. Dedicated PDF generation is stretch.
- FR-8.4 Export a machine-readable JSON snapshot with canonical inputs, versions, result, uncertainty, search bounds, and hash.
- FR-8.5 Never present pending, stale, or synthetic results as final validated findings.

**Acceptance:** Self-comparison gives zero differences; exports match the completed evaluation; unknowns survive export; report fits one printed page for the standard two-scenario demo, with overflow handled for expanded data.

### FR-9 — Provenance, approximations, and reproducibility

- FR-9.1 Keep a concise provenance summary visible; expose kernel/orientation inputs, terrain product/resolution, source/hash, frame chain, horizon method/resolution, sample step, and libration treatment.
- FR-9.2 List body approximation, terrain extent, gaps, uncertainty availability, sampling/refinement, and model exclusions.
- FR-9.3 Hash canonical scientific inputs, dataset/model versions, and algorithm version. An input hash identifies a computation; it does not validate its physical correctness.
- FR-9.4 Serialize verdict/attribution deterministically. Keep export-generation timestamps outside the deterministic result payload.
- FR-9.5 Track data class and validation status independently: synthetic, real-data/unvalidated, or real-data/validated with a linked reference record.
- FR-9.6 Never promote a result to validated because it has a hash or uses an agency dataset.

**Acceptance:** Identical versioned inputs give byte-identical result/attribution; scientifically relevant input/version changes alter identity; no credentials enter bundles/reports.

### FR-10 — Accessibility, education, and guided demo

- FR-10.1 Toggle Technical and Plain-language views of the same structured result.
- FR-10.2 Support keyboard navigation, labeled controls, text alongside status colors, and WCAG AA contrast targets.
- FR-10.3 Provide tables/text alternatives for charts and a layout usable at 1280 x 720, degrading gracefully for tablets.
- FR-10.4 One-click demo loads a verified failing fixture, highlights its explanation/flip control, and completes a scripted journey in 90 seconds.
- FR-10.5 A basic guided fixture is P0; animated narration and extended scripting are stretch.
- FR-10.6 Demo values must derive from the retained data. Never force a desired PASS/FAIL or flip.

**Acceptance:** Keyboard completes the core journey; view toggle changes wording only; the demonstration works from the retained static bundle.

### FR-11 — Epoch-Robustness Envelope with Uncertainty Attribution

**Priority:** P1, planned after core acceptance.  
**User story:** Determine whether one site's apparent suitability persists across sampled future landing dates and which conclusions are sensitive to terrain uncertainty.

#### A. Multi-year evaluation

- FR-11.1 Evaluate the same mission duration, thresholds, geometry conventions, and algorithm over an explicit epoch grid.
- FR-11.2 Initial target: one specified UTC start per month from 2027 through 2033, yielding 84 starts when fully covered. Record the chosen day/time and coverage. Weekly sampling is stretch.
- FR-11.3 Present a calendar of PASS, FAIL, UNCERTAIN, and INSUFFICIENT_DATA. Opening a cell reproduces that scenario and its FR-6 explanation.
- FR-11.4 Report passing fraction among evaluated starts, total requested/evaluated/unknown counts, grid definition, and failed-rule distribution.
- FR-11.5 A monthly sample is a coarse comparison of selected starts; it cannot establish all feasible windows, fraction of continuous time, or complete seasonal behavior. Prevent sampling aliases from becoming broad seasonal claims.
- FR-11.6 Identify continuous windows only after appropriate finer sampling/refinement. Compare sites using compatible grids and disclose differences.

#### B. Terrain uncertainty

- FR-11.7 Enable numerical uncertainty only with documented DEM ensembles, defensible bounds, or a validated uncertainty model covering the actual horizon calculation.
- FR-11.8 Propagate terrain variants through horizon construction and the same visibility/evaluator path. Reuse valid precomputed variants to bound processing cost.
- FR-11.9 Show metric ranges or verdict sensitivity across those variants with the method, coverage, number of variants, and limitations. Call a range a confidence interval only if its statistical interpretation is justified.
- FR-11.10 Missing uncertainty inputs produce Uncertainty not quantified. A confidence weight per azimuth alone cannot produce a defensible percentage band.
- FR-11.11 Attribute instability to supported azimuth/terrain sectors by a documented sensitivity or counterfactual method. Otherwise report terrain sensitivity without inventing a precise source.
- FR-11.12 Separate changes across dates from changes across terrain variants. Neither passing fraction nor ensemble agreement is a mission-success probability.
- FR-11.13 Export the grid, per-epoch evaluations, variant identifiers, provenance, and known gaps.

**Acceptance:** A single calendar cell matches direct evaluation; changing constraints invalidates/recomputes all relevant cells; unknown starts are not counted as passes or silently discarded; a known sensitive reference produces explained variant changes; absent uncertainty produces no fabricated band.

**Delivery gate:** Multi-year nominal results may ship with an explicit uncertainty-not-quantified label. Quantitative terrain uncertainty ships only after its propagation method passes reference checks. No invented example percentages are production findings.

## 5. Core scope, follow-on scope, and exclusions

| Delivery | Included |
| --- | --- |
| P0 core | Supported catalog, 2–4 scenarios, landing controls, geometry/horizon plot, deterministic evaluator, explanation, scenario surgery, provenance, education/basic demo, printable/JSON report |
| P1 follow-on | Multi-year calendar, sampled robustness comparison, uncertainty attribution where validated inputs support it |
| Stretch | Arbitrary covered custom-site preprocessing, visual delta view, dedicated PDF, weekly epoch grid, extended animation/demo |
| Deferred | 3D terrain, general GIS, Evidence Coverage experiment, CopperOS research automation |
| Excluded | Rover control/traverses, relay placement/DSN or RF budgets, battery/vehicle safety models, descent/trajectory dynamics, accounts/cloud collaboration, LLM-generated verdicts/explanations |

Custom coordinates remain a product requirement. In the static hackathon build, support is restricted to positions with valid precomputed coverage; an arbitrary coordinate must not imply computation that the static bundle cannot perform.

## 6. Architecture and data flow

**Target:** React + Vite client, Python build-time preprocessing, static JSON bundle plus provenance manifest. Parquet may be retained as a pipeline artifact if useful. Existing FastAPI stays a legacy/demo integration until a separate migration is implemented.

**Proposed geometry:** Skyfield with pinned JPL inputs, or another documented engine such as SPICE/Siderust after API/frame compatibility is verified. Loading a planetary ephemeris alone does not prove a correct lunar surface observer model.

**Flow:** Versioned terrain/ephemerides → site horizon + geometry series → validated bundle → shared deterministic evaluator → attribution → comparison/surgery → epoch sweep → exports.

- Bundle Sun/Earth series and horizons; draw charts from the same records used for verdicts.
- Re-evaluate editable thresholds/durations against stored series. Avoid precomputing every threshold combination.
- Precompute extra time coverage required by the full sweep and mission duration.
- Cache site horizons by position/observer/model/DEM configuration; dates do not require rebuilding unchanged terrain.
- Keep numerical evaluation consistent across browser and reference pipeline, using parity fixtures.
- Do not recompute a different geometry model solely for the plot.
- Static custom-site support requires a prepared bundle; dynamic arbitrary-site analysis needs a separately scoped compute service or preprocessing workflow.
- Verify data product usage conditions, dependencies, bundle size, and deployment limits during implementation.

### Data contracts

| Record | Minimum fields |
| --- | --- |
| Site | ID/name, coordinates/frame, sourced height/reference, observer height, coverage |
| Manifest | Schema/data/model versions, source URLs/hashes, frames, units, time scale, sampling, horizon method, validation record |
| Geometry | UTC intervals, Sun/Earth altitude/azimuth, gaps |
| Horizon | Site/configuration key, azimuth/elevation, coverage mask, optional uncertainty variants |
| Scenario | Site, landing UTC, duration, thresholds, weights, versions |
| Evaluation | Rule values/margins/states, durations, violation intervals, structured explanation, canonical hash |
| Flip search | Bounds, ordered samples, precision, unknowns, tested passing configuration or no match |
| Robustness | Epoch grid, per-cell evaluation IDs, pass/known/unknown counts, terrain variants/method |
| Report | Completed snapshot, canonical scientific result, separate export timestamp |

## 7. Scientific and performance acceptance

### Numerical validation

Before presenting real-data results as validated, approve numerical tolerances and retain references for:

1. Lunar coordinate/frame/time transformations and observer definition.
2. Sun/Earth altitude/azimuth, including orientation treatment.
3. Terrain horizon and obstruction near transitions.
4. Duration integration, threshold boundaries, and simultaneous visibility.
5. Aggregate failures, explanation intervals, and sampled flip search.
6. Cross-runtime deterministic evaluator parity.
7. Multi-year cell parity and terrain-variant propagation when enabled.

Record tolerances, rationale, residuals, dataset versions, reviewer, and unresolved limitations. Until accepted, use Real data — validation pending. Synthetic fixtures remain Synthetic demonstration.

### Performance targets

Measure on a recorded laptop/browser and bounded bundle:

- First two scenarios visible within 5 seconds.
- Cached evaluation under 2 seconds per scenario.
- Settled slider edit to updated verdict/explanation within 1 second.
- First explained verdict within 15 seconds of opening.
- Demonstrated flip within 30 seconds; guided sequence within 90 seconds.

These are targets, not established measurements. Precomputation reduces runtime cost but does not guarantee bundle loading or multi-year preprocessing performance.

### Core demo checklist

- [ ] At least two real supported scenarios compare correctly.
- [ ] A verified FAIL shows failed rule, deficit, and timestamped intervals.
- [ ] The horizon plot matches stored geometry and the explanation.
- [ ] Landing-time/threshold editing produces a verified sampled flip.
- [ ] No-flip, invalid-input, and no-terrain cases are handled.
- [ ] Plain-language sentences remain accurate across all supported states.
- [ ] Provenance/approximations are visible; result class is accurate.
- [ ] Canonical results reproduce; printable/JSON exports agree.
- [ ] Keyboard and small-screen checks pass.
- [ ] Numerical validation and measured performance are recorded.

### Follow-on checklist

- [ ] Multi-year calendar reproduces direct evaluations.
- [ ] Sample counts, coverage, grid, and failed rules are explicit.
- [ ] Terrain sensitivity uses a documented validated propagation method, or clearly says not quantified.
- [ ] No probability, novelty, or unverified competitive claims appear as findings.

## 8. Implementation order and suggested 48-hour allocation

The supplied 48-hour schedule is a planning budget, not a completion promise. Data preparation and validation may require more time. Do not replace missing science with synthetic values to meet the schedule.

| Phase | Suggested hours | Deliverable and exit |
| --- | --- | --- |
| 1. Data contract and geometry | 0–4 | Pin products/frames/coverage; one site's geometry passes reference checks |
| 2. Terrain and shared evaluator | 4–10 | Three validated site horizons/series; duration and rule fixtures |
| 3. Explanation engine | 10–16 | Deficits, intervals, deterministic templates; three reference scenarios |
| 4. Scenario UI | 16–24 | Two-to-four scenario cards and supported site/date controls |
| 5. Scenario surgery | 24–32 | Horizon plot, responsive edits, sampled flip and snap |
| 6. Provenance and education | 32–38 | Manifest, hash, plain-language view, coverage/error states, reports |
| 7. Verify and rehearse | 38–44 | Expand sourced catalog toward eight; validate demos and accessibility; backup recording |
| 8. Package | 44–48 | Static artifact, README, reproducibility instructions, 90-second demonstration |
| 9. Follow-on robustness | After core gates | Multi-year calendar, then justified terrain uncertainty propagation |

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for tickets, dependencies, and completion evidence.

## 9. Scope and consistency decisions

| Supplied wording or conflict | Implementation decision |
| --- | --- |
| Launch-date sliders without trajectory model | Landing-time sliders; launch conversion deferred |
| Power-positive hours from elevation | Solar-eligible geometric proxy; electrical model excluded |
| Exact flip on daily grid | First passing sampled configuration; refine only with valid computation |
| Binary verdict despite missing data | PASS/FAIL plus explicit INSUFFICIENT_DATA/UNCERTAIN |
| Weighted long gaps called causes | Failed-rule deficits first; weights prioritize explanations; verify claimed fixes |
| Interpolated verdicts | Re-evaluate supported numerical series; no binary interpolation |
| Eight sites vs three-site build phase | Validate three first; target eight sourced supported entries by core completion |
| Arbitrary custom coordinates on static deploy | Evaluate only actual precomputed coverage, or preprocess a new bundle |
| PDF/demo listed as both MVP and stretch | Printable HTML and basic guided fixture core; dedicated PDF/extended scripting stretch |
| Input hash as validation | Hash includes versions for identity; physical validation remains separate |
| Monthly sampling reveals complete seasonal structure | Coarse sampled-start comparison only; no continuous-time inference |
| DEM confidence weights create percentage bands | Require defensible propagation; otherwise uncertainty not quantified |
| Claims of exclusive novelty or guaranteed victory | Product hypotheses; exclude unsupported claims from shipped copy |

## 10. Risks and decisions before coding

| Risk/decision | Required resolution |
| --- | --- |
| Exact region, curated coordinates, DEM products, dates | Pin supported assets and catalog in the science spike |
| Python/runtime dependencies not established | Set up a reproducible preprocessing environment and pinned lock/manifest |
| Lunar frame/observer mistakes | Independent numeric reference cases before recommendation UI |
| Missing horizon coverage or uncertain DEM | Preserve masks/unknowns; validate variants before numerical bands |
| Multi-year monthly aliases or large bundles | Publish grid limitations; benchmark storage/precompute; refine narrowly |
| Real failing scenario/flip not available in chosen window | Search and verify fixtures; show no match honestly |
| Numerical tolerance/reviewer not assigned | Record acceptance values and reviewer before validated release |
| Event/competitor/judging claims from pasted research | Verify separately before submission claims; do not encode as product facts |

## 11. Change tracking and implementation status

- [x] New supplied direction consolidated into this authoritative PRD.
- [x] Previous PRD archived and exact source retained.
- [x] Requirement-linked implementation backlog created.
- [ ] Scientific asset selection and numerical acceptance complete.
- [ ] FR-1 through FR-10 implemented and accepted.
- [ ] FR-11 multi-year evaluation implemented and accepted.
- [ ] FR-11 quantitative uncertainty method accepted, or explicitly unavailable.
- [ ] Static deployment and demonstration verified.

**First implementation target:** A sourced site's geometry and terrain horizon, a shared rule evaluator, and reference fixtures. Build the Binding Constraint Explainer and live scenario controls on those results.

**Pitch:** When a lunar surface plan changes, SiteLight explains which evaluated requirement fails, shows the shortfall, and lets users test a supported adjustment in one screen.
