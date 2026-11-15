# SiteLight AI — Product Requirements Document

**Product:** Lunar Landing Opportunity Navigator  
**Version:** 1.0 — planning draft  
**Date:** 13 November 2026  
**Basis:** Supplied Final Development Blueprint and current project sources.  
**Scope:** Product requirements and development plan; this document does not implement or certify features.

## 1. Product direction

Build one connected lunar environmental planning experience: discover site/time opportunities, explore terrain, understand Sun/Earth conditions, compare alternatives, test changes, investigate unmet requirements, and export reproducible results.

The first scientific release supports one bounded lunar south-pole region and a published UTC date range. A passing recommendation means the candidate meets explicitly evaluated environmental requirements under the documented model. It does not establish vehicle landing safety, electrical power availability, or RF link quality.

**Users:** Students, hackathon participants, researchers, and mission concept teams doing preliminary environmental screening.

**Success:** A user completes the seven-step journey, explains why a candidate qualifies or fails, investigates a schedule change, and exports a traceable result. The core journey works with CopperOS disconnected.

## 2. Current state

Source review covered README.md, static/dark.html, sitelight/mission.py, and sitelight/main.py. Runtime and scientific validation were not performed for this PRD.

| Area | Existing prototype | Required scientific state |
| --- | --- | --- |
| Explorer | Stylized terrain and imaginary candidates | Georeferenced supported terrain |
| Sun/Earth analysis | Illustrative charts; synthetic hourly binary flags | Validated terrain-obstructed geometry |
| Finder | Illustrative ranking and sample alternatives | Explicit constraint search within declared bounds |
| Comparison/what-if | Synthetic screening and illustrative controls | Shared scientific evaluator |
| Safeguard | Example checks and sample status-change search | Traceable violations, uncertainty, alternatives |
| Reports | Demonstration JSON export | Reproducible evaluation and provenance |
| CopperOS | Optional read-only research; in-memory approvals | Preserve optional use; durable records if extended |
| Evidence Coverage | No experiment established | Test against a conventional checklist |

Synthetic mode must remain visibly labeled and separate from scientific mode. Current terrain, scores, fractions, tilt effects, and position-offset formulas are not scientific implementation.

## 3. Feature register

| ID | Feature | Priority | Release |
| --- | --- | --- | --- |
| F01 | Interactive 3D Moon Explorer | P0 | Core |
| F02 | Sun & Earth Horizon Observatory | P0 | Core |
| F03 | Smart Landing Opportunity Finder | P0 | Core |
| F04 | Mission Comparison | P0 | Core |
| F05 | Mission What-If Simulator | P0 | Core |
| F06 | Mission Safeguard | P0 | Core |
| F07 | Reproducible Mission Report Export | P0 | Required workflow support |
| F08 | Scientific Evidence Coverage | P1 | Conditional experiment |
| F09 | CopperOS Evidence Research and Monitoring | P2 | Optional |

F01–F06 are the blueprint's six essential capabilities. F07 makes its Export step explicit. No feature is marked scientifically complete by this document.

## 4. Shared planning rules

Mission inputs: supported region/sites, UTC landing time or search interval, temporal search step, surface duration, observer height, enabled constraints, and ranking preferences. Display defaults and model assumptions.

Support minimum sunlight fraction, minimum geometric Earth-visible fraction, maximum continuous darkness, and minimum continuous Earth-visible interval. Define whether an interval rule requires at least one qualifying interval or another explicit schedule. Optional checks include simultaneous Sun/Earth availability and slope at a documented spatial scale/footprint.

Apply hard constraints before preference ranking. Separate fractions do not imply simultaneous coverage. Mission-type labels cannot silently activate hardware assumptions.

| State | Meaning |
| --- | --- |
| Pass | All enabled requirements have sufficient inputs and meet their rules |
| Fail | At least one known violation; missing/uncertain checks remain visible |
| Insufficient data | No established violation, but required inputs/coverage are missing |
| Uncertain | No established violation, but uncertainty prevents a decision |
| Not evaluated | Check unsupported or outside the requested model |

Only candidates passing every enabled hard requirement enter the passing shortlist. Disabled or unassessed checks do not count as passed.

## 5. Scientific foundation

