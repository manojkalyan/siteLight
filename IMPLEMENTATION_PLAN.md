# SiteLight AI — Implementation Plan

**Version:** 4.10 · 15 November 2026 — sourced terrain evidence and NASA reference architecture  
**Requirements authority:** [PRDnew.md](PRDnew.md)  
**Status:** Six catalog points have 500 km nominal horizons, 600 published correlated local terrain windows, partial confidence-filtered stereo comparisons and a separately labeled NASA reference architecture. Custom points retain their own declared extent. Full physical scientific acceptance, mission-specific engineering calibration and selected-site extractable ice remain open. Final regression/browser results are recorded in the verification artifacts.  
**Scope:** Environmental comparison/explanation with slope and continuous-gap screening first; LCSS and conditional temperature context next; optional/research enhancements remain gated.

## 1. How to use this plan

**UI 1 delivered:** [Implementation and validation](docs/UI1_RELEASE.md) records the new default interface, current-footprint correlated terrain endpoint, measured overlays, classic recovery entry and passing 188 JavaScript / 18 Python / 18 Chrome checks. Scientific/engineering acceptance boundaries remain unchanged. The earlier UI planning note below describes its starting point.

**Planned UI 1 migration (not implemented):** [UI 1 implementation and validation plan](docs/UI1_IMPLEMENTATION_PLAN.md) maps the approved 12-screen concept set to existing calculations, four main tabs and six Screening sections. It defines incremental migration, dynamic-data contracts, 3D coordinate/scale checks, configurable ensemble handling, regression/browser gates and a recoverable classic entry. This is a presentation migration roadmap; current scientific/engineering acceptance limits remain in force.

**Current v4.9 increment:** [Terrain evidence and NASA reference architecture](docs/TERRAIN_REFERENCE_INCREMENT.md) records implemented acquisition/preparation, source identity checks, the corrected horizon, local ensemble propagation, raw-PDS-confidence-filtered comparisons, NASA reference bookkeeping, report/UI integration and reproducible verification commands. The reference footprint stays 100 m radius/20 m baseline/12 degree limit; the wider horizon uses a 240 m outer DEM to 500 km and a conditional declared-height exclusion beyond it. Published reference assumptions do not become measured local ice or calibrated legacy LCSS equipment. Physical acceptance work now requires the specific independent terrain, global/orientation covariance, equipment/process/operations and local resource evidence listed there. Historical increment entries below describe their original scope; consult final artifacts for current test outcomes.

**Scientific/engineering verification follow-up:** [The completed audit](docs/SCIENTIFIC_ENGINEERING_VERIFICATION.md) records 69 source identities, 744 expanded reference cases, six terrain convergence cases and passing 168 JavaScript/10 Python checks. Architecture-matched calibration, independent terrain truth, global completeness and correlated uncertainty remain open.

**Browser validation follow-up:** [The Windows Chrome review](docs/BROWSER_VALIDATION.md) records 11 passing automated UI cases and one headed hardware/context-recovery case. The official VS Code extension and tasks are installed/configured. Selected screenshots were inspected; mobile layout/overflow, table scrolling and recovery messaging were corrected. Broader accessibility/device/performance acceptance remains open.

**v4.8 start-window increment:** [Ten-minute loaded-record scanning](docs/START_WINDOW_SCAN.md) is implemented for FR-H6–H8. Shared visibility rules, prefix-weighted fractions, sliding outage maxima, coverage checks, grouped sampled ranges, rechecked application, stale-study invalidation, bounded caching and JSON/print/hash evidence are delivered. All six packaged points have 11,953 tested default-duration starts; Nobile has 2,303 uncertain nominal fits. Real rendered browser/GPU and engineering/scientific gates remain open.

**v4.7 partial radiation increment:** [Radiation evidence/proton screening](docs/RADIATION_MODEL.md) is delivered with nine pinned source assets, 1285 historical CRaTER days, 396 NIST range rows, independent A/B settings, source flags/units, normal-slab primary residual-energy and mass comparisons, and JSON/print/hash evidence. Full radiation spectra/secondary transport and surface/human dose remain unassessed. Candidate OLTARIS tables with unresolved units/correction applicability were not imported.

**v4.6:** [Conditional ejecta exploration](docs/PLUME_EJECTA_MODEL.md) is delivered: independent A/B assumed post-acceleration release states, central-gravity spherical trajectories, up to five hypothetical asset envelopes, times/kinetic energy and report/hash evidence. Three pinned references and two checked constants support numerical reproducibility. Actual engine/soil erosion, launch distributions, terrain, deposition and damage remain gated.

**v4.5:** [Dust/radiator optical exploration](docs/DUST_THERMAL_MODEL.md) is delivered with pinned source acquisition, three verified laboratory material rows, independent A/B assumptions, steady-state heat-balance comparisons, signed capacity margins, coverage curve and report/hash evidence. This limited optical approximation is not conservative; coating-specific validation, layer conduction/transients and thermal engineering acceptance remain open.

**v4.4:** [Conditional rescue planning](docs/RESCUE_PLANNING.md) is implemented on bounded sampled routes: independent A/B hypothetical assets tied to point/start, availability, speed/delays, optional loaded return, time limits and report/hash evidence. Missing assets/routes remain unassessed. This does not close vehicle, energy, communication, medical or operational rescue gates.

**v4.3:** [Engineering evidence implementation](docs/ENGINEERING_CALIBRATION.md) is delivered: two pinned NASA PDFs, seven primary-value transcription checks, all 20 architecture parameters with required evidence, related context for seven inputs, visible review gates and JSON/print provenance. This advances calibration preparation; architecture-matched validation and independent acceptance remain open.

**v4.2:** The monthly 84-start real-data grid, sampled terrain route search and geometric sky context are implemented. See [advanced planning methods, evidence and research model inputs](docs/ADVANCED_PLANNING.md). These additions are separate from final operational verdicts and do not close the remaining acceptance gates.

See [CURRENT_STATUS.md](docs/CURRENT_STATUS.md) for current delivery/acceptance and [APPLICATION_REVIEW.md](docs/APPLICATION_REVIEW.md) for the prepared browser/demo procedure. The v4.1 pass fixes loading guards, incomplete scientific-response contracts, stale custom thermal-index identity, concurrent temporary-file names, unsupported-search messaging and local-service errors. Scientific/engineering evidence and rendered browser gates remain explicit.

**Current increment:** The six-point sampling task is implemented and audited at the stated diagnostic trigger. See [sampling refinement and remaining acceptance](docs/SAMPLING_REFINEMENT.md). There are 720 half-degree production rays with 2.5 m/40 m radial steps; tests, source/cache versions and chart contours are updated. Global/correlated uncertainty, independent terrain/engineering review and rendered browser acceptance remain open.

