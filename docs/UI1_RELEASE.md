# UI 1 implementation and validation

15 November 2026. Interface `ui1-1`, calculation model `workspace-evaluator-11`.

Follow-up: [the reference layout correction](UI1_REFERENCE_MATCH.md) restores the black scene, larger silver-gray Moon, compact panels, open horizon and slim timeline. Its current verification record supersedes the earlier interface test counts below.

The new interface is now the default application. Explore, Compare/Schedule, six Screening sections, Evidence and report/export views use the existing live calculations. The generated design images guide the interface; their example figures, terrain features and plot shapes are not loaded as scientific data.

## Delivered

- Four main tabs, dark glass presentation, responsive floating mission/result panels, native mission settings sheet and source-aware advanced inspector.
- Mission settings use a cancelable draft. Apply validates and prepares coverage before committing. Failed requests preserve the last covered scenario. Required UTC, duration, threshold, optional outage, custom-point and data-mode controls remain reachable.
- A single Three.js canvas moves between Explore and Terrain/Rescue. Footprint radius, categorical slope markers and sampled route overlays use real selected terrain coordinates. The renderer has explicit activity/disposal handling, bounded pixel ratio, reduced motion, context recovery and a no-WebGL alternative.
- Compare retains shared requirements, independent A/B scenarios, deficit explanations, ranked UTC interruptions and tested date alternatives. Schedule retains daily previews, loaded ten-minute scans and separate 84-start monthly sampling.
- Terrain, Logistics, Thermal & dust, Plume, Radiation and Rescue show their own controls/results and scientific qualifications. Source data, reference studies and hypothetical inputs remain distinct.
- The local terrain-ensemble endpoint evaluates all 100 retained source realizations at the requested supported footprint settings. Settings/source hashes are checked, results are cached within bounds, and a stale setting change stops those results appearing as current. Custom points without a matching published ensemble remain unsupported. Offline use retains the prepared reference footprint rather than inventing uncertainty.
- Evidence provides searchable actual source records, source inspection, recorded baseline validation and current limitations. JSON includes an applicable dynamic ensemble study in canonical hash coverage. CSV retains interruption-interval semantics. The report has a print-oriented preview and export controls.

## Verification

[Recorded results](review/ui1/validation.json): **188 JavaScript checks, 18 Python fixtures and 18 Chrome cases pass**. The Chrome count includes the headed Windows hardware-rendering/context-loss recovery review. New UI checks cover draft cancellation/atomic application, single-canvas navigation, current-footprint ensemble recomputation, actual overlay radius and source search. Existing calculation/isolation/loading/export assertions remain in the migrated tests.

The baseline hashes of the calculation engine, store and two scientific bundles are unchanged. The source audit still passes **681 retained source records, seven artifact checks and 13 linkages**. Local compute benchmark targets pass. Production and single-file offline builds pass; the four original prototypes remain preserved.

Inspected screenshots include Moon, measured terrain, Compare, NASA reference and mobile comparison in [the retained review folder](review/windows-chrome/). The real DEM does not reproduce invented crater/boulder detail from the concept art. Scientific acceptance and engineering/resource evidence gates remain open. This is a bounded Windows Chrome review, not universal device or accessibility certification. PDF generation is checked, but no page-by-page PDF layout acceptance is claimed.

The first full browser attempt encountered a hidden-catalog test selector and Windows disk exhaustion. The selector was corrected, and the complete browser suite reran successfully with temporary profiles on `D:\SiteLight-test-temp`. The earlier interrupted results are not counted as passes. The first DOM regression attempt also exposed a missing AbortController in its simulated browser; the viewport now supports that environment and the full suite passes.

## Run and recover

```powershell
npm.cmd run dev
```

Open the URL Vite prints. `/` is UI 1; `/classic.html` retains the classic entry. [lunar-workspace.html](../lunar-workspace.html) is the rebuilt offline application, and [lunar-workspace-classic.html](../lunar-workspace-classic.html) is the saved standalone baseline. Real date/custom-point/dynamic-ensemble preparation needs the local scientific service; offline controls disclose loaded coverage.

UI modules: `ui-shell.mjs`, `mission-settings.mjs`, `evidence-ui.mjs`, `ensemble-client.mjs`, `ui1.css`. The bounded source evaluator is `scripts/evaluate-terrain-ensemble.py`. No generated mockup PNG is included in the runtime bundle.