- **SCI-01 Terrain:** Record the exact NASA LOLA-derived product, source/version, retrieval date, hash, coverage, resolution, units, projection, lunar frame, height reference, and no-data mask.
- **SCI-02 Geometry:** Select a documented SPICE or JPL Horizons workflow. Pin kernels/query parameters, versions, frames, observer definition, time conversions, and coverage. Choose an appropriate independent cross-check.
- **SCI-03 Coordinates:** Define longitude direction/range, latitude convention, local axes, azimuth/elevation, and observer height; reject incompatible inputs.
- **SCI-04 Horizon:** Document ray extent, sampling, curvature assumptions, DEM edges/gaps, body-center/limb rule, and Earth visibility approximation.
- **SCI-05 Time:** Use UTC inputs/outputs with documented ephemeris conversion. Define intervals as [start, end). Publish sample step, transition refinement, and event precision.
- **SCI-06 Metrics:** Derive fractions, durations, darkness, continuous intervals, and joint availability from one series. Weight variable steps by duration.
- **SCI-07 Uncertainty:** Separate input uncertainty, missing coverage, approximations, and validation residuals. State unavailable uncertainty; do not invent confidence percentages.
- **SCI-08 Validation:** Approve quantitative geometry, horizon, event-time, and metric tolerances before release. Include independent reference cases, transitions, frame/time conversions, terrain edges, and missing data.
- **SCI-09 Reproduction:** Identify/cache results by normalized inputs, dataset/model versions, and algorithm version. Invalidate changed results without overwriting history.
- **SCI-10 Limits:** Sunlight is not electrical power, Earth visibility is not an RF link budget, and terrain screening is not vehicle safety.

## 6. Features, one by one

### F01 — Interactive 3D Moon Explorer

**Priority:** P0.  
**User need:** Inspect a candidate in real terrain context.  
**Inputs:** Supported DEM, coordinates, selected UTC time, available evaluated overlays.

**Requirements**

- F01.1 Render georeferenced terrain with orbit, zoom, reset, and candidate selection.
- F01.2 Show coordinates, elevation, source resolution, and slope with calculation scale.
- F01.3 Provide elevation, slope, and evaluated illumination layers with units/legends.
- F01.4 Synchronize site/time with charts, analysis, and reports.
- F01.5 Disclose display simplification/exaggeration; keep analysis terrain separate.
- F01.6 Show boundaries/no-data areas and block unsupported evaluations.
- F01.7 Provide a 2D/table fallback when 3D is unavailable.

**Acceptance:** Reference coordinates align within a documented display tolerance; selection updates linked views consistently; exaggeration leaves metrics unchanged; gaps remain visible; fallback exposes candidate details.

**Dependencies:** Terrain/coordinate foundation; F02 for illumination.

### F02 — Sun & Earth Horizon Observatory

**Priority:** P0.  
**User need:** Understand terrain-obstructed sunlight and geometric Earth visibility.  
**Inputs:** Site, observer height, UTC interval, terrain horizon, ephemerides, model settings.

**Requirements**

- F02.1 Calculate Sun/Earth azimuth/elevation using the agreed frame/time contract.
- F02.2 Calculate local terrain horizon and obstruction using the declared visibility rule.
- F02.3 Plot Sun/Earth paths and horizon on a skyplot.
- F02.4 Show sunlight, Earth, and simultaneous-availability timelines.
- F02.5 Report fractions/durations, longest darkness, continuous intervals, and transitions.
- F02.6 Show provenance, coverage, sampling, assumptions, uncertainty, and validation.
- F02.7 Treat missing coverage and unresolved boundaries as insufficient/uncertain.

**Acceptance:** Independent geometry/event cases pass approved tolerances; a known obstruction matches its reference; timeline and evaluator metrics agree; gaps never yield passing results; displayed precision matches computation.

**Dependencies:** SCI-01 through SCI-10.

### F03 — Smart Landing Opportunity Finder

**Priority:** P0.  
**User need:** Find site/time combinations meeting explicit requirements.  
**Inputs:** Catalog/grid, UTC search range/step, surface duration, constraints/preferences.

**Requirements**

