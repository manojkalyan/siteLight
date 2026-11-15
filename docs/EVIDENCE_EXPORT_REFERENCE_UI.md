# Evidence and report reference interface

Open **Evidence** for the source library and **Export** for Review and export. These pages follow the supplied layouts and use the current assessment and retained source records. The default development address is `http://127.0.0.1:5173/`.

## Evidence

The page contains Sources, Validation and Limits tabs; five evidence-layer selectors; searchable dataset/role/status rows; and a selected-source inspector. The registry combines original scientific/provider identities with the retained thermal, stereo, engineering and research manifests. Search covers names, roles, categories, URLs and recorded digests. Selecting a raw record displays its original metadata, checksum and source URL. Published local-realization identities remain inspectable. Stereo hashes identify retained subsets and do not claim whole remote-file hashes.

Inspector facts use the active point and selected mode. Missing stereo coverage or a missing local ensemble is displayed explicitly rather than borrowing another point's measurements. The source library remains available when a mode does not assess real terrain. Validation retains the dated baseline and its declared scope. The source/numerical/Chrome review strip links to that record; it does not claim that a new audit ran when the page opened. Scientific acceptance, global covariance, equipment calibration and local extractable-ice gates remain open.

Help remains available in the Evidence footer. Playback and mission settings remain accessible from Explore; the analytical source page follows the reference layout without the timeline dock.

## Review and export

The glass sheet has five report sections, three inclusion switches, a live white report preview and format/provenance controls. Names, reference coordinates, dates, visibility fractions, lanes, terrain statistics and research outputs come from the current workspace. No sample percentages, coordinates, counts or checksum from the reference image are inserted. The cinematic landscape is labeled illustrative; the measured DEM preview belongs to Terrain evidence.

- **Include A/B comparison:** off exports and previews only the active scenario, including its own terrain and exploratory-model records. It does not change either assessment.
- **Include source metadata:** off compacts verbose acquisition fields while preserving source identities, recorded digests/cache keys, scientific method and mandatory qualifications.
- **Include research assumptions:** off omits the five exploratory-model payloads and their printed sections. The independent published NASA reference-study record retains its separate scope and assumptions. Exploratory results never enter environmental verdicts.
- **JSON:** exports the selected evidence bundle and locally calculated canonical assessment SHA-256. The preview and download use the same canonical field order. Copy retrieves the full digest; the visible shortened value has a full-value tooltip. A digest is not an acceptance certificate.
- **CSV:** exports actual sampled UTC records and durations, Sun/Earth geometry, horizon values and availability flags. Null/unknown fields stay blank; false stays `false`. CSV omits nested provenance and qualifications; use JSON for the evidence bundle. The separately named interruption-interval CSV remains available under Other downloads and respects scenario inclusion.
- **Print / PDF:** opens the browser print workflow. All included report sections print, independent of the selected preview tab, with source/model limitations. Save as PDF is provided by the browser. Close returns to the page from which Export was opened.

Source limits remain mandatory in every report selection. Reference and sample modes retain their correct source/mode labels. Model, data, evaluator/store and classic entry points are unchanged. The backdrop reuses the existing cached lunar render rather than creating another interactive renderer.

## Verification

The [validation record](review/mission-settings/evidence-export-validation.json) records the current JavaScript/API/DOM, Chrome and hardware/GPU checks and preserved scientific hashes. Focused tests verify actual source identities and subset hashes, unsupported coverage, escaped search input, real preview values, isolated report selections, matching reproducible hashes, actual UTC CSV flags/weights, printable sections, return navigation and bounds from 390 to 3840 pixels.

The final JavaScript/API/DOM suite passed **211/211**. The broad Chrome run passed 52 of 53 cases, including the headed AMD hardware-GPU/context-recovery review. Its one older keyboard test attempted to use controls hidden by the new source-page layout. The Evidence footer now provides Help; that test uses its accessible button and returns to Explore for playback. The final six-case run passed, including the corrected keyboard flow and existing JSON/hash/print regression. All **53 distinct browser/GPU cases** therefore pass across the retained runs. Four final layout/control cases also passed after compacting panel spacing. A further test against the running development server on port 5173 verified the live preview, checksum copy, inclusion switches and JSON download.

Production and standalone builds passed. All six protected source identities match the pre-UI baseline: evaluator, state/store, scientific bundles and classic entry/styles. The report and Evidence desktop/mobile captures were inspected. These interface checks do not close independent physical scientific or engineering acceptance.

Screenshots: [Evidence desktop](review/mission-settings/evidence-desktop.png), [report desktop](review/mission-settings/export-desktop.png), [mobile sources](review/mission-settings/evidence-mobile.png) and [mobile report](review/mission-settings/report-mobile.png). [The generated review PDF](review/mission-settings/evidence-report-review.pdf) demonstrates the browser print path using real current results.

The local dependency/source junctions on D: remain necessary; see [the storage note](SCHEDULE_REFERENCE_UI.md#local-storage). Full physical scientific and mission-specific engineering acceptance remains open.
