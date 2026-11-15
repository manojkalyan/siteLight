# Lunar Studio — single-file prototype

Open [lunar-prototype.html](../lunar-prototype.html) directly in a modern browser. No installation, server, account, API key, or network connection is required.

This is a separate visual exploration requested after the PRD planning work. It adds an immersive 3D direction without marking the planned scientific or LCSS features complete.

## Included

- Full-window procedural lunar terrain with a native WebGL mesh, surface shading, and illustrative terrain shadows.
- Floating frosted-glass mission controls and assessment panels.
- Spring-interpolated camera orbit, pitch, zoom, and point-of-interest transitions.
- Three fictional sample sites, clickable scene markers, and comparison mode.
- Date, mission duration, sunlight/Earth/overlap thresholds, and Sun-elevation controls.
- Ten-minute synthetic availability evaluation with rule margins and short explanations.
- Mission timeline, play/pause, adjustable playback speed, and Sun/Earth elevation readouts.
- Natural, solar-eligibility, and Earth-visibility visualization modes.
- A nearest passing daily-sample search within ±60 days; no silent constraint relaxation.
- Scenario reset, camera reset, source/limitations dialog, and JSON export.
- Keyboard controls, responsive panels, reduced-motion handling, and a lower-detail Canvas fallback.

## Interaction

Drag the scene to orbit; scroll or use +/− to zoom. With the scene focused, arrow keys rotate and +/− zoom. On narrower screens, use the sliders icon to open mission setup.

Date and timeline changes move the illustrative light direction. Requirement changes update checks and overlays, rather than change astronomical positions. The Sun-elevation control switches to the sunlight overlay so its effect is visible.

The assessment covers the full selected mission window. The timeline and instantaneous angles describe one instant within it; these are intentionally different views of the same sample scenario.

## Limits

All sites, terrain, geometry, availability results, and suggested dates are synthetic. The procedural visual terrain and analytic sample horizon are different artistic models. No lunar coordinates, NASA LOLA input, real JPL ephemeris, battery simulation, RF model, life-support calculation, or safe-landing assessment is included.

The prototype is self-contained. Existing Python/CopperOS routes and their start scripts are unchanged.

## Verification

Run `node --test tests-js/lunar-prototype.test.mjs` or `npm test` for deterministic rule/interval/search tests, whole-script parsing, and dependency checks. These tests validate synthetic interface behavior; they do not establish scientific validity.

Browser visual/GPU verification requires an available browser preview surface. A successful JavaScript test run does not prove shader compilation or visual layout in every browser.

On 14 November 2026, `npm test` passed 13 checks, including a full-script DOM/canvas contract harness for startup, a fallback frame, comparison, selection, overlays, dialog controls, and reset. Browser/GPU visual verification could not run because the browser access host was unavailable. Idle frames reuse the existing rendering when scene inputs and spring values are unchanged.