- F03.1 Search the declared supported domain using the shared evaluator.
- F03.2 Evaluate the complete surface interval for every candidate start.
- F03.3 Filter hard constraints, then rank with transparent preferences/tie-breaking.
- F03.4 Return coordinates, UTC times/windows, values, thresholds, margins, and evidence.
- F03.5 Distinguish sampled passing starts from continuously established windows; never bridge unevaluated gaps.
- F03.6 Publish search bounds/resolution and exclusions; best means best within this search.
- F03.7 Provide progress/cancellation and distinct no-match, missing-data, and error states.
- F03.8 Never silently relax requirements.

**Acceptance:** Every passing result meets all enabled rules for its full duration; repeated versioned inputs give identical order; known no-match cases return none; opening results preserves assumptions.

**Dependencies:** F02, shared evaluator/cache, slope data if enabled.

### F04 — Mission Comparison

**Priority:** P0.  
**User need:** Compare competing site/date scenarios consistently.  
**Inputs:** Two to four evaluated scenarios and a baseline.

**Requirements**

- F04.1 Compare sunlight, darkness, Earth visibility, joint availability, slope, rule states, uncertainty, and coverage.
- F04.2 Show absolute values and baseline differences in consistent units.
- F04.3 Default to common duration/constraints/assumptions; flag intentional differences.
- F04.4 Show data/model versions; re-evaluate under common settings or mark incompatibility.
- F04.5 Explain preference rankings without safety/success probabilities.
- F04.6 Preserve scenarios across what-if, Safeguard, and export.

**Acceptance:** Self-comparison gives zero differences; incompatible scenarios are disclosed; unknown values stay unknown; metrics match their evaluation records.

**Dependencies:** F02, shared scenario model; F03 supplies discovered candidates.

### F05 — Mission What-If Simulator

**Priority:** P0.  
**User need:** Change date/time or location and inspect requirement changes.  
**Inputs:** Immutable baseline and proposed supported inputs.

**Requirements**

- F05.1 Edit UTC time, site/coordinates, duration, and thresholds.
- F05.2 Re-evaluate through the same scientific pipeline and highlight input differences.
- F05.3 Show baseline/proposed timelines, metric differences, and rule changes.
- F05.4 Preserve baseline; allow reset or saving an alternative.
- F05.5 Find the first sampled violation within a declared time-shift range; disclose earlier uncertainty/gaps and event brackets/refinement precision.
- F05.6 Show cached/pending/complete/stale/error states; only the newest request updates active results.
- F05.7 Recalculate terrain/horizon for moved locations; validate/disclose any interpolation.
- F05.8 Remove illustrative tilt/position penalties from scientific mode until supported models exist.

**Acceptance:** Unchanged proposals reproduce baseline; known transitions identify the correct rule/interval; unsupported locations never produce invented results; rapid edits cannot show stale results as current.

**Dependencies:** F02/F04 and shared evaluator/cache.

### F06 — Mission Safeguard

**Priority:** P0.  
**User need:** Understand failures/uncertainty and investigate evaluated alternatives.  
**Inputs:** Evaluation, rules/margins, coverage, uncertainty, alternative-search bounds.

**Requirements**

- F06.1 List explicit check states, including not evaluated for unsupported checks.
- F06.2 Explain metric, threshold/operator, violating interval, and limitations.
- F06.3 Distinguish violations, missing evidence, uncertainty, and unsupported assessments.
- F06.4 Suggest nearby sites/times only after checking the same requirements.
- F06.5 Disclose search bounds and when no passing alternative exists.
- F06.6 Link to terrain, timelines, source metadata, and what-if breakpoints.
- F06.7 Ground explanations in structured outputs; optional language-model text cannot calculate or override decisions.
- F06.8 Use meets evaluated requirements or further verification needed; never absolutely safe.

**Acceptance:** Explanations match evaluator values/rules; missing data cannot become positive assessment; alternatives reproduce; descent, power, and RF checks remain unassessed without models.

**Dependencies:** F02/F03/F05.

### F07 — Reproducible Mission Report Export

**Priority:** P0; required workflow support.  
**User need:** Share an inspectable, reproducible scenario.  
**Inputs:** Completed scenario/evaluation, comparisons, provenance, evidence references.

**Requirements**

