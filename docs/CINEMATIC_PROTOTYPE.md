# Cinematic lunar UI sample

Open [lunar-cinematic-prototype.html](../lunar-cinematic-prototype.html) directly in a modern desktop browser. It is a separate offline HTML file, approximately 2 MB. The three earlier prototypes are preserved.

This explores the requested Blender-inspired visual direction: a realistic textured Moon, a separate crater landscape, restrained floating glass panels, and smooth camera controls. It is browser-rendered with Three.js, not exported from Blender. It does not implement the scientific data pipeline described in PRD 3.3.

## Controls

- **Moon / Terrain** switches between the global globe and the procedural close-up. These are separate visual scenes; there is no georeferenced zoom between them.
- Drag to orbit. Scroll, use the camera buttons, or focus the scene and use the arrow keys and + / − to navigate.
- **Hide planning / Show planning** changes panel visibility. Panels begin hidden on narrow screens.
- In Terrain, change the date or scrub the timeline to change the sample local Sun direction and shadows. The Sun / Earth tint buttons are artistic overlays, not visibility rasters. Changing requirement thresholds changes the sample assessment, not celestial positions.
- Use the top navigation to compare scenarios, inspect slope and gap demonstrations, or review data limitations. The selected scenario and requirements stay synchronized between views.
- Reduced-motion preferences disable spring interpolation and timeline playback. The renderer skips drawing when its inputs settle and while Explore is hidden.

## Source and model boundaries

The globe embeds two JPEGs from [NASA’s Scientific Visualization Studio — CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/):

| Asset | Resolution | Use |
| --- | --- | --- |
| `lroc_color_2k.jpg` | 2048 × 1024 | 2025 color map |
| `ldem_3_8bit.jpg` | 1024 × 512 | Bump shading preview |

Credit: **NASA’s Scientific Visualization Studio**. Exact URLs, byte sizes, retrieval date, and SHA-256 checksums are in [asset provenance](../assets/cinematic/provenance.json). NASA describes these maps as optimized for aesthetics and directs scientific applications to the source products. The JPEG height preview is not a quantitative elevation grid accepted for mission calculations. Bump detail affects shading, not the globe silhouette.

The globe orientation and studio lighting are artistic. Fictional candidates are not placed on real lunar coordinates. The close-up crater mesh, rocks, candidate names, Sun/Earth geometry, horizon evaluator, slope examples, and all planning verdicts are synthetic. The surface shadows and the analytic availability evaluator use different demonstration terrain models. No thermal, RF, landing-safety, or life-support validation is implied.

Three.js is bundled under its [MIT license](licenses/three-MIT.txt), also retained inside the HTML. Assets and the renderer are embedded; opening the file requires no texture server or CDN.

## Build and verification

```powershell
npm.cmd run build:cinematic
npm.cmd test
```

Source: [scene renderer](../scripts/cinematic/scene.mjs) and [standalone assembler](../scripts/build-cinematic-prototype.mjs). The assembler verifies that the earlier prototype files remain unchanged. It consumes the pinned local assets; it does not fetch replacements.

The scene requires WebGL 2 for its detailed rendering. If initialization fails, the sample shows the earlier basic terrain renderer, disables the Moon scene, and labels the fallback. The scene pauses during graphics context loss and resumes after restoration.

Automated checks cover script parsing, embedded asset integrity, shared evaluator preservation, scenario/view synchronization, offline structure, and initialization/fallback contracts. **These are Node contract checks, not browser or GPU tests.** Browser preview was unavailable in the authoring session; rendered lighting, performance, mobile layout, and context recovery need browser validation.

## Visual review

1. Open the file: Explore should show a textured gray Moon against black space, with floating planning controls.
2. Orbit the globe; check the terminator, texture seam, bump detail, text contrast, and camera limits.
3. Switch to Terrain. Check crater rims, deep shadows, rock detail, and marker visibility. Scrub the timeline into darkness and daylight.
4. Hide the panels, then restore them. At phone width, confirm the scene controls remain accessible and the setup panel scrolls.
5. Change a site/date and move through Compare and Screening; confirm selected inputs persist. Confirm Thermal stays “Not evaluated.”
6. Check reduced motion and a device with WebGL 2 disabled. The fallback must be labeled and must not appear to show NASA-mapped terrain.
