# Mission settings visual correction

15 November 2026. Updated only the Mission settings presentation and its scoped Explore backdrop treatment to follow the supplied reference.

## Continuous terrain and Moon overview

The terrain canvas now fills the desktop Explore screen, including the area behind and below the floating timeline. Previously its parent ended above playback, leaving a black strip. This changes rendering bounds only; scientific terrain heights and results retain their sources.

Terrain mode now shows a round Moon overview with the selected-site marker. It uses the existing NASA rendering maps, an offscreen render target and the same WebGL renderer; there is still one canvas. Clicking the overview returns to Moon mode. Moon mode retains its source-terrain thumbnail. The scene switch and Moon preview remain visible in shorter windows.

Seven targeted Chrome cases pass, covering continuous terrain and the overview interaction, five-size sheet alignment, cancelable/atomic settings, one-renderer navigation, actual footprint overlays, no-WebGL scientific fallback and headed Windows GPU/context recovery. Engine, store and both scientific bundle hashes remain identical to their retained baseline. The overview lighting/label adjustment was checked again in the continuous-terrain case after the final build.

See [rendered background](review/mission-settings/continuous-terrain.png) and [seven-case browser record](review/mission-settings/continuous-terrain-browser.json). The real DEM keeps its measured resolution and relief; the concept image is not loaded as terrain evidence.

Follow-up: the first layout applied its right alignment only above an 821 CSS-pixel viewport height. Shorter windows and browser zoom therefore received a large centered sheet. The correction now measures the space above playback, scales the form, and anchors its right edge independently of that breakpoint. The source terrain is temporarily displayed while settings are open, and the previous scene selection returns on close. Short-window thumbnails no longer intercept the settings button.

The [responsive browser rerun](review/mission-settings/responsive-browser.json) passes four cases, including layout checks at 1586×992, 1920×900, 1480×720, 1280×720 and 1120×630, draft cancellation/atomic Apply, real-date loading/failure preservation and mobile/tablet controls. [Reference-size capture](review/mission-settings/desktop-corrected.png) and [scaled laptop capture](review/mission-settings/zoomed-laptop.png) were inspected; [measured dimensions](review/mission-settings/responsive-layout.json) show the card clear of both Mission and playback. These supersede the earlier fixed-size measurements below.

Disk recovery: an extracted Python installer archive and one compiled chunk were removed; the chunk was rebuilt. Installed Python dependencies were relocated to `D:\SiteLight-test-temp\runtime-pylibs` and `.tools/pylibs` now points there through an NTFS junction, retaining the application's import paths. Keep that dependency directory with this local installation. Scientific inputs were retained. The Vite cache was regenerated and the local server restarted after disk exhaustion. The failed earlier browser attempt is not counted as a pass.

The desktop sheet is anchored at x=510, y=86 at 1586×992, with a 1052 px width. It uses neutral glass, a divided two-column form, editable numeric values paired with synchronized sliders, outage switches, selected-scenario context, source coordinates and segmented data-mode controls. It fits above the timeline without internal desktop scrolling. Mobile retains vertical scrolling and a reachable action footer without horizontal overflow.

All existing input IDs, validation, cancellation, coverage preparation and atomic Apply behavior are retained. Coordinates and observer height continue through the existing source inspector; the displayed coordinates come from the selected source point. The A/B indicator identifies the scenario being edited. Actual terrain relief, current thresholds and real result values are preserved rather than copied from the illustrative image. The backdrop stays visible and the 3D renderer is unchanged.

Four targeted Chrome cases pass: cancelable draft/atomic Apply, future real date loading and failure preservation, keyboard/guide navigation, and mobile/tablet controls. The draft check also exercises the new slider synchronization and data-mode buttons. Production and offline builds pass. Engine, store and both scientific bundle hashes match the retained baseline.

See [validation and dimensions](review/mission-settings/layout.json), [desktop screenshot](review/mission-settings/desktop.png), [mobile screenshot](review/mission-settings/mobile.png) and [browser results](review/mission-settings/browser.json). Existing scientific/engineering qualifications continue to apply.