1. Read the feature requirements and defaults in PRDnew.md.
2. Complete tickets in dependency order.
3. Record verification evidence before marking a feature complete.
4. Keep synthetic fixtures clearly separate from real-data validation.
5. Preserve a working core if logistics or stretch work cannot be justified.
6. Use the official source register in PRDnew.md Section 13 and the acquisition sequence in this plan Section 12. Real inputs are required for the scientific demonstration; synthetic fixtures remain development/test data.

This replaces the [previous implementation plan](docs/archive/IMPLEMENTATION_PLAN-v2.0.md). The original supplied brief remains in [the source reference](docs/reference/user-supplied-lcss-prd.txt).

### Current baseline

| Area | Current state |
| --- | --- |
| Existing application | FastAPI/CopperOS demonstration and a dark dashboard |
| Scientific data | Six PGDA DEM/uncertainty sets; January–March 2027 packaged geometry and local real date-block generation throughout 2027–2033; reference mode retained separately |
| Frontend setup | Working Vite entry, modular JavaScript workspace, Three.js visualization, and offline standalone build |
| New frontend | Reference-style outliner, viewport, A/B cards, inspector, timeline, comparison, screening, calendar, reports, and Evidence view implemented |
| Environmental evaluator/explainer | 125 km multiscale geometry, source-RMS sensitivity, weighted metrics, ranked causal intervals, gaps, and qualified date search connected. Eighteen independent apparent-angle cases pass; global/convergence/correlated uncertainty acceptance remains open |
| LCSS | Parameter examples exist in the brief; exploratory equations and fixtures implemented; engineering calibration and applicable local ice evidence remain pending |
| Robustness calendar | Bounded 29-day sweep, 84-start 2027-2033 monthly grid and every supported loaded ten-minute start implemented; sampled results retain scientific qualifications |
| New requirement verification | Automated evaluator, data-integrity, state, and DOM contract tests; NASA coverage matrix; browser/GPU and scientific acceptance pending |
| Standalone UI prototypes | Immersive and hybrid HTML samples exist with synthetic evaluator/interaction tests; no real-data scientific acceptance |
| Terrain/environment additions | Real footprint slope/roughness/coverage, source RMS context and 125 km multiscale horizon at six study points; other staged models remain gated |

A production frontend build and a separate offline workspace are available. No deployment or fully accepted real-terrain scientific result is claimed. Earlier prototypes are preserved. See [workspace delivery notes](docs/WORKSPACE_IMPLEMENTATION.md) and [NASA challenge coverage](docs/NASA_CHALLENGE_COVERAGE.md).

**Current execution record:** See [REAL_DATA_INCREMENT.md](docs/REAL_DATA_INCREMENT.md) for completed preprocessing, actual coordinate/height definitions, validation evidence, compute benchmarks, and the next ordered stages. No new approval is needed to continue within this plan; scientific/model gates are evidence requirements, not conversational permission gates.

**Coverage correction delivered:** [DATA_COVERAGE_FIX.md](docs/DATA_COVERAGE_FIX.md) records the six-point real catalog, separate mode histories, validated date-block generation, transactional updates, safe offline bounds, and actual HTTP/UI regression checks. Raw kernels and local tooling are needed only for new-date generation; initial packaged comparisons remain portable.

## 2. Features to implement

| Tier | Feature | PRD reference | Expected user result |
| --- | --- | --- | --- |
| 1 | Supported site catalog and custom-input validation | Module A | Select two supported sites without fabricated coverage |
| 1 | Landing UTC, duration, and common requirements | Modules A/C | Configure an explicit, comparable surface assessment |
| 1 | Sun/Earth geometry | Module B | Inspect positions from documented inputs |
| 1 | Terrain horizon and skyplot | Module B | See how local terrain affects visibility |
| 1 | Sun/Earth/overlap evaluator | Module C | Receive values, margins, and explicit decision states |
| 1 | Binding Constraint Explainer | Module D | Understand why a requirement fails and when |
| 1 | Scenario Surgery and sampled flip | Module E | Test and apply a verified adjustment |
| 1 | Scenario A/B cards | Module F | Compare equivalent metrics and explanations |
| 1 | Provenance and deterministic identity | Module I | Inspect sources, assumptions, and result version |
| 1 | Technical/plain view and basic guided fixture | Module J | Understand the same result at either skill level |
| 2 | LCSS mass model and logistics verdict | Module G | Inspect a justified two-year mass estimate against a budget |
| 2 | Mass-contribution explanation | Module G | See the budget deficit and individual contributors |
| 2 | Hypothetical ice sensitivity and logistics flip | Modules E/G | Test assumptions while preserving sourced values |
| 3 | Multi-year sampled calendar | Module H | Compare declared future landing starts |
| 3 | Delta view, reports, animation, extended demo | Modules F/J | Additional presentation and sharing |
| 1 — next addition | Terrain slope, supported roughness, assessment footprint/coverage, and uncertainty | EXT-01; FR-EXT-01.1 through 01.5 | Inspect the actual area and understand terrain evidence limits |
| 1 — next addition | Longest darkness and geometric Earth-visibility gaps | EXT-02; FR-EXT-02.1 through 02.4 | Inspect continuous losses rather than cumulative fractions alone |
| 2 — conditional | Surface-temperature context | EXT-03; DS-10 | Inspect product-supported temperature context without a hardware-survival claim |
| 3 — optional | Geometric terrain/path connectivity | EXT-04; DS-03/04/11 | Explore connected terrain under declared screening assumptions |
| Optical exploration | Dust/radiator sensitivity | EXT-05; DS-13 | Implemented clean/dusty equilibrium comparison; calibrated coating/layer/transient model remains open |
| Conditional exploration | Post-acceleration ejecta | EXT-06; DS-14 | Prescribed single-grain trajectory/asset geometry implemented; engine/descent/regolith erosion and damage remain unassessed |
| Partial delivery | Orbital radiation observations / primary protons | EXT-07; DS-12 | Historical silicon dose rates and NIST CSDA slab comparison implemented; full secondary transport and human/surface dose remain open |
| Conditional exploration | Contingency/rescue timing | EXT-08 | Implemented with scoped hypothetical assets, sampled routes and response/endurance limits; operational feasibility remains open |

## 3. Development order and milestones

### M1 — Data and project foundations

Resolve supported sites/dates, numerical conventions, reference cases, environment, and data schema. Establish one real site's geometry before building recommendations.

**Exit:** Versioned sources, transformation contract, approved tolerance plan, and a reproducible preprocessing environment.

### M2 — Scientific series and evaluator

Generate terrain horizons and geometry; package validated records; calculate durations and requirement margins with honest missing-data behavior. Add EXT-01 terrain statistics/coverage and EXT-02 continuous-gap records from the same accepted assets/series.

**Exit:** Reference and rule-boundary tests pass; three supported initial sites are available; slope/coverage and continuous-gap methods pass their reference fixtures. Unsupported terrain fields remain explicit.

### M3 — Explainer and comparison interface