- F07.1 Export JSON and a readable report suitable for browser printing.
- F07.2 Include IDs, generation time, coordinates/frame, UTC interval, constraints, observer/model settings, and numerical resolution.
- F07.3 Include metrics/intervals, decisions/margins, uncertainty/gaps, differences, and search bounds.
- F07.4 Include source/product/kernel references, hashes, build/model version, validation record, and reproduction instructions.
- F07.5 Separate hypothetical scenario origin, source-review status, and scientific validation; none implies mission approval.
- F07.6 Include limitations; exclude credentials and unrelated raw research.
- F07.7 Export immutable completed snapshots; pending/stale results cannot appear final.

**Acceptance:** Export matches the completed view; retained assets/versions reproduce results within tolerance; missing findings, limitations, and synthetic classification survive export.

**Dependencies:** Shared scenario/provenance and F02–F06. Dedicated PDF generation may follow later.

### F08 — Scientific Evidence Coverage

**Priority:** P1; conditional experiment.  
**User need:** See where available evidence stops supporting the planning question.

**Experiment:** Compare with a conventional data-quality checklist on identical complete, missing-terrain, elevated-uncertainty, partial-footprint, and unsupported-safety cases. Counterbalance task order. Measure correct gap detection, missed gaps, false reassurance, task time, and user explanations.

Proposed pilot gate: at least eight representative users, 20% fewer missed evidence gaps, no increase in false reassurance, and no more than 10% increase in median task time. Approve these hypotheses before testing; record uncertainty and qualitative findings. A small pilot does not establish broad effectiveness or novelty.

**Requirements if retained**

- F08.1 Show separate sunlight geometry, terrain coverage/uncertainty, footprint, and vehicle-descent evidence dimensions.
- F08.2 Trace statuses to sources, applicable scope, and next verification actions.
- F08.3 Define available, missing, uncertain, partially assessed, and not evaluated.
- F08.4 Never infer complete footprint or vehicle safety assessment without supporting models.
- F08.5 Separate evidence coverage from physical compliance and source approval.
- F08.6 Avoid composite certainty scores without a separately validated method.

**Acceptance:** All statuses are traceable; unsupported safety is not evaluated; experiment findings and release/defer decision are recorded. Defer if usefulness beyond the checklist is not demonstrated.

**Dependencies:** F06/F07 provenance, prepared cases, representative participants.

### F09 — CopperOS Evidence Research and Monitoring

**Priority:** P2; optional.  
**User need:** Collect published agency updates and review changed evidence.  
**Inputs:** Approved official URL/topic, snapshots, extracted claims, review decisions.

**Requirements**

- F09.1 Collect URL, exact excerpt, retrieval time, published metadata when available, and candidate claims through read-only research.
- F09.2 Require human review of original sources before applying claims to scenario inputs.
- F09.3 Preserve exact/approximate/date-only precision; never invent a UTC hour.
- F09.4 Compare snapshots and flag changed, removed, inaccessible, or conflicting claims.
- F09.5 Preserve review history and links between source versions, decisions, and scenarios.
- F09.6 Updates cannot silently overwrite approved inputs or historical reports.
- F09.7 Keep credentials backend-only, restrict sources, and treat extraction as untrusted.
- F09.8 Recover from broker failure while retaining manual review and core calculations.
- F09.9 Exclude orbital calculations, numerical recommendations, safety judgments, mission control, and continuously running agents.

**Acceptance:** Core journey works offline from CopperOS; unreviewed claims cannot alter scenarios; date-only evidence cannot become a published exact timestamp; updates preserve history; secrets never enter frontend/export payloads.

**Dependencies:** Existing connector/review flow; durable storage before persistent monitoring. Scheduled monitoring is deferred.

## 7. Complete user journey

| Step | Action | Outcome |
| --- | --- | --- |
| Discover | Confirm coverage/requirements | Explainable shortlist or no-match/data-gap state |
| Explore | Inspect candidate terrain | Georeferenced context and linked UTC |
| Understand | Inspect skyplot/timelines | Geometry, obstruction, metrics, assumptions |
| Compare | Select alternatives | Consistent trade-offs |
| Stress-test | Edit time/location | Re-evaluation and requirement changes |
| Investigate | Open Safeguard | Violations, uncertainty, supported alternatives |
| Export | Download completed result | Reproducible JSON/readable report |

Reuse Discover, Analyze, Simulate, Safeguard, and Report navigation where suitable. Keep classification, coverage, and calculation status visible. Initial candidates must use a documented default scenario with visible requirements and result version; users confirm/edit it before treating it as mission-specific.

