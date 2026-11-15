# Horizon panel sizing and motion correction

15 November 2026. Scoped to the Explore horizon panel, its playback updates and responsive checks.

The short-height desktop rule previously reduced the chart row to 111 pixels while the compass remained 130 pixels tall. The containing panel clipped its southern label. The compass now fits the available row with a square aspect ratio. The source chart, compact Sun/Earth legend and Azimuth axis title share a separate grid column; readouts retain their own column. Compact plots use fewer display ticks to keep labels readable. Scientific horizon samples, eligibility tracks, event definitions and values are unchanged.

During playback the SVG source profile, tracks and axes retain their DOM identity. Only the current Sun/Earth markers and event readouts update. Marker coordinates use the same mapping as a fresh source plot; brief CSS interpolation smooths the motion. Native expand/collapse gains a height/opacity transition in supporting browsers. Reduced-motion preferences disable these transitions and retain the existing playback behavior.

Verification: four focused JavaScript cases pass, including comparison of live marker positions with freshly generated source plots and missing-geometry handling. Five Chrome cases pass: complete compass/text/readout bounds at seven screen sizes, existing-marker playback without path replacement, collapse/reopen, reduced motion, neighboring scene controls, mobile/tablet behavior and no-WebGL scientific fallback. Resize coverage includes 1920×900, 1920×720, 1536×864, 2560×1440, 3840×2160, 1280×720 and 390×844. Production and single-file offline builds pass.

Evidence: [short-window screenshot](review/mission-settings/horizon-short.png), [large-screen screenshot](review/mission-settings/horizon-large.png), [browser results](review/mission-settings/horizon-final-browser.json), [validation record](review/mission-settings/horizon-validation.json). Screenshots were inspected for clipped labels and axis spacing. This is UI verification and does not close physical scientific or engineering acceptance gates.
