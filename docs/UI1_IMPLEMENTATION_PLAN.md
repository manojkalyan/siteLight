# UI 1 implementation and validation plan

15 November 2026. **Implemented:** [UI 1 release and validation](UI1_RELEASE.md) records delivered behavior and verification. The phase descriptions below preserve the migration plan; the release record states actual scope and remaining review limits.

Requirements authority: [PRDnew.md](../PRDnew.md). Visual direction: [12-screen UI 1 gallery](ui-concepts/ui1-full-design-2026-11-15/README.md). Scientific boundaries: [terrain and NASA reference increment](TERRAIN_REFERENCE_INCREMENT.md).

## Outcome

Implement the approved UI 1 design across the existing application, with every metric, chart, timeline, geometry marker and export connected to its applicable source or calculation. Deliver the four main tabs, six Screening sections, mission settings, scheduling and reporting. Use incremental integration, numerical parity and browser checks to detect regressions before switching the default interface.

The generated images establish hierarchy, materials and layout. Their example numbers, plot shapes, map scales, locations, routes and rendering detail are not scientific inputs or acceptance fixtures. The implemented interface must follow actual results even when that differs from a mockup.

## Existing foundation and constraints

- `src/workspace/store.mjs` already owns scenarios, requirements, provider/result caching, data loading and exploratory models. Preserve this calculation boundary.
- `src/workspace/engine.mjs`, `real-data.mjs`, `terrain-evidence.mjs` and individual research-model modules provide the results. Panels consume them rather than duplicating formulas.
- `src/workspace/main.mjs` currently combines the application shell, event delegation, fixed DOM IDs, re-rendering, async operations, reports and animation. Extract these responsibilities in small verified changes before redesigning their markup.
- `src/workspace/viewport.mjs` already uses Three.js, real local DEM heights, geometric Sun/Earth directions in terrain mode, reduced motion and context recovery. Keep one viewport mounted and add explicit lifecycle management before introducing additional 3D views.
- Current recorded baseline: **179 JavaScript, 14 Python and 13 Chrome/GPU checks**, 681 retained source records and 270 start-scan/evaluator comparisons. These are the previous recorded results in [the verification summary](ACCEPTANCE_VERIFICATION_SUMMARY.json), not tests rerun for this planning document.
- Retain the existing ES-module/Vite architecture for this migration. A framework rewrite is outside this plan.

## Navigation and screen mapping

| Destination | Screens and behavior | Existing source of behavior |
| --- | --- | --- |
| Explore | Moon/terrain, A/B selection, floating mission summary, horizon/skyplot drawer, time-to-set and timeline | `viewport.mjs`, `charts.mjs`, `engine.mjs`, workspace providers/results |
| Mission settings sheet | Site/custom coordinates, UTC, duration, observer height, thresholds, optional outage limits, data mode, Apply/Cancel | Store validation, `updateAsync`, coverage client and custom preparation |
| Compare / Overview | A/B criteria, deficits, binding constraints, UTC interruption intervals, tested date preview and apply | Existing comparison/explanation and alternative-date functions |
| Compare / Schedule | Loaded ten-minute starts, rechecked selection, daily previews and separate 84-start monthly study | `calendar-view.mjs`, `start-windows.mjs`, `monthly.mjs` |
| Screening / Terrain | Footprint controls, slope, roughness, coverage, sampled connectivity/routes, uncertainty and stereo context | `realTerrainScreen`, `terrainRoute`, terrain evidence and sensitivity |
| Screening / Logistics | LCSS assumptions and budget exploration; separate published NASA reference case | `logistics.mjs`, `logistics-view.mjs`, `nasa-reference.mjs` |
| Screening / Thermal & dust | Historical Diviner context and separate device/radiator optical sensitivity | Thermal context and dust model/view modules |
| Screening / Plume | Declared release state, idealized trajectories, hypothetical asset envelopes and geometric crossings | Plume model/view and asset operations |
| Screening / Radiation | CRaTER archive, source flags, sky geometry and separate NIST primary-proton comparison | Radiation model/view and `skyContext` |
| Screening / Rescue | Declared asset availability, sampled route, delays, return and conditional timing | Rescue model/view and site/start scope validation |
| Evidence | Source list/details, validation records, scope and remaining acceptance limits | Retained manifests, coverage records and evidence modules |
| Export sheet / report | Scenario review, provenance, canonical JSON hash, interruption CSV and print/PDF | Workspace serialization and existing report/export functions |

Calendar moves under Compare. Report opens from Export. Existing plain/technical explanations, guide, all six catalog points and supported custom-point preparation remain reachable even when the simplified mockup does not show them permanently.

## Data and interaction contracts

