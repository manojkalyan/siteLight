# Explore terrain and working mission controls

15 November 2026.

The Mission settings A/B controls are now buttons. They switch the selected scenario and retain separate, uncommitted form drafts. Cancel discards pending edits; Apply validates and saves the visible scenario through the existing coverage-checked transaction. Applied mission requirements remain shared. The other scenario's site and UTC inputs are retained.

The settings sheet is modeless, so the Moon/Terrain switch, Moon overview and camera remain usable while it is open. Explicit scene selections are respected on close. Escape closes settings; navigation closes the sheet before changing pages. Other dialogs retain their existing behavior.

Explore's Terrain view now offers two clearly separated presentations:

- **Cinematic:** an illustrative crater landscape with irregular rims, regolith shading, instanced rocks, shadows and a cyan site marker. The named marker identifies the selected scenario; its position in this artistic landscape is schematic. Geometry is deterministic and is never passed to terrain, visibility or logistics calculations. This follows the supplied reference's visual direction rather than reproducing an unavailable source 3D asset exactly.
- **Source DEM:** the existing measured NASA terrain patch and source-aligned overlays. Terrain Screening always uses this view. Source data and models are unchanged.

The scene continues behind playback and keeps the Moon overview visible. The site callout is positioned in the exposed area beside settings. Exports disclose the selected Explore presentation alongside scientific source metadata. Texture and GPU resources are disposed when leaving a non-cached page; the renderer retains context-loss recovery.

The full Chrome suite passes 23 cases, including new A/B draft round trips, applying B without changing A's inputs, working Moon/Terrain and Cinematic/Source DEM controls with settings open, real date loading, scientific overlays, exports, no-WebGL fallback and headed hardware GPU recovery. A form-display rounding defect discovered by the new draft test was corrected. Earlier failed attempts are not counted as passes. The final artistic framing adjustment was inspected separately and the affected interaction/rendering cases rechecked after the final build.

Evidence: [full browser results](review/mission-settings/controls-browser.json), [Nobile cinematic view](review/mission-settings/cinematic-settings.png), [Moon view with settings open](review/mission-settings/moon-settings.png), [measured view](review/mission-settings/measured-settings.png), [site-label dimensions and browser exceptions](review/mission-settings/final-scene-check.json). The original scientific and engineering acceptance limits remain unchanged.

The separate JavaScript/API/DOM regression rerun passes all 191 cases. The concurrent run with Chrome failed in two resource-sensitive cases; the standalone rerun passed, and CSPICE imports were independently checked. Camera and grain refinements were followed by a three-case control/GPU recheck and a final two-case background/control recheck. The current Moon framing uses the exposed area beside the sheet rather than placing the globe beneath it.
