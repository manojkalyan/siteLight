# Rendered application review and demo

[The Windows Chrome validation record](BROWSER_VALIDATION.md) now includes 11 real-browser UI cases, one headed GPU/recovery case and selected screenshot inspection. This procedure remains the broader acceptance checklist. Earlier prepared-only notes below describe initial status; screen-reader usability, cross-device coverage and cold-load/long-duration acceptance remain open.

## Current build review

Additional v4.8 review: in Calendar, select Nobile and **Scan loaded ten-minute starts**. With default requirements, confirm 11,953 tested starts, 2,303 uncertain nominal fits, inclusive grouped endpoints and no unknowns. Apply a First/Last boundary and inspect the rechecked result; change a requirement or point and confirm the previous study disappears. Review loading state, table scrolling, keyboard access, narrow widths and the print summary. Time the scan in the actual browser. These are prepared checks, not observed rendered results.

1. Run `npm.cmd run dev` and open Vite's local URL. At desktop size, check that the outliner, scene/charts, A/B cards, inspector and timeline can all be reached without overlapping text or clipped controls.
2. Inspect the default UTC 13 January 2027, 168-hour, 2° solar-elevation case. Shackleton's nominal result fails with zero default availability fractions. Nobile shows about 73.1% solar/overlap and 100% Earth visibility with an uncertain nominal fit. Values must not be interpreted as a certified landing verdict.
3. Switch between Moon and local terrain. Check that the real local patch changes with the selected point, the camera controls work and the Sun/Earth markers follow time scrubbing. Scientific contours should remain usable if GPU rendering is unavailable.
4. Open Constraints. Check that Shackleton's ranked intervals identify actual unmet rules. Switch to Nobile and confirm the previous point's failure explanation disappears. Check both plain and technical wording.
5. Open Screening. Check real terrain statistics, 0.5°/125 km source information and height-error sensitivity. Historical Diviner values should retain their 2009–2019/local-time context when mission UTC changes; missing bins stay missing.
6. Open Logistics, enable exploration and inspect default 1 wt% assumptions. The subtotal is 21,670 kg, using the declared planning model. Search should propose 1.5 wt% as the nearest tested budget fit from that default. Applying it must change the selected scenario's ice assumption and reproduce 16,830 kg while preserving its environmental result. Switching the input to 6 wt% gives 11,990 kg. These are illustrative engineering assumptions, not site measurements.
7. Select a supported future date in the local app. Previous metrics should remain visible while new real records load. Inspector model controls should remain disabled even if another inspector tab is opened during loading.
8. Prepare the supported custom coordinate −89.76674°, −171.85°, observer height 2 m. Check that its own terrain and records load before selection. Try a location outside the prepared tiles; the previous assessment must remain intact with a coverage explanation.
9. Export JSON, intervals CSV and print view. Confirm that inputs, statuses, model/source identity and LCSS's `acceptedForVerdict: false` remain visible in the applicable output. CSV is an interval export, not the complete JSON evidence package.
10. Navigate using Tab/Shift+Tab and inspector arrow keys; check visible focus, labels, checkbox state, timeline keyboard control, dialog close and screen-reader descriptions. With the operating system's reduced-motion preference already enabled, check that autoplay is suppressed. Do not change system settings solely for an unrecorded test.
11. At a narrow/mobile viewport, check site-menu access, inspector scrolling, table overflow, UTC entry and all primary actions. This check needs an actual supported browser; source media queries alone are insufficient.
12. Record actual cold/warm load time, settled edit latency and scene smoothness on the target device/network. Compare these measurements with the PRD targets, keeping Node compute timings distinct from complete user-perceived latency.

Record browser/version, device, viewport, model/data versions, observations, failures and any screenshots in a review record. Leave a check incomplete if it could not be observed.

## 90-second demo sequence

Additional v4.7 review: enable Radiation observations & proton shielding in Screening. Verify archive date/Si units, measured versus source lunar-shadow-corrected values, daily coverage and flagged March 2012 gaps. Change slab material/energy/mass per area and confirm the archive stays unchanged; check zero shield, CSDA exhaustion and the secondary-dose qualification. Switch A/B, inspect JSON/print assumptions and units, and review keyboard/narrow-screen charts/tables. No human/surface Sv, health threshold or terrain-to-dose multiplier should appear. This is a prepared rendered-review step, not a recorded browser pass.

Additional v4.6 review: in Screening → Plume & ejecta exploration, enable the model and inspect the numerical-domain/ideal-sphere qualifications. Add/edit/remove hypothetical assets, switch A/B, change bearing/height to compare misses, above-envelope paths and entries, and verify escaped names, keyboard labels and narrow-screen layout. Inspect phase/energy assumptions and source evidence in JSON/print; no damage or safe-radius result should appear. This is a prepared rendered-review task, not an observed browser pass.

Additional v4.5 review: open Screening → Dust & radiator sensitivity, enable exploration, switch laboratory presets/custom optics and compare 0%/100% coverage. Verify signed temperature/capacity changes, negative-capacity explanation, A/B isolation, comparison-limit behavior, curve labels and keyboard/narrow-screen operation. Inspect source/page evidence and assumptions in JSON/print. The optical approximation must remain labeled nonconservative; it is separate from historical Diviner context. This is a prepared rendered-review step, not a recorded visual pass.

Additional v4.4 review: in Screening, choose Connecting ridge and a supported route direction. Declare the hypothetical rescue asset and assume it available; verify arrival/completion, return selection and both time margins. Lower the completion limit to force a shortfall, switch A/B, and change point/start to confirm re-declaration. Inspect assumptions and UTC/route evidence in JSON and print output. Check keyboard labels, focus and narrow-screen layout. This is a prepared review step, not a recorded rendered-browser pass.

- 0–15 s: show sourced A/B points, identical requirements and the default differing nominal results.
- 15–35 s: inspect one failed requirement and its ranked UTC interruption; show the shared horizon/skyplot/timeline.
- 35–55 s: inspect footprint and historical temperature context, keeping coverage and uncertainty visible.
- 55–75 s: enable LCSS exploration and demonstrate the verified hypothetical 1.0 → 1.5 wt% budget change; explain that engineering acceptance and local ice evidence remain open.
- 75–90 s: show the JSON/print evidence and the NASA coverage matrix, including remaining scientific and release gates.

This script is prepared; its timing, usability and rendered presentation still need a real demonstration rehearsal.