Build deterministic explanations, scenario A/B setup, cards, polar plot, and interval details. Keep environmental, terrain, and optional outage-requirement findings separately labeled in the UI.

**Exit:** Correct explanation of three independently specified cases; displayed values match evaluator outputs.

### M4 — Surgery, provenance, and core demo

Add bounded flip search, controls, identity/provenance, accessible views, and a verified demonstration.

**Exit:** Tier 1 acceptance gate passes. A complete working core can ship without logistics.

### M5 — Logistics model and interaction

Resolve model equations first. Implement mass breakdown, budget comparison, sourced/hypothetical ice distinction, and supported sensitivity search.

**Exit:** Tier 2 acceptance gate passes. Unsupported LCSS remains not evaluated.

### M6 — Optional enhancements and packaging

Add at most two stretch items after core/logistics are stable. Verify static output and record a reproducible demo.

**Exit:** Chosen optional features pass their checks; complete release checklist.

## 4. Requirement-linked implementation backlog

Tickets are not completion claims. Scaffold only means setup artifacts exist, not that a working application has been verified.

| Ticket | Tier | Deliverable | Requirement links | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| SL-01 | 1 | Acquire/pin sources DS-01 through DS-05, exact sites, frames/time conventions, coverage, and reference/tolerance plan | FR-A1/A2/A5, FR-B2/B3/B4, FR-I1; DATA-REQ-01 through 08 | None | Implemented for six study points; broader reference review pending |
| SL-02 | 1 | Reproducible preprocessing environment and React/Vite application foundation | Architecture, FR-I2 | SL-01 decisions | Implemented: Vite/JavaScript workspace and pinned local scientific runtime |
| SL-03 | 1 | Sun/Earth geometry pipeline using pinned real inputs and local solar context | FR-A7, FR-B1/B2/B3/B8 | SL-01/02; DATA-02 | Implemented: matched DE421 geometric recipe and 2027–2033 date loading |
| SL-04 | 1 | Real LOLA terrain horizon generation with masks and observer configuration | FR-B4/B5/B6 | SL-01/02; DATA-03 | Implemented: 125 km multiscale horizon and sensitivity; full scientific acceptance pending |
| SL-05 | 1 | Versioned bundle contract, validation, and supported-coverage loading | FR-A2/A3/A5, FR-I1/I2 | SL-03/04 | Implemented and contract-tested |
| SL-06 | 1 | Shared environmental evaluator, margins, and decision states, linked to continuous-gap screening | FR-C1 through C7; EXT-02 | SL-05 | Implemented and fixture-tested |
| SL-07 | 1 | Failed-rule attribution, intervals, ranking, and templates | FR-D1 through D7 | SL-06 | Implemented and independently specified ranking fixtures pass |
| SL-08 | 1 | Scenario builder, A/B comparison, and separate environmental/terrain findings | FR-A1 through A6, FR-F1/F2/F3, FR-C7; EXT-01/02 | SL-05/06/07; accepted EXT-01/02 outputs | Implemented; browser/user validation pending |
| SL-09 | 1 | Polar horizon plot, Sun/Earth tracks, and timeline/table | FR-B7/B8, FR-D3 | SL-05/08 | Implemented; rendered/GPU validation pending |
| SL-10 | 1 | Scenario Surgery, bounded sampled flip, and snap action | FR-E1 through E7 | SL-06/07/08 | Implemented: bounded daily tested-date search and preview/apply/reset |
| SL-11 | 1 | Provenance/hash, technical/plain view, accessibility, and error states | FR-I1 through I5, FR-J1/J2/J4 | SL-08/09/10 | Implemented: source identity, exports, mode isolation and DOM checks; browser accessibility pending |
| SL-12 | 2 | Reviewed LCSS equations, site-applicable DS-06/07/08 evidence, source/assumption table, and reference cases | FR-G1/G2/G3/G5, FR-I1 | SL-01; DATA-05; M4 protected | Exploratory model, equations, sources and fixtures implemented; independent engineering acceptance pending |
| SL-13 | 2 | LCSS evaluator/UI, mass attribution, hypothetical ice controls, and flip search | FR-G4 through G10, FR-E1 | SL-12, SL-06/08/10/11 | Exploratory calculator/UI/search implemented; accepted logistics constraint remains gated |
| SL-14 | 1/2 release | Expand catalog to six, verify demos, benchmark, build/package, and update run docs | FR-A1, FR-J3, release gates | SL-11; SL-13 only for Tier 2 release | Six-point catalog, builds and local benchmarks implemented; browser/demo/submission gates pending |
| SL-15 | 3 | Monthly sampled robustness calendar and cell navigation | FR-H1 through H5 | SL-14 core acceptance | Bounded daily calendar and 84-start 2027-2033 monthly grid implemented; scientific acceptance remains bounded |
| SL-16 | 3 | Selected delta/report/animation/extended-demo enhancements | FR-F4/F5, FR-J3 extension | SL-14 | Metric deltas, JSON/CSV/print and playback implemented; extended demo pending |

### Ticket acceptance evidence

| Ticket | Evidence required before completion |
| --- | --- |
| SL-01 | Acquired asset manifest with checksums/coverage; exact supported coordinates; frame/height contract; archived reference inputs; numerical tolerance rationale |
| SL-02 | Reproducible dependency setup; working minimal frontend entry; preprocessing command works on the documented environment |
| SL-03 | Numeric Sun/Earth checks against an independent reference, including frame/time and coverage boundaries |
| SL-04 | Known obstruction/open-horizon cases; no-data/edge behavior; recorded ray extent and resolution |
| SL-05 | Valid bundle accepted; malformed units, missing metadata, unsupported coverage, and bad terrain rejected or masked correctly |
| SL-06 | Exact-threshold, overlap, duration weighting, gaps, invalid input, and multiple-failure tests |
| SL-07 | Three hand-specified expected explanations; nested-gap and multiple-failure checks; passing case is not falsely blamed |
| SL-08 | Scenario independence, shared-requirement visibility, coverage messages, keyboard form interaction |
| SL-09 | Plot/timeline values match the evaluation record; text/table alternative available |
| SL-10 | Known flip/no-flip, search bounds/precision, unchanged baseline, and rapid-edit stale-result checks |
| SL-11 | Repeat-result/hash parity; relevant version changes alter identity; keyboard, labels, contrast, and unknown-state review |
| SL-12 | Complete equations/units; mass balance; parameter provenance; justified reference outputs or analytical checks |
| SL-13 | Contributor sum, budget boundary, concentration unit conversion, reactor-step/no-flip cases, and verified logistics-only failure |
| SL-14 | Build artifact, actual performance record, six supported entries or explicit reduced-scope record, repeatable demo, no unsupported scientific claims |
| SL-15 | Cell/direct-evaluation parity; requested/known/unknown counts; no continuous-time or success-probability inference |
| SL-16 | Selected enhancement acceptance checks; no regressions in scenario values, provenance, or classification |