1. **One committed scenario state.** Read all displayed inputs/results from the same committed state and applicable provider. Associate pending work with the selected scenario, point, requirements and data identity. Ignore superseded responses.
2. **Draft mission settings.** The sheet edits a validated draft. Cancel discards it. Apply prepares required real coverage and commits through the existing transaction only after success. On failure, preserve the previous covered scenario, values and results together.
3. **Explicit update behavior.** Cheap display-only changes update immediately. Sliders update their draft value immediately; expensive calculations run on release/commit or bounded debouncing. Show pending state instead of presenting an old result as the outcome of new inputs.
4. **Preserve A/B boundaries.** Shared environmental requirements apply to both scenarios; A/B dates/sites and applicable model assumptions remain independent according to the existing store. Cosmetic navigation and camera changes do not change scientific inputs.
5. **No calculation in presentation templates.** Use results/selectors for availability, gaps, deficits, mass contributors, sensitivity and model outputs. Derive units and percentage formatting consistently. Plot actual intervals, missing samples and coverage.
6. **Source values retain their meaning.** The NASA reference is a read-only published case. Diviner/CRaTER remain historical. Hypothetical ice and hardware parameters stay assumptions. Real, JPL-reference and Sample modes never silently substitute for one another.
7. **Truthful missing states.** Distinguish initial loading, preparing coverage, valid zero, unavailable coverage, failed request, disabled model and unassessed quantity. Keep controls/retry usable and prevent stale or malformed data from replacing a valid result.
8. **Studies remain applicable.** Invalidate or clearly mark cached date/monthly studies when point, requirements, source identity or coverage changes. Apply a proposed start only after re-evaluation. Rescue declarations remain bound to their site/start.
9. **Preserve export semantics.** The existing CSV contains interruption intervals; label it accordingly. A full time-series CSV would be a separate implementation with explicit columns/tests. JSON retains complete calculation inputs/provenance and its canonical hash; optional print sections cannot erase required qualifications or misrepresent hash coverage.

## Implementation phases and completion gates

| Phase | Work | Required completion evidence |
| --- | --- | --- |
| 0. Baseline and recovery path | Verify the current recorded baseline; capture same-input scenario/report fixtures, source identities and performance. Establish a recoverable classic entry before changing the default. | Baseline commands pass in the working environment; recovery entry and builds are usable. No unrelated user changes overwritten. |
| 1. Presentation separation | Extract view rendering, actions, report construction and visual navigation from the main entry. Introduce proposed `ui/` modules and shared design tokens without changing formulas or swapping the visible layout yet. | Existing behaviors and calculation snapshots match; no new duplicate listeners, viewport instances or IDs. |
| 2. UI 1 shell and mission sheet | Four-tab navigation, Screening subviews, floating panels, shared controls, semantic statuses, focus management and draft Apply/Cancel. Keep the classic path available. | All destinations reachable; keyboard navigation and modal focus work; cancellation, validation and failed-load preservation pass. |
| 3. Explore and 3D | Recompose the existing viewport, summary, horizon/skyplot drawer and timeline. Add source-aligned overlays and measured rendering polish. | Same selected site/time drives markers, charts and summary; overlays pass coordinate/scale checks; no-WebGL and context recovery work. |
| 4. Compare and Schedule | Reuse the tested explanation/search, sampled starts and monthly logic in the new layout. Display actual deficits and interruption times. | A/B isolation, preview/cancel/apply, stale-study invalidation and monthly/scanner parity pass through the new navigation. |
| 5. Six Screening sections | Move existing controls/results into focused subviews. Add 3D annotations only where the current model supplies the required geometry. Implement configurable ensemble evaluation as a separately verified addition described below. | Inputs change applicable outputs and preserve unrelated scenario/environmental results. Source scope, units and disabled/missing states remain visible. |
| 6. Evidence and reporting | Source browsing, validation/limits views, report preview and real JSON/CSV/print actions. Remove stale labels or metadata exposed by the new presentation. | Downloaded values match current results; canonical hash recomputes; source/model identity and limitations survive export. |
| 7. Responsive, performance and release review | Finish phone/tablet layouts, keyboard/accessibility review, visual inspection and production/offline builds. Switch the default only after completion gates pass. | Full behavioral/numerical suite, final screenshot review, performance report and headed Windows GPU review recorded for the migrated build. |

Each phase is a reviewable increment. Fix a failed gate before proceeding to the next dependent phase. Do not replace the whole UI in one unverified change.

## 3D implementation rules

- Preserve measured DEM heights and their units, projection scale, polar-grid convergence and local ENU mapping. Define one explicit world-unit conversion for mesh vertices, footprint radius, route coordinates and annotations.
- Replace the current decorative fixed-size ring with an actual settings-derived footprint overlay. Draw slope cells and sampled routes from the evaluated grid and route graph, with coverage/missing cells preserved.
- Material grain and normal detail may improve appearance, but must be qualified as visual detail and must not create measured boulders or change scientific elevations/slope calculations. Resolve actual geometry only to the source-supported scale.
- Local Sun/Earth markers and terrain light direction use the same selected-time geometry as the charts. Globe studio lighting and texture/pin registration remain labeled illustrative unless their replacement is separately mapped and checked.
- Plume arcs visualize the existing ideal-sphere model; a DEM backdrop does not imply terrain collision, erosion or engine/soil coupling. Rescue overlays visualize the sampled route and declared asset context, not a validated vehicle path.
- Add viewport `resize`, active/visible state and `dispose` contracts: release observers, listeners, animation callbacks, textures, geometry and renderer resources appropriately. Avoid remounting on ordinary form/tab changes. A globe inset must not create an uncontrolled second full renderer.
- Use bounded pixel ratio, geometry/shadow quality settings, render-on-demand when idle and reduced-motion behavior. Provide a solid-panel alternative if backdrop filtering or GPU capacity is limited.
- The image concepts are a quality reference. Browser rendering must be assessed against its real data and GPU budget rather than adding invented terrain to imitate a Blender render.

