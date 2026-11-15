# Compare reference interface

15 November 2026. Compare now follows the supplied two-scenario reference design while retaining independent A/B inputs and the existing scientific evaluator.

## Delivered

- Side-by-side scenario cards with source-point names, evaluated UTC starts, duration and qualified status. Edit opens the existing cancelable mission sheet for the selected scenario.
- One shared criteria table showing the actual sunlight, Earth and overlap requirements and computed A/B fractions. Missing coverage is displayed as unknown. Example thresholds and values from the reference image are not substituted for current inputs.
- Selected-scenario binding requirements ranked by their actual shortfalls. The first two appear prominently; additional enabled requirements remain available in a disclosure. Ranked UTC interruption intervals, weighted scores, full explanations, skyplots and scientific limits remain inspectable.
- Overview/Schedule navigation and the existing tested-alternative search. The Compare page uses its own space rather than retaining the Explore playback dock.
- A separate UTC date preview evaluated with current requirements and the selected site's own provider. Previews load required real coverage through the existing local service when available. Neither baseline changes during evaluation. Missing coverage or a failed request preserves both scenarios and disables Apply.
- Apply rechecks the preview against current inputs and commits the selected scenario through the existing coverage-checked transaction. A changed date, site, selection or requirement makes the previous preview inapplicable. A tested result can still fail requirements; its status and metrics remain visible rather than implying a pass.
- Baseline/preview strips represent actual solar-eligible intervals relative to each evaluated mission start. Untested previews show “Not evaluated.” The complete Sun/Earth/overlap comparison remains in the shared table.
- An illustrative terrain background and card crops rendered once from the existing cinematic scene using the same renderer. A small Blob URL avoids oversized CSS data URLs. Images are labeled illustrative and do not identify measured terrain at either site. GPU resources and the Blob URL are cleaned up with the renderer. Without WebGL, criteria, controls and source assessments remain available with a neutral visual fallback.
- Responsive cards, a focusable horizontally scrollable criteria region on narrow screens, and stacked decision controls. Explore, Screening, Evidence, exports and the classic entry retain their existing functions.

## Verification

The retained [validation record](review/mission-settings/compare-validation.json) records the final checks, screenshots and protected file hashes. The full Chrome/GPU suite includes Compare values versus the live report, isolated preview/Apply, stale-preview prevention, failed-request preservation, future real coverage loading without baseline mutation, responsive bounds and Schedule navigation. Existing Explore controls, terrain overlays, scientific/research workflows and exports remain in that suite.

Two focused unit checks verify actual table values, unknown coverage, preview invalidation and interval geometry. The complete JavaScript/API/DOM suite and both builds are recorded after the final implementation. Rendered desktop/mobile images were inspected. These checks do not close existing physical scientific or engineering acceptance gates.

Evidence: [desktop screenshot](review/mission-settings/compare-desktop.png), [mobile screenshot](review/mission-settings/compare-mobile.png), [browser results](review/mission-settings/compare-full-browser.json). The evaluator, store and scientific bundles retain their baseline hashes.

The broader 32-case browser run passed 31 cases, including headed hardware GPU/context recovery; one mobile case timed out in initial page navigation before the UI loaded. Its isolated rerun passed. The final seven-case run passes all six Compare cases and that mobile case, including a new check of Edit-sheet sizing and shared-requirement preview invalidation. Both runs are retained; the earlier timeout is not counted as a pass. The six Compare cases include an actual future-data service request and an intentionally aborted request. The [final browser record](review/mission-settings/compare-final-browser.json) supersedes the earlier Compare-only review.

Final totals: 195 JavaScript/API/DOM regressions pass. All 33 distinct browser cases have a passing result across the retained runs, including the new Edit-sheet case. Both builds pass and all four protected calculation/data file hashes are unchanged. The [evaluated preview screenshot](review/mission-settings/compare-tested-preview.png) shows the current Nobile baseline and a separately tested start; no preview date has been applied in that capture.