## 8. Proposed technical design

Target choices are planning recommendations; dependencies/hosting have not been independently verified for this PRD.

| Layer | Proposed choice |
| --- | --- |
| Frontend | React, TypeScript, Tailwind CSS; incremental migration |
| 3D | Three.js; separate display mesh/analysis DEM |
| API | Python, FastAPI; reuse backend shell |
| Terrain | Selected NASA LOLA-derived product |
| Geometry | SPICE or JPL Horizons; select primary method in M1 |
| Processing | NumPy, SciPy, Rasterio as needed |
| Charts | Plotly or suitable lightweight library |
| Storage | Versioned assets/cache and scenario/evidence records |
| Deployment | Vercel or another frontend host plus separate API |
| Research | Optional CopperOS connector |

**Pipeline:** Versioned inputs → coordinate/time normalization → terrain horizon → geometry/visibility → shared constraint evaluator → search/comparison/what-if → explanations → reports.

Precompute supported horizons/series and cache evaluations by inputs/versions. Dashboard-specific formulas cannot replace the evaluator. A frontend rewrite is not required before the science spike.

### Minimum data/API contracts

| Record | Required content |
| --- | --- |
| Dataset | Source/version/hash, retrieval time, frame/units, coverage, resolution, uncertainty/gaps |
| Site | ID, coordinates, terrain/horizon references, observer height, optional footprint |
| Scenario | ID, UTC interval, site, duration, rules/preferences, origin, versions |
| Evaluation | Immutable snapshot, values/intervals, decisions/margins, uncertainty, provenance, validation reference |
| Search | Domain, steps, constraints, ranking/tie-break rules, progress/exclusions |
| Evidence | URL/excerpt/snapshot hash, time, precision, review history, linked scenarios |
| Validation | References, tolerances/rationale, residuals, failures, reviewer/date |

Retain compatible health/evidence endpoints. Define versioned APIs for coverage, sites/terrain, evaluation, search jobs, comparison, what-if/breakpoints, and export during M1–M2. Include evaluation IDs, classification, versions, and structured errors. Separate or version the existing synthetic /api/mission/compare; never relabel its current results as scientific predictions.

## 9. Quality and release gates

**Proposed performance targets:** On an agreed benchmark device/network and bounded catalog, cached evaluation/what-if p95 at most 2 seconds, bounded search p95 at most 10 seconds, and usable explorer within 5 seconds. Longer uncached work shows status/cancellation. These are targets, not current measurements.

Record benchmark scope, time step, catalog size, network, and cache state. Prefer bounded scope/precomputation over undisclosed scientific simplification.

**Verification**

- Unit: frames/time, horizon comparisons, interval weighting, thresholds, missing data, ranking.
- Independent science: geometry, obstruction, transition times, and metrics within approved tolerances.
- Integration: identical scenario values across finder, comparison, what-if, Safeguard, and export.
- Failure: unavailable assets, invalid UTC, unsupported coverage, cancellation, stale results, incompatible versions, broker failure.
- Workflow: complete all seven steps and explain a known violation and evidence gap.
- Accessibility: keyboard controls, labels, readable legends, text states alongside color, data tables.

**Core release gates**

1. Publish coverage and model assumptions; record source usage conditions/provenance.
2. Approve numerical tolerances and pass required reference cases with recorded residuals.
3. Resolve frame/time/coverage/classification defects affecting passing decisions.
4. Pass P0 acceptance criteria; disclose unsupported assessments.
5. Reproduce a complete evaluation from export and retained assets.
6. Complete the core journey with CopperOS unavailable.
7. Measure performance/accessibility and document accepted limitations.

## 10. Development plan

Preserve the blueprint's eight milestones. Calendar estimates depend on the initial science spike, team capacity, and submission deadline. All milestones are currently **not yet accepted** under this PRD; existing synthetic functionality does not complete scientific milestones.

