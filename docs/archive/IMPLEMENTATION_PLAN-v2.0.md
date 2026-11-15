# SiteLight AI — Implementation Plan

**Authority:** [PRD v2.0](PRD.md), 13 November 2026.  
**Status:** Ordered backlog; runtime features have not been implemented by this documentation change.  
**Working rule:** Complete each dependency and retain its acceptance evidence before marking the next scientific capability validated.

## 1. Current baseline

The repository contains a FastAPI/CopperOS integration, a custom dark dashboard, synthetic hourly visibility data, and integration tests. It has no established React build, real DEM/ephemeris preprocessing pipeline, or validated scientific bundle in the reviewed sources.

Keep the legacy demonstration labeled synthetic. Core calculations, the explainer, and robustness evaluation must work without CopperOS. A working Python preprocessing environment still needs to be established.

## 2. Ordered tickets

All tickets below are **TODO**. Estimates are planning allocations from the supplied brief, not promises or completed work.

| Ticket | Requirement | Depends on | Deliverable and acceptance evidence |
| --- | --- | --- | --- |
| SL-01 | FR-1 to FR-5, FR-9 | None | Record initial sites, coordinate/height conventions, UTC coverage, source products, numerical tolerances, and schema. Establish reproducible preprocessing environment. Retain asset manifest and reference-case plan. |
| SL-02 | FR-3 | SL-01 | Generate one site's Sun/Earth series at <=10-minute steps using pinned compatible ephemeris/orientation inputs. Compare numeric reference positions and frame/time boundaries; record residuals. |
| SL-03 | FR-4 | SL-01, SL-02 | Build 1-degree azimuth terrain horizon with coverage/no-data masks and observer settings. Validate obstruction cases; prepare three sourced sites before expanding catalog. |
| SL-04 | FR-5, FR-9 | SL-02, SL-03 | Shared deterministic evaluator with solar/Earth/overlap hours, per-rule margins, and missing/uncertain states. Test exact boundaries, disjoint availability, partial intervals, malformed inputs, and gaps. |
| SL-05 | FR-6 | SL-04 | Failed-rule deficits, relevant contiguous intervals, ranked explanations, and technical/plain-language templates. Validate three independent scenarios plus multi-failure and passing-with-gaps examples. |
| SL-06 | FR-1, FR-2, FR-8.1 | SL-04 | Static app shell with two-to-four independent scenarios, supported catalog/date controls, visible defaults, and coverage states. Unsupported custom coordinates produce no invented result. |
| SL-07 | FR-4.5, FR-6, FR-10.1 | SL-05, SL-06 | Horizon/Sun/Earth plot, interval details, and language toggle reading the same stored series/result. Verify plotted timestamps/angles and text agree with evaluator. |
| SL-08 | FR-7 | SL-05, SL-06 | Live duration/threshold/landing edits, bounded sampled flip search, snap action, immutable baseline, stale-result handling. Verify known flip and no-flip cases; measure cached update time. |
| SL-09 | FR-8, FR-9 | SL-06, SL-08 | Canonical scientific result/hash, manifest panel, printable HTML and JSON exports. Verify byte-identical results, version-sensitive identity, and reproduction from retained assets. |
| SL-10 | FR-1.1, FR-10, core gates | SL-07 to SL-09 | Expand catalog toward eight valid entries; keyboard/layout/contrast review, basic 90-second demo, static packaging, error checks, and performance record. Record reduced scope explicitly if eight cannot be validated. |
| SL-11 | FR-11.A | SL-10 | Multi-year sampled calendar using identical evaluator/settings, grid metadata and pass/known/unknown counts. Every inspected cell matches direct evaluation; avoid continuous-time/seasonal claims from coarse samples. |
| SL-12 | FR-11.B | SL-03, SL-11 | Obtain justified terrain variants/bounds, propagate through horizon and evaluator, validate sensitivity/ranges. If unavailable, ship uncertainty-not-quantified state; never synthesize confidence bands. |

## 3. Suggested implementation organization

Adapt paths during implementation while retaining these boundaries:

- Preprocessing: versioned scientific inputs, geometry generation, terrain horizons, reference validation, and bundle export.
- Shared evaluator: interval integration, rules/margins, explanations, canonical result, flip search, and epoch aggregation.
- Static client: scenario controls, comparison, plots, language templates, provenance, and reports.
- Fixtures: known geometric/obstruction cases, evaluator boundaries, failed/passing comparisons, and coverage/uncertainty cases.
- Assets: manifest and derived bundle separated from large source DEM/kernel files. Document acquisition and regeneration.

Use one numerical result path for charts and verdicts. If preprocessing/reference code and browser evaluator use different languages, prove parity with retained fixtures.

## 4. Scope guardrails

- Landing-time controls do not imply a launch/trajectory model.
- Solar eligibility is an environmental proxy; electrical power is not modeled.
- Earliest passing daily sample is not an exact continuous flip time.
- Missing data, unknown terrain uncertainty, and unsupported custom sites remain explicit.
- Never interpolate binary verdicts or silently relax requirements.
- FR-11 follows core validation. An 84-start calendar is a sampled comparison, not 84 proven landing windows or a mission-success probability.
- Preserve earlier 3D/CopperOS work as legacy functionality; neither is a dependency of the new core.

## 5. Completion evidence

Before checking off a ticket, record:

1. Files changed and the linked FR identifiers.
2. Source/input versions and supported coverage where relevant.
3. Appropriate numerical, evaluator, integration, or UI verification.
4. Actual results, remaining limitations, and classification.
5. Any reduced scope or unresolved uncertainty.

No numerical tolerances, measurements, demo results, or status changes should be invented to complete this checklist.
