# Large-screen alignment and site-marker check

The Explore controls now reserve the space below the actual Mission card. The Moon preview scales to that available height; shorter windows use a compact row. The horizon reserves a separate horizontal gutter. Cinematic/Source DEM labels stay on one line, and measured-layer controls no longer protrude from the cinematic selector. Scene changes start at the new scene's camera position rather than briefly moving through its surface; orbit and zoom retain interpolation.

Rendering uses a four-million-pixel buffer budget with an atomic resize, so large monitors retain the CSS layout without requesting an oversized intermediate GPU buffer. This changes display resolution only.

## What was checked

- Live resizing through 1920×900, 1920×1080, 2560×1440, 3840×2160, 1536×864 and 1480×720. Tests require the Moon controls to stay below Mission, left of the horizon and above playback, with the preview visible and Source DEM text unwrapped.
- All six catalog sites selected through Mission settings. Each selection updates the rendered marker's site ID and label. The measured marker is checked against the selected source grid's sampled center height and coordinate frame; it now samples that height rather than assuming a fixed display height.
- Each site's Moon-marker position is inverted back to latitude/longitude and compared with the selected site's coordinates. Cardinal directions and poles have a separate geometry test. This verifies the coordinate transform, not independent physical registration of the artistic globe texture.
- The other scenario's inputs/results remain unchanged during these selections. Cinematic markers are explicitly tested as schematic; the cinematic landscape does not identify an actual mapped lunar landing position.

Five focused Chrome cases and five geometry unit cases pass. The final layout/camera refinement was followed by a two-case recheck covering all sizes and all six sites. Production and offline builds pass. An earlier repeated-page GPU-allocation failure is excluded from the pass count; the resize check now exercises one live scene, with the bounded GPU allocation described above.

Evidence: [large-screen screenshot](review/mission-settings/large-alignment.png), [focused browser results](review/mission-settings/large-site-browser.json). The browser attachments retain per-size bounding boxes and per-site source/globe marker positions. Scientific data and evaluator/store formulas are unchanged; existing scientific/engineering acceptance limits remain open.