## 5. Proposed code organization

The following paths are planned; listing them does not mean they are implemented.

~~~text
src/
  components/       Scenario builder, cards, controls, accessible shared UI
  charts/           Horizon plot and availability timeline
  engine/           Rules, interval metrics, explanations, flip search
  logistics/        Accepted mass model and sensitivity search
  data/             Bundle schema, loading, validation, classification
  views/            Comparison and deep-dive views
scripts/
  science/          Geometry, terrain horizons, bundle generation
public/
  data/             Derived bundles and manifests; no secrets
tests/
  reference/        Numerical references and pipeline fixtures
tests-js/
  evaluator/        Rule, attribution, search, and runtime-parity checks
docs/
  validation/       Tolerances, residuals, and acceptance records
~~~

Preserve the existing Python/CopperOS demonstration as legacy functionality. Do not make the new core depend on CopperOS. Avoid changing legacy start scripts until the new launch path is working and documented.

### Data flow

Versioned source assets → geometry/horizon preprocessing → validated static bundle → deterministic evaluator → structured explanations → comparison and surgery.

Tier 2 adds a separately versioned, reviewed logistics model. Keep geometry precision, scientific validity, and logistics-model confidence distinct.

## 6. LCSS model-definition gate

Do not derive production mass values from the example parameter table alone. SL-12 must resolve:

- Water demand, loop recovery, net makeup, initial inventory, and reserves.
- Concentration units, extractable fraction, throughput, recovery, and operational duty cycle.
- Energy needed per kg and how power/throughput determine reactor count.
- Installed equipment mass, power generation/storage, hardware, spares, and exclusions.
- Double-count prevention and a clear definition of the total mass.
- Calibration/reference outputs, supported input range, and discontinuities.
- Site-applicable ice evidence with measured/proxy/assumed/user-adjusted labels.

Keep the 168-hour environmental assessment separate from the 730-day logistics baseline. A link between them must be explicitly modeled.

If the gate is incomplete, the interface may show planned assumptions and Not evaluated, but must not fabricate an LCSS value, a logistics verdict, or a demo flip.

## 7. Testing and verification strategy

### Scientific checks

- Independent geometry reference values and lunar frame/time conversions.
- Terrain obstruction, azimuth interpolation, DEM boundaries, and missing cells.
- Declared observer height and body-center/limb conventions.
- Numeric tolerances chosen before acceptance, with measured residuals retained.

### Evaluator and explanation checks

- Exact rule thresholds and fraction boundaries.
- Separate Sun/Earth availability with zero overlap.
- Non-uniform/partial time intervals and duration integration.
- Missing coverage, unsupported inputs, and simultaneous failures.
- Long visibility interruptions in otherwise passing scenarios.
- Template wording and counterfactual claims matching actual calculations.
- Deterministic tie-breaking and byte-identical scientific outputs.

### Interaction checks

- Scenario A/B independence; date and requirement edits.
- First/nearest tested passing configuration, ties, unknown gaps, and no-flip outcomes.
- Stale-result prevention after rapid edits.
- Plot, card, explanation, provenance, and optional report consistency.
- Keyboard navigation, labels, status text, responsive layout, and contrast.

### Tier 2 checks

- Water/material balance and percentage-to-fraction conversions.
- Non-overlapping mass contributors and budget comparison.
- Zero extraction, low/high yield, reactor-count steps, and impossible settings.
- Source value preserved after hypothetical slider edits.
- Logistics-only failure and validated flip/no-flip cases.

Run checks appropriate to each change. Record actual commands/results when code exists; the scaffold's test/build scripts are not evidence that these tests already exist or pass.

## 8. Suggested 48-hour allocation

This is the source brief's planning budget, not a guarantee. Scientific data acquisition and model review may require additional time.

| Window | Focus | Exit / fallback |
| --- | --- | --- |
| H0–H4 | Sources, environment, one-site geometry | If unresolved, keep real-data status unvalidated |
| H4–H10 | Three-site horizons and environmental evaluator | Do not replace missing science with synthetic predictions |
| H10–H16 | Binding Constraint Explainer | If not correct, defer LCSS and protect core |
| H16–H24 | Scenario builder and comparison interface | Correct cards and requirement states |
| H24–H28 | Polar plot, surgery, and sampled flip | Verified flip/no-flip; core journey working |
| H28–H36 | Accepted LCSS model and integration | If incomplete, label pending and exclude logistics verdict |
| H36–H40 | Provenance, accessibility, and demo fixture | Honest classifications and reproducible outputs |
| H40–H44 | At most two stretch items | Only if core and accepted logistics are stable |
| H44–H46 | Regression checks, rehearsal, backup recording | Repeatable demo with measured performance |
| H46–H48 | Static packaging, run docs, submission materials | Completed artifact and documented limits |

Do not call the MVP complete merely because cards render. Geometry, evaluator, explanation, controls, provenance, and error handling must meet their gates.

## 9. Demonstration plan

1. Load two supported scenarios with equivalent requirements.
2. Show a verified environmental failure and measured deficit.
3. Open its horizon/timeline and plain-language explanation.
4. Apply a tested landing-time or threshold change; show the sampled flip.
5. If Tier 2 is accepted, open a verified logistics-only failure.
6. Change hypothetical ice concentration and show the calculated mass response and supported flip/no-flip.
7. Show data sources, assumptions, result identity, and limitations.

Choose demo fixtures only after calculation and verification. The dates, concentrations, durations, and flip points in the supplied narrative are proposed examples, not accepted data.

## 10. Definition of done

A ticket is done only when:

- Its linked requirements are implemented.
- Relevant inputs, versions, coverage, and units are recorded.
- Appropriate checks pass with actual evidence.
- UI values and explanations use the same evaluated result.
- Missing/uncertain data and unsupported cases remain explicit.
- Implementation notes and run instructions reflect the working state.
- Known limits and any reduced scope are recorded.

## 11. Documentation and build readiness checklist

- [x] New current requirements in PRDnew.md.
- [x] Features grouped into MVP, logistics, and stretch tiers.
- [x] Requirement-linked tickets and dependencies documented.
- [x] Acceptance checks and scientific/model gates defined.
- [x] Real-data source register, evidence rules, and acquisition tasks documented.
- [ ] Selected real assets downloaded and integrity-checked.
- [ ] Exact sites, DEM/ephemeris assets, and date coverage selected.
- [ ] Numerical tolerances/reference review accepted.
- [ ] Frontend entry and preprocessing runtime verified.
- [ ] Tier 1 implementation and acceptance complete.
- [ ] Tier 2 model and implementation accepted.
- [ ] Selected Tier 3 enhancements accepted.
- [ ] Static build and demonstration verified.

**Next coding task:** SL-01 and SL-02 foundations, followed by one-site geometry, terrain horizon, and the shared evaluator. The first feature demonstration should explain one verified environmental failure before logistics work begins.