| Milestone | Deliverables | Features | Exit criterion |
| --- | --- | --- | --- |
| M1 — Verified data foundation | One region/date range, real DEM, pinned geometry, frame/time contract, reference cases | Foundation | Real-site geometry reproducible; provenance complete; tolerances approved |
| M2 — Horizon and visibility | Terrain horizon, Sun/Earth series, interval metrics, uncertainty/gaps, cache | F02 | Independent cases pass approved numerical tolerances |
| M3 — Real terrain explorer | Georeferenced terrain, markers, overlays, linked UTC, fallback | F01 | Correct source-region display and consistent F02 results |
| M4 — Opportunity finder | Bounded search, constraints, ranking, explanations | F03 | Passing/failing/no-match/missing-data cases pass |
| M5 — Comparison and what-if | Baseline/proposal, time/location edits, breakpoint search | F04/F05 | Cross-view consistency and known transitions pass |
| M6 — Safeguard and reports | Explanations, evaluated alternatives, reproducible export | F06/F07 | Seven-step journey and reproduction pass; core gates met |
| M7 — Evidence Coverage experiment | Checklist comparison and findings | F08 | Experimental gate assessed; release/defer decision recorded |
| M8 — Optional CopperOS support | Durable review, snapshot changes, resilient integration | F09 | Review controls pass; core remains independent |

### Immediate M1 backlog

- [ ] Choose region and small real-coordinate candidate catalog.
- [ ] Choose supported UTC dates and benchmark search size.
- [ ] Obtain exact DEM/metadata; record version/hash.
- [ ] Choose and pin geometry inputs.
- [ ] Define lunar frame, height reference, observer height, angles, and time conversion.
- [ ] Define visibility rule, sample step, and transition refinement.
- [ ] Produce one reproducible real-site geometry result with provenance.
- [ ] Assign qualified reviewer; approve references and tolerances.
- [ ] Publish supported limits before exposing scientific recommendations.

**Sequencing:** Validate the evaluator before replacing illustrative rankings. Use one scenario/provenance model. Optional evidence views and automation must not delay core science.

## 11. First-release exclusions

- Autonomous rover/spacecraft control.
- Full trajectory, descent, propulsion, engine-failure, or touchdown dynamics.
- Vehicle safety certification, battery/power simulation, or RF link budgets.
- Speculative ice extraction and unsupported science-target scoring.
- Full-Moon coverage, unsupported dates, or precision beyond the validated model.
- Continuously running agents or automatic application of scraped claims.
- Unverified novelty, agency endorsement, or challenge-compliance claims.

The supplied blueprint references Space Apps research and an official challenge. Current winners, rules, and comparative product claims were not independently verified for this PRD. Confirm the exact challenge/year before submission-specific claims.

## 12. Open decisions and risks

| Decision/risk | Impact | Required action |
| --- | --- | --- |
| Region/product/dates/catalog undecided | No reproducible scope | Resolve in M1 |
| Geometry method/frame/coverage undecided | Inconsistent calculations | Define in M1 |
| Reviewer/tolerances unassigned | Scientific acceptance blocked | Assign/approve before M2 acceptance |
| Terrain scale differs from footprint needs | Misleading suitability | Publish scale limits; mark unassessed |
| Events exceed sample precision | Wrong window boundaries | Validate refinement and disclose brackets |
| Stale caches/responses or mixed versions | Mismatched results | Version keys; reject stale responses |
| Search bounds/ranking unclear | Sampled best mistaken for global optimum | Display domain, resolution, method |
| Libraries/hosting unverified | Deployment/performance delays | Verify compatibility and benchmark |
| Evidence view adds no value | Scope expands unnecessarily | Enforce experiment/defer gate |
| Staffing/budget/deadline unknown | Dates unreliable | Confirm before calendar scheduling |

## 13. Completion checklist

- [ ] Scientific foundation accepted against approved tolerances.
- [ ] F01 — Interactive 3D Moon Explorer accepted.
- [ ] F02 — Sun & Earth Horizon Observatory accepted.
- [ ] F03 — Smart Landing Opportunity Finder accepted.
- [ ] F04 — Mission Comparison accepted.
- [ ] F05 — Mission What-If Simulator accepted.
- [ ] F06 — Mission Safeguard accepted.
- [ ] F07 — Reproducible Mission Report Export accepted.
- [ ] Core release gates passed.
- [ ] F08 — Experiment complete; release/defer decision recorded.
- [ ] F09 — Optional integration accepted or explicitly deferred.

**First development target:** Real terrain plus validated Sun/Earth horizon calculations. Recommendations, comparisons, what-if analysis, and safeguards depend on this foundation.
