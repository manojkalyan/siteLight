# UI 1 reference layout correction

15 November 2026. This follows [the UI 1 release](UI1_RELEASE.md) and corrects the differences identified in the supplied reference and application screenshots.

## Delivered

- Black scene background, neutral glass panels, crescent logo and centered four-tab navigation. The selected lunar site stays visible between the Mission and result panels.
- Larger silver-gray Moon with directional white studio lighting, orbit/zoom controls and a projected selected-site label. The NASA rendering maps remain illustrative; scientific terrain and visibility do not depend on the globe material or its texture registration.
- Compact Mission settings and actual selected-site metrics. The extra A/B cards no longer cover the Moon in Explore; full comparisons remain in Compare.
- Open, wide local horizon with the skyplot, responsive altitude chart and actual remaining-window sunset/Earthset readouts. Resizing changes chart dimensions without distorting its axes or labels.
- A slim playback dock with actual UTC date labels and Sun/Earth/overlap intervals. Step controls remain available in its ellipsis menu.
- A small terrain thumbnail rendered from the selected source DEM using the same WebGL renderer. A source-height SVG preview remains available without WebGL. Measured relief retains the source resolution.
- The neutral presentation continues through Compare, Screening and Evidence. Mobile controls stack and remain accessible; scientific settings, sources, exports and the classic recovery interface remain available.
- Route overlay caching now includes direction, so changing between equal-length sampled paths refreshes the displayed route.

`/?scenario=B` opens the reference composition with Nobile selected. This changes only the selected scenario, preserving both scenarios' inputs and computed results. The plain `/` entry retains its existing initial selection.

## Verification

[Machine-readable results](review/reference-match/validation.json) retain the current checks and artifact hashes. The full regression run passes 191 JavaScript/API/DOM cases. The complete installed-Chrome suite passes 19 cases, including the headed Windows hardware GPU and deliberate context-loss recovery review. The six migration cases and the headed renderer case were rechecked after the final renderer adjustments. A narrow-screen chart fallback found during image review was corrected and verified with three focused unit cases and two mobile/no-WebGL browser cases. Production and single-file offline builds pass; the four original prototypes remain preserved.

Final screenshots inspected at [1586 × 992](review/reference-match/final-1586.png) and [1920 × 900](review/reference-match/final-1920.png) show separated panels, the open horizon and the complete timeline without horizontal overflow. The [mobile capture](review/reference-match/final-mobile.png) retains readable chart axes at its actual container width. They use actual Nobile results: approximately 73.1% sunlight, 100% Earth visibility and 73.1% overlap for the existing seven-day interval. Example values and plot shapes from the concept art are not scientific inputs.

The calculation engine, scenario store, base scientific bundle and terrain evidence bundle match their retained baseline SHA-256 hashes. This is a presentation correction and bounded Chrome review. Existing scientific and engineering acceptance gates remain open, including physical terrain/uncertainty and equipment/resource evidence. No broader device or accessibility certification is claimed.

An interrupted disk-full write was detected and the empty renderer module was restored before verification. The first restricted integration run could not read an installed terrain-processing dependency; the full rerun with the required filesystem access passed. Neither interrupted attempt is counted as a pass.

## Open

Run `npm.cmd run dev` and open the Vite URL. The current local session uses <http://127.0.0.1:5173/?scenario=B>. Refresh an already open page to load the correction. The standalone entry is [lunar-workspace.html](../lunar-workspace.html); live date preparation and dynamic terrain ensembles require the local scientific service.