## Configurable correlated-terrain analysis

The current 100-member-per-point ensemble bundle is prepared for a **100 m radius, 20 m slope baseline and 12 degree slope limit**. Changing the visible controls must not relabel those stored ranges as freshly calculated uncertainty.

For the fully dynamic local app, add a bounded local computation request using the retained real clone windows and the existing verified footprint method. Validate coordinate/source identity and supported settings; cache by point, radius, baseline, limit, source/window hashes and algorithm version. Return actual member count, empirical quantiles, provenance and applicability metadata. Include these results and settings in report/hash coverage and add numerical/API/state tests before enabling the feature.

Offline delivery uses only loaded supported results. If the needed clone data/computation is unavailable, retain a clearly labeled reference-footprint result or show that the requested ensemble has not been evaluated. Never generate synthetic uncertainty to fill the gap. Full global/orientation covariance and physical acceptance remain separate gates.

## Verification strategy

### Preserve and extend behavior

- Same-input calculation parity across old and new presentation: both scenarios, all six catalog points, supported custom points, default and changed thresholds, fractional mission ends and all data modes.
- Future-date loading, request failure, delayed/out-of-order responses, malformed input, changing selection during pending work and recovery without a crash or silently mixed inputs/results.
- Mission draft Apply/Cancel, UTC behavior independent of browser locale, keyboard focus and slider/input editing surviving updates.
- Repeated tab/subtab/sheet opening preserves state and the single viewport; no duplicate handlers or growing GPU resources.
- Each research-model control affects its own applicable calculation and report while preserving environmental results and other-scenario inputs.
- Real JSON/interval CSV downloads, independently recomputed canonical SHA-256 and reviewed print output. Navigation-selector changes must not weaken the existing behavioral assertions.

### Rendered and accessible review

- Desktop reference at 1440 px; phone at 390 px; tablet at 768 and 1024 px. Check controls, readable metrics, scroll regions, touch targets and no accidental document overflow.
- Four main tabs plus subtab keyboard navigation, visible focus, native labels, modal focus trap/return, Escape, reduced motion and screen-reader-oriented result/loading announcements.
- Measure contrast on glass over bright terrain and offer more opaque panels. Preserve a usable 2D workflow when WebGL is unavailable.
- Headed installed Windows Chrome: inspect Moon/terrain/overlays, camera controls, active timeline, context loss/restoration and representative analytical panels. Record machine/version and scope.

### Performance

Use the current compute benchmark and headed review as the initial comparison; establish measurements on the same machine. Retain existing declared compute limits and add user-visible timing measurements for tab changes, committed input edits, pending work and 3D frame cadence. Report cold-load size/latency separately from cached local compute.

Do not recompute the full scientific model on every animation frame. Rendering consumes the current provider and cached result; expensive studies run on demand. Watch the already large bundled scientific payload; avoid embedding the full clone archive or all generated PNG concepts into the application. Preserve single-file offline output when reorganizing modules/assets.

### Commands at the relevant gates

```powershell
npm.cmd run build:workspace
npm.cmd test
npm.cmd run science:test
npm.cmd run start-windows:verify
npm.cmd run benchmark
npm.cmd run acceptance:audit
npm.cmd run build
npm.cmd run test:ui
npm.cmd run test:chrome
```

Run affected checks per phase and the complete relevant set for the release candidate. Scientific/source changes require corresponding preparer/validator/version updates; do not alter their expected values merely to make a visual migration pass.

## Release definition

All 12 concept destinations are implemented with real actions and applicable calculations; UI-only navigation leaves same-input numerical results unchanged. New calculations have their own source/algorithm identity and tests. No screenshot figures or mocked results are used in the app. Current sources, assumptions and uncertainty stay visible, loading/errors preserve a usable assessment, and JSON/CSV/print retain their declared meaning.

The new default is enabled after behavioral, numerical, production/offline, responsive and rendered-GPU checks pass and review evidence is recorded. Keep the recoverable classic entry for the first release. Passing the UI migration does not close independent physical terrain, full global covariance, hardware calibration or selected-site ice acceptance.

**Recommended first implementation increment:** Phase 0 baseline/recovery, then Phase 1 presentation separation. The first visible increment is the UI 1 shell and mission sheet with the existing calculation modules intact.