## 12. Real-data acquisition and preparation plan

The [source register and data requirements](PRDnew.md#13-real-data-sourcing-and-collection-requirements) define the collection policy. The [supplied sourcing notes](docs/reference/user-supplied-data-sourcing-notes.txt) are preserved. Sources were checked on 14 November 2026; the files themselves have not been acquired or numerically accepted by this documentation update.

### 12.1 Acquisition tasks

These are subtasks of the existing backlog, not additional completed features. The source acquisition, pinned runtime, six-point preprocessing and coverage-safe loading are implemented. Remaining evidence/model acceptance is tracked per feature below and in docs/CURRENT_STATUS.md.

| Subtask | Parent | Collection/work | Output | Gate |
| --- | --- | --- | --- | --- |
| DATA-01 | SL-01 | Use DS-03/04/09 to select three exact covered assessment points, dates, units, and frame/height convention | Source-linked site catalog and coverage plan | Every point has a location source or declared GIS derivation; region labels are not substituted for coordinates |
| DATA-02 | SL-01/03 | Acquire DS-01 ephemeris and compatible DS-02 lunar orientation/frame/time inputs | Pinned kernel files, checksums, coverage and transformation recipe | Full mission/sweep coverage and a valid DEM-frame compatibility plan |
| DATA-03 | SL-01/04 | Acquire DS-03 elevation/metadata and needed surrounding DS-04 terrain; record available error layers | DEM assets, labels/README, masks, spatial extent | Actual point and required horizon extent covered; no unrecorded coarser substitution |
| DATA-04 | SL-01/03/04 | Obtain DS-05 reference outputs with matching observer/correction settings; define horizon reference cases | Saved queries/results, numerical reference fixtures and tolerance rationale | Comparable conventions; no unqualified validation from a visual pattern alone |
| DATA-05 | SL-12 | Extract relevant DS-06/07/08 ice evidence and scoped engineering-model references | Literature evidence table with locations, bounds, units and assumption labels | No transferred measurements, universal unverified bounds, or uncited proxy conversions |
| DATA-06 | SL-05 | Process checked source assets into horizons and Sun/Earth series; record recipe/version lineage | Versioned derived bundle and manifest | Integrity checks and source-to-output traceability pass; status remains unvalidated until numeric checks pass |
| DATA-07 | SL-11/14 | Complete numerical review, retain demo-ready bundles, and test missing-data/network behavior | Validation record, local bundle, provenance display and regeneration instructions | Real-data status correct; demo does not require live portal access; synthetic fixtures remain separate |

**Order:** DATA-01 → DATA-02 and DATA-03 → DATA-04/DATA-06 → DATA-07. DATA-05 supports Tier 2 and must not hold up the environmental core.

Start by selecting an actual point in one mapped polar product, then grow to three verified points. Use the candidate product mapping in PRDnew.md Section 13.3 to expand the catalog; the mapping itself is not a coordinate catalog. The sixth Apollo/CLPS reference needs its own compatible coordinate and terrain sources.

### 12.2 Proposed asset organization

The paths below are planned outputs; this documentation change does not create or populate them.

~~~text
data/
  raw/
    kernels/                  Pinned source ephemeris/orientation/time files
    terrain/                  Original DEMs, labels, README, optional uncertainty
  references/
    geometry/                 Saved reference requests and responses
    ice-evidence/             Scoped citations, bounds, and applicability records
  catalog/
    sites.json                Sourced or explicitly derived assessment points
  manifests/
    source-assets.json        Source IDs, paths, hashes, coverage, processing state
  derived/
    horizons/                 Per-site/observer terrain horizons and masks
    geometry/                 Time-stamped Sun/Earth records and gaps
public/
  data/                       Small accepted derived runtime bundle/manifest
docs/
  validation/                 Checks, tolerances, residuals, and limitations
~~~

Keep large raw files outside the frontend bundle. Verify usage/redistribution conditions, storage budget, and download size before acquisition. Cache source files locally; retain a documented regeneration route instead of repeatedly downloading them at application startup.

### 12.3 Minimum manifest and evidence fields

- Asset/source ID, provider/product/version, landing-point applicability, source URL, retrieval UTC, local path, file size, SHA-256, and provider checksum comparison when available.
- Spatial/temporal coverage, coordinate/projection/height conventions, units, resolution, no-data semantics, and available uncertainty.
- Processing recipe/code/library versions, sample step, horizon settings, derived-output IDs, and validation-record link.
- Ice quantity type: measured estimate, orbital proxy, upper/lower bound, inherited assumption, or user-adjusted sensitivity input; include location/depth/footprint applicability where available.
- Lifecycle state: identified → downloaded → integrity-checked → processed → numerically validated. Preserve failures and unresolved gaps instead of skipping states.

### 12.4 Implementation rules for sourcing notes

1. Use real JPL-derived geometry and real LOLA-derived terrain in the scientific demonstration. Synthetic fixtures remain useful for UI and controlled tests, with clear labels.
2. Match the terrain frame to the chosen geometry/orientation recipe; loading a newer ephemeris does not automatically transform an older terrain reference frame.
3. For a custom point, use terrain that genuinely covers it and its horizon extent. An unrelated nearest tile/site is not an acceptable replacement.
4. Keep the location-specific LCROSS anchor and the published Artemis upper-bound assumption in their proper scopes. See PRDnew.md Section 13.4 for cited interpretations.
5. Keep unknown site ice unknown. Allow explicitly hypothetical sensitivity values without converting them into a measured resource claim.
6. A library or map viewer is an access/processing tool. Cite the underlying asset and retain its metadata.
7. Do not assume event organizers will deliver a ready-to-use data package. Check actual challenge resources, then pin the files needed from the documented sources.

### 12.5 Data readiness checklist

- [x] User's sourcing notes preserved and official source pages checked.
- [x] Source-to-feature mapping and acquisition order documented.
- [ ] First assessment point and full required coverage selected.
- [ ] Compatible ephemeris, lunar orientation, constants, and time inputs acquired.
- [ ] First DEM and metadata acquired; surrounding horizon coverage confirmed.
- [ ] Download integrity and manifest fields checked.
- [ ] Independent reference settings and outputs retained.
- [ ] First derived horizon/geometry bundle generated.
- [ ] Numerical residuals accepted and result classification updated accurately.
- [ ] Ice evidence table scoped and LCSS assumptions kept distinct from measurements.
- [ ] Runtime bundle works locally without live data-service requests.

## 13. Additional-feature and data roadmap

See [PRD Section 14](PRDnew.md#14-staged-terrain-and-environmental-extensions) and the [source-backed feature review](docs/FEATURE_DATA_ROADMAP.md). The [supplied extension notes](docs/reference/user-supplied-extension-research.txt) are preserved. These extension tasks do not replace the core SL-01 through SL-16 backlog or turn every research topic into a hackathon dependency.

| Task | Timing | Dependencies / inputs | Deliverable and acceptance gate | Status |
| --- | --- | --- | --- | --- |
| EXT-01 | First terrain extension | SL-01/04/05; DS-03/04, optionally DS-11 | Source slope or derive at a declared spatial baseline; report assessment area, optional defined roughness, uncertainty, and coverage. Validate reference planes/gaps and configurable limits. | Implemented: real footprint and RMS context; propagated baseline uncertainty pending |
| EXT-02 | Core evaluator extension | SL-06/07; accepted visibility series | Longest and individual contiguous darkness/Earth-invisibility intervals; expose endpoint truncation and comparison with explicit tolerated gaps. Test interior/boundary/no-gap/missing-data cases. | Implemented: timestamped gaps and optional outage rules |
| EXT-03 | Conditional next layer | DS-10, selected site/product/time context | Acquire a small relevant Diviner product, masks, units, and metadata; show surface-temperature context. Verify no-data/unit conversion and avoid unsupported mission-time forecasts or hardware-survival claims. | Implemented: two historical Diviner bins; forecast/survival models excluded |
| EXT-04 | Optional after core | EXT-01, DS-11 where suitable, declared slope/grid/cost assumptions | Geometric connectivity/path prototype with reference terrain tests. Label unmodeled obstacles and mobility/energy assumptions; no unsupported safe-return result. | Implemented: bounded sampled graph; vehicle/energy/obstacle acceptance open |
| EXT-05 | Optical exploration delivered; thermal engineering research remains | DS-13 plus declared coating, coverage, geometry, heat and boundary assumptions | Clean/dusty equilibrium optical heat balance with laboratory endmembers, explicit nonconservative approximation and numerical fixtures. No operational thermal or mass penalty. | Implemented: optical sensitivity; coating/layer/transient validation open |
| EXT-06 | Post-acceleration ballistics delivered; PSI engineering research remains | DS-14; prescribed release conditions, grain and hypothetical assets | Spherical-vacuum trajectory and envelope entry with times/energy. No thrust-to-erosion fit, particle flux, damage probability or wait-time result. | Implemented: conditional ballistics; engine/soil/terrain acceptance open |
| EXT-07 | Orbital context and primary-proton screening delivered; full transport research remains | DS-12; PI legacy rates, NIST range/material tables, assumed monoenergetic slab | Preserve detector units/quality; compare primary CSDA range/energy and panel mass independently. Surface/human dose and secondary transport remain unassessed. | Partial: observations / CSDA model; operational dose acceptance open |
| EXT-08 | Conditional timing delivered; operational research remains | EXT-04; declared assets, availability, speed/delays and endurance/completion limits | Bounded sampled-route response/optional-return timing with explicit assumptions. No current asset means not evaluated. Vehicle, energy, communication and medical feasibility are unassessed. | Implemented: conditional timing; operational acceptance open |

### 13.1 Small first increment

1. Use the first real terrain point from DATA-01/03.
2. Select a footprint/assessment area and the slope calculation scale; record missing cells and error information.
3. Produce EXT-01 output and reference checks before adding terrain to the UI.
4. Reuse the same accepted environmental series for EXT-02, rather than collecting an unrelated generic blackout map.
5. Check one relevant DS-10 product for EXT-03, including product period and coverage, before committing to its layer.

Store extension source assets and derived outputs under the existing raw/manifest/derived organization, using the same checksum and provenance lifecycle. Source checks are not downloads or numerical validation.

### 13.2 Demonstration limits

Do not demonstrate a fixed safe slope, a universally required relay after 24 hours, a 48-hour EVA dust-clearance time, an inferred radiation-dose reduction from blocked sky, or rescue viability from ridge distance. Each would need additional validated inputs and a defined model. Keep unknown/not-evaluated states visible rather than replacing them with a plausible-looking number.

### 13.3 Approved execution order and completion tracking

1. **SL-01 through SL-05 + EXT-01:** Acquire/pin real geometry and terrain inputs. Define the assessment footprint and slope/roughness scale; retain uncertainty and coverage.
2. **SL-06/07 + EXT-02:** Implement cumulative metrics and continuous-gap records together. Explain rule shortfalls without equating geometric gaps with actual power/RF loss.
3. **SL-08 through SL-11:** Integrate comparison, surgery, separate terrain/environment findings, accessibility, and provenance.
4. **SL-12/13:** Complete and accept LCSS model definitions before numerical logistics verdicts.
5. **EXT-03:** Add temperature context only when a suitable product and interpretation are verified; do not delay the core if unavailable.
6. **EXT-04, SL-15/16:** Consider optional terrain connectivity and other stretch work after the accepted core.
7. **EXT-05 through EXT-08:** Collect applicable literature, define missing inputs/models, and record a build/defer decision. Numerical prediction remains blocked until each model is justified and tested.

Approval applies to this staged scope. It is not a completed implementation or a commitment to deliver all research models within 48 hours.

- [x] New additions included in the main PRD and feature inventory.
- [x] Dependencies, source routes, and required evidence linked.
- [x] EXT-01/02 promoted from proposals to the next required screening increment.
- [ ] EXT-01 data acquisition, method implementation, and acceptance complete.
- [ ] EXT-02 interval/rule implementation and acceptance complete.
- [x] EXT-03 suitability reviewed and historical Diviner context delivered with gaps and interpretation limits.
- [x] EXT-04 bounded geometric connectivity implemented and reference-fixture checked; vehicle-level acceptance remains open.
- [ ] EXT-05/06/07/08 research/model gates reviewed individually.

## 14. Increment 3 delivery — v3.8

See [the complete increment record](docs/SCIENCE_INCREMENT_3.md) for source metadata, scientific methods, numerical results, and validation limits.

| Sequence | Deliverable | Current state |
| --- | --- | --- |
| 1 | Compatible polar far-field terrain | Implemented to 125 km; full global/convergence acceptance remains open |
| 2 | Height-error scenarios and independent orientation cases | Source-RMS sensitivity implemented; 18 apparent-angle cases pass; correlated uncertainty remains open |
| 3 | Ranked causal explanations | Implemented; failed-rule-only scoring and independently specified fixtures verified |
| 4 | Real temperature context | Implemented from pinned Diviner PCP labels/tables; eight matches/four gaps; separate historical context |
| 5 | Reports, performance, builds | Updated and checked; actual browser/GPU/user review remains required |
| 6 | LCSS, custom-coordinate preparation, release checks | Exploratory LCSS and supported custom-point preparation implemented; accepted engineering and rendered release checks remain open |

The ticket table above distinguishes implemented code from open scientific/browser acceptance. The opt-in LCSS explorer now has a defined mathematical/accounting model and verified analytical cases; accepted numerical logistics remains disabled pending engineering calibration and applicable resource evidence. See [LCSS model and assumptions](docs/LCSS_MODEL.md).

## 15. LCSS implementation — v3.9

- SL-12: Accounting boundary, complete units/equations, provenance categories and independently calculated fixtures implemented. Independent engineering acceptance and site-applicable ice/yield remain pending.
- SL-13: Opt-in calculator, editable assumptions/budget, independent A/B hypothetical ice, contributor attribution, sampled concentration search and exact apply action implemented. Separate from final verdicts.
- Exports include model/version, input assumptions, contributors, sources, evidence categories, reference observation and `acceptedForVerdict: false`. Canonical report identity includes the exploration.
- Access: choose the Logistics inspector (circle icon), enable Explore LCSS assumptions, then adjust inputs or search. The short environmental interval and 730-day architecture remain distinct.

### Validation follow-up — 14 November 2026

[Validation report](docs/VALIDATION_REPORT.md): 113 application checks and five scientific fixtures pass; all 18 independent angle cases pass. Three custom-point completion/stale-response/coverage defects were fixed and regression-tested. A denser horizon audit for two points found maximum differences of 0.125° and 0.111°; both retain sampling-review status and uncertainty qualifications. Approved terrain tolerances, broader scientific/LCSS engineering review, and rendered browser/GPU/accessibility checks remain open. The Windows native computer-use connection failed before browser inspection.

## 16. Engineering evidence and calibration preparation — v4.3

| Work | Delivery / acceptance |
| --- | --- |
| Acquire primary engineering references | Two exact NASA PDFs pinned; acquisition verifies hashes and refuses silent replacement |
| Verify quoted values | Seven numeric transcriptions checked against source PDF pages; specification and source identities regression-tested |
| Parameter applicability | All 20 architecture inputs expose required evidence; seven have related source context, with boundary differences explicit |
| UI and reports | Logistics inspector, print report and JSON include sources, pages, hashes, parameter values and five review gates |
| Isolation and validation | No automatic source application; all parameters remain assumptions; accepted logistics remains not evaluated. 129 application checks, six scientific fixtures and seven transcription checks pass; both builds pass |
| Engineering acceptance | Open: matching water-stream/equipment/energy model, two-year operations, applicable resource evidence or explicitly hypothetical review, independent reference cases and engineering review |
| Rendered review | Supported connection retried; browser host unavailable and native pipe OS error 2. No browser/GPU/accessibility acceptance claimed |

Use `npm.cmd run engineering:acquire` and `npm.cmd run engineering:verify` to reproduce the reference evidence. [ENGINEERING_CALIBRATION.md](docs/ENGINEERING_CALIBRATION.md) defines applicability and the ordered remaining engineering work. PRD FR-G11/12 and evidence-related completion checks are updated; full scientific/engineering/browser acceptance checkboxes remain open.

## 17. Conditional rescue timing — v4.4

- [x] EXT-08 model boundary and units defined: bounded sampled path, constant outbound/loaded-return speeds, mobilization/handling, optional reversed return, total-time endurance and completion limit.
- [x] No default asset or availability; independent A/B declarations bound to mode, point/coordinates and incident start. Point/time changes require re-declaration.
- [x] Screening controls and explicit no-asset/unavailable/no-route/conditional-fit/shortfall states implemented; invalid inputs preserve settings and pending scientific work disables controls.
- [x] Arrival/completion UTC, phase timings, both margins, assumptions, route samples, qualifications and exclusions exported in JSON/print; canonical hash includes rescue exploration.
- [x] Independent 80 m arithmetic and real-terrain interaction fixtures pass. Full application suite: 135 passing checks; production/offline builds pass; four prototypes preserved. Six real-point examples retained in [RESCUE_VALIDATION.json](docs/RESCUE_VALIDATION.json).
- [ ] Operational acceptance: actual assets/capacity, vehicle/terrain mobility, energy, communications, environmental/medical constraints and independent engineering review.

[RESCUE_PLANNING.md](docs/RESCUE_PLANNING.md) documents defaults, exact equations, interpretation and verification. The feature remains `acceptedForVerdict: false`; accepted environmental and logistics decisions retain their earlier scope.

## 18. Dust/radiator optical comparison — v4.5

- [x] EXT-05 initial model defined: one-sided steady radiation balance, explicit shortwave and black sky/ground boundaries, area-weighted optics and stated nonconservative approximation.
- [x] Two primary NASA PDFs pinned; three fine-particle laboratory material rows (six optical values) verified. Custom assumed endmembers remain available with separate evidence labels.
- [x] Independent A/B enable/settings, clean/dusty K/°C, signed temperature/capacity changes, both heat margins and a 21-point coverage curve connected in Screening.
- [x] Source hashes, material specification identity, selected properties, assumptions, heat terms/residuals and exclusions retained in JSON/print; canonical hash includes the exploration. Environmental verdicts and historical Diviner context remain unchanged.
- [x] Numerical/invalid/state/source fixtures and bundled UI/loading/report cases pass. Full suite: 143 passing application checks; both builds pass; four prototypes preserved.
- [ ] Engineering acceptance: measured coating-specific response, justified layer/conduction/transient model where relevant, temperature-dependent properties, applicable thermal tests and independent review.

Reproduce source evidence with `npm.cmd run dust:acquire` and `npm.cmd run dust:verify`. [DUST_THERMAL_MODEL.md](docs/DUST_THERMAL_MODEL.md) defines equations, assumptions and acceptance limits; [DUST_VALIDATION.json](docs/DUST_VALIDATION.json) preserves illustrative results. Engine-coupled plume hazards and radiation-dose numerical models remain gated; v4.6 delivers the independent post-acceleration ballistic stage below.

## 19. Post-acceleration ejecta exploration — v4.6

- [x] EXT-06 limited delivery defined: prescribed single-grain release state, nonrotating ideal-sphere central gravity, no engine/soil/terrain/deposition/damage inference.
- [x] Three primary references pinned; two JPL Moon constants checked and converted to SI with source/specification identity retained.
- [x] Independent A/B release inputs, at most five hypothetical assets, add/edit/remove/include controls, trajectory/asset diagrams, geometric-entry times/speeds and single-grain kinetic energy implemented.
- [x] Assumptions, samples, constants, asset results and exclusions preserved in JSON/print and canonical hashing; environmental/thermal results remain separate. Pending science preparation disables input and asset actions.
- [x] Seven dedicated data/numerical/state cases and bundled UI/report flow pass. Full suite: 151 passing checks; production/offline builds pass; four prototypes preserved. Reference acquisition/transcription checks pass.
- [ ] Engine/soil acceptance: validated nozzle/thrust/descent/gas/soil case, erosion and launch distributions, plus terrain/transport/deposition and material-response reference cases before hazard or damage claims.

Use `npm.cmd run plume:acquire` and `npm.cmd run plume:verify` for pinned reference checks. [PLUME_EJECTA_MODEL.md](docs/PLUME_EJECTA_MODEL.md) documents equations and boundaries; [PLUME_VALIDATION.json](docs/PLUME_VALIDATION.json) retains hypothetical examples. Numerical integration agreement is not physical plume validation. Rendered browser/GPU review remains open.

## 20. Historical orbital radiation and primary protons — v4.7

- [x] EXT-07 bounded delivery defined: legacy orbital detector context and independent normal-slab primary-proton CSDA screening; no surface/human dose or secondary-transport inference.
- [x] Nine used sources pinned/canonicalized with request parameters retained; source contracts verify 1285 CRaTER days, flags/coverage/units/date order and 396 NIST rows across three named materials/densities.
- [x] Independent A/B archive month/detector/correction/filter and material/incident-energy/areal-density/area controls connected in Screening, with gap-preserving charts and material comparisons.
- [x] Exact endpoint/exhaustion, bracketed log-log inverse and below-table handling implemented; thickness/mass conversions and source provenance exported. Archived silicon rates never scale the proton output.
- [x] Settings/source/quality/unit records, interpolation brackets, methods and exclusions retained in JSON/print/canonical hashing; environmental/thermal decisions preserved and pending science preparation blocks input changes.
- [x] Full suite: 159 application checks and eight Python fixtures pass; production/offline builds pass, earlier prototypes preserved. Source preparation checks pass. [Example outputs](docs/RADIATION_VALIDATION.json) retained.
- [ ] Full dose acceptance: verified environment/spectra and fluence, geometry/layers, secondary/albedo transport, response/quality factors, verified units/corrections and independent reference/engineering cases. Approved OLTARIS account/solver access is not configured.

Use `npm.cmd run radiation:acquire` and `npm.cmd run radiation:prepare`. [RADIATION_MODEL.md](docs/RADIATION_MODEL.md) documents the source/model choice and why candidate OLTARIS workbook values were not used. This is a partial radiation capability, not completion of the full dose/shielding requirement.

## 21. Loaded-record landing-start windows — v4.8

- [x] FR-H6: UTC ten-minute candidates within finite loaded records; full-interval provider support, deduplicated source grids, weighted partial mission ends and all enabled nominal rules.
- [x] FR-H7: grouped consecutive sampled fits, inclusive endpoints, separate unknown/failure/excluded counts, retained uncertainty and JSON/print/canonical evidence.
- [x] FR-H8: full boundary re-evaluation, active-scenario-only application, point/requirements/source invalidation, busy controls and two-study cache.
- [x] Numerical fixtures, actual bundled UI flow, all-six-point source-backed audit and direct evaluator comparisons; `npm.cmd run start-windows:verify` retains reproducible evidence.
- [x] Current status, PRD, validation, run/review docs and production/offline packages updated; earlier prototype files preserved.
- [x] Scoped rendered desktop/narrow-screen/keyboard/GPU review through user-authorized Playwright and installed Windows Chrome; [evidence and remaining broader checks](docs/BROWSER_VALIDATION.md).
- [ ] Scientific acceptance: independent terrain/global completeness and correlated terrain/orientation uncertainty.
- [ ] Engineering acceptance: architecture-specific LCSS equipment/energy/operations/resource inputs; calibrated coating/transient, engine/soil/transport/damage, full radiation and operational vehicle/rescue models under their existing evidence gates.

[Start-window methods and results](docs/START_WINDOW_SCAN.md) record software parity separately from independent scientific validation. No additional permission is required for the authorized implementation scope; missing model evidence and unavailable UI connections remain factual acceptance limits.

## 22. Scientific and engineering evidence audit - 15 November 2026

- [x] Pin and validate 31 expanded epochs across supported years: quarterly samples, two leap days and the final 2033 ten-minute start.
- [x] Compare all six points/two targets against external geometric vectors (372 cases), retaining the original Sun/Earth thresholds.
- [x] Request independent apparent topocentric references and compare a separate CN+S validation recipe (372 cases); preserve production NONE directions.
- [x] Verify raw rows, observer/frame/time/unit contracts, source identities and current validator/report linkages. Audit 69 pinned files; retain machine-readable evidence.
- [x] Rerun six-site denser terrain sampling, seven NASA engineering transcriptions, six laboratory optical values, two JPL constants and CRaTER/NIST preparation/source contracts.
- [x] Record 168 JavaScript regression and 10 Python fixture results; retain all 20 architecture inputs as assumptions with specific evidence requirements.
- [ ] Independent physical terrain references and agreed mission-accuracy tolerances.
- [ ] Global horizon treatment and correlated terrain/orientation uncertainty.
- [ ] Architecture-matched equipment, process/peak energy, storage, 730-day operations and local extractable-resource evidence, followed by applicable engineering reference cases/review.

See [the audit report and reproduction commands](docs/SCIENTIFIC_ENGINEERING_VERIFICATION.md). Passing software/source checks is separate from closing these physical and engineering acceptance gates.


## Evidence and export reference presentation

- [x] Implement source-layer navigation/search, original source metadata and subset-aware checksums with dated validation and open acceptance gates.
- [x] Implement the five report sections and independent inclusion controls using current results.
- [x] Preserve source/mode labels and mandatory limitations; hash the selected canonical assessment and provide full-digest copy.
- [x] Retain JSON and interval CSV; add actual UTC time-series CSV and all-section browser Print/PDF.
- [x] Verify report/state isolation, source identities, hashes, CSV unknown/false semantics and responsive layouts.

[Delivery and validation](docs/EVIDENCE_EXPORT_REFERENCE_UI.md) records the rendered review and regression outcomes. Scientific engine/store and pinned data remain unchanged; full physical and engineering acceptance is separate.


## Moonquake and ground stability evidence - v4.10

- [x] Acquire/pin NASA PDS, LROC polar scarp CSV, JAXA impact SAC records and metadata; retain source hashes and reproducible acquisition/preparation.
- [x] Verify station transcriptions and decode both archived waveforms; preserve original samples, source clock conventions, magnitude scale, unlocated/alternate events and unquantified uncertainties.
- [x] Implement geographic polar/global source maps, catalog/layer controls, source inspectors and dynamic A/B nominal proximity alongside measured terrain.
- [x] Implement real waveform loading/playback/seek/window display, peak-preserving drawing and all-sample CSV; keep mission clock/results unchanged.
- [x] Integrate Seismic evidence, single-scenario reports, mandatory qualifications and canonical hash protocol 2.
- [x] Add numerical/source contracts and focused rendered tests for A/B ownership, downloads, missing/failed data, no-WebGL use and mobile-to-4K bounds.
- [ ] Future research: obtain applicable soil/ground-motion/rupture/equipment inputs and independently validate local shaking-triggered stability.

[Source methods, delivered scope and validation](docs/SEISMIC_CONTEXT.md) distinguish historical evidence screening from unimplemented predictive hazard/stability models.
