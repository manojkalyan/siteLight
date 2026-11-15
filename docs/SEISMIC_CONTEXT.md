# Moonquake and ground stability context

Open **Screening → Seismic**. This feature connects retained historical seismic observations and published polar scarp reference locations to the current A/B study coordinates and existing terrain measurements. It is an evidence-screening tool. Local shaking hazard remains **not quantified**; shaking-triggered slope failure remains **not evaluated**.

## Delivered behavior

- A polar/global evidence map shows actual source coordinates for scarp reference points, nominal shallow-event epicenters, controlled impacts and historical Apollo PSE stations. A/B study coordinates share the selected projection. South/north polar views use an azimuthal equidistant projection for absolute latitude 65–90 degrees with 0° E at the top. Global view uses an equirectangular projection. Off-region and unlocated records are excluded from the map rather than clamped to its edge, and remain accessible in the catalog.
- Each evidence layer can be hidden independently. Map links and catalog Inspect buttons open the same source inspector. The inspector retains source coordinates, timestamp, original comments, source row/page and source link. The historical alternate epicenter is displayed separately and linked to the primary solution; it is one event rather than a second quake. No invented confidence circles are drawn.
- A/B comparison calculates great-circle distance to the nearest **retained scarp reference point** and nearest nominal historical epicenter using the existing JPL mean-radius sphere (1737.4 km). Those distances are not fault-boundary distances, physical propagation paths, safe setbacks, risk ranks or estimates of shaking. Real terrain mean/p95 slope, roughness, coverage and sampled-route context retain their existing footprint and sources. Sample/reference modes do not borrow real terrain statistics.
- The searchable catalog preserves all 48 polar scarp points, all 28 shallow events (27 located, one unlocated, one event with an alternate location), eight controlled impacts and five historical stations. Collections and map toggles are presentation state; they do not edit either scientific scenario.
- The waveform explorer lazily loads two actual archived vertical LPZ records from Apollo station A-12: Apollo 12 LM impact (78,840 samples) and Apollo 13 S-IVB impact (77,760 samples). Original decoded samples, header interval, source coordinates and archived timestamps are retained. The complete records span approximately 198 and 196 minutes respectively. These are file spans, not measured event/coda durations.
- Display windows cover impact context, the full retained record or the late record. A peak-preserving min/max display reduces rendering work while preserving original samples in CSV. Display amplitude is normalized by the selected window's absolute peak; CSV contains the original archive amplitude and a separately named **full-record-normalized** column. Source sample count and interval, actual cursor UTC/index/value, window scaling and source hashes remain inspectable.
- Play/pause and seeking move a visual cursor at 60× archived time. They never advance the mission clock or change results. Reduced-motion mode keeps seeking available and prevents automatic playback. A failed waveform fetch shows an error rather than a fabricated or substituted trace. A different retained recording can load independently. No second interactive 3D renderer is created; WebGL is not required for the scientific map or waveform.
- Evidence now has a **Seismic history** layer with original source identities and checksums. Review/export places the comparison, catalog scope and source identities in Terrain evidence. Historical seismic evidence remains when exploratory research payloads are excluded. Single-scenario reports prune the other scenario's seismic context. JSON/canonical hashing includes the new `seismicContext` field; raw waveform samples are provided through the separate waveform CSV rather than inflating every scenario report.

## Source inventory and uncertainty

The [source manifest](../data/seismic-inputs.json) pins 12 original files with byte counts, SHA-256 and resolved URLs. The [preparation record](../data/seismic/preparation-validation.json) links those inputs, station transcriptions, the preparer and prepared outputs. Acquisition and preparation are separate, reproducible steps.

| Evidence | Primary source | Application scope |
| --- | --- | --- |
| Polar scarp locations | [LROC polar scarp locations / Watters et al. 2015](https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_POLAR_SCARP_LOCATIONS) | 48 historical **point** locations, 0–360° E converted to −180–180° E. This is an incomplete 2015 inventory, not fault traces or the newer 2024 south-polar survey. Absence of a retained point is not evidence that faults are absent. |
| Shallow moonquakes | [NASA PDS expanded event catalog](https://pds-geosciences.wustl.edu/missions/apollo/seismic_event_catalog.htm), `nakamura_1979_sm_locations.csv` and PDS4 label | The label describes LM-761 locations assuming a 100 km focus depth; they are not accurate to one degree. Numeric confidence bounds are not supplied. The magnitude is the original SPZ-envelope amplitude definition, not Mw; no conversion or modern-magnitude ranking is applied. |
| Controlled-impact coordinates/times | Same PDS bundle, `nakamura_1983_ai_locations.csv` and label | Eight catalog entries remain distinct from natural moonquakes. Original timestamp conventions are retained; range-time/clock interpretation is not changed. |
| Waveforms | [JAXA / UTIG artificial-impact archive](https://darts.isas.jaxa.jp/en/datasets/apollo-ai-data) | Original `.Z` files, decoded big-endian SAC v6 time series, LPZ station A-12. SAC IVEL is preserved as a header flag; independent physical units/response calibration is not claimed. |
| Station coordinates | JAXA-hosted [R. Yamada, Description of Apollo Seismic Experiments](https://darts.isas.jaxa.jp/missions/apollo/The_Description_of_Apollo_Seismic_Experiments.pdf), PDF page 2 | Five station transcriptions checked against the source-page coordinate tokens and visually reviewed. These stations are historical, not an operational monitoring network. |
| Format and distance convention | [EarthScope SAC format](https://ds.iris.edu/files/sac-manual/manual/file_format.html), existing [JPL Moon constants](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html) | Exact v6 payload/header contracts, original interval and times, mean-sphere nominal distances. No accepted propagation/soil/structural model. |

The [2024 south-polar study](https://doi.org/10.3847/PSJ/ad1332) and [NASA explanation](https://www.nasa.gov/solar-system/moon/shrinking-moon-causing-moonquakes-and-faults-near-lunar-south-pole/) motivate the feature. Their modeled shaking/landslide maps are not silently transferred to these study points. The feature does not digitize a figure into an invented fault catalog, extrapolate a 55-minute impact response to other locations, forecast a quake date, derive a site event probability or certify a landing site.

No separate gap/quality mask accompanies the retained legacy SAC files. Finite values and zeros are retained unchanged; isolated peaks are not removed as presumed artifacts. Missing epicenter coordinates/error bounds stay null, not zero. A normalized signal is not calibrated acceleration.

## Reproduction

```powershell
npm.cmd run seismic:acquire
.tools/python/python.exe -m pip install --no-deps --require-hashes --target .tools/seismic-libs -r scripts/requirements-seismic.txt
npm.cmd run seismic:prepare
node --test tests-js/seismic.test.mjs
npm.cmd run build
npm.cmd run build:workspace
node node_modules/@playwright/test/cli.js test --project=ui-chrome seismic-reference.spec.mjs
```

The preparation script uses the existing project Python/PyMuPDF runtime for source-page verification and the locally pinned `unlzw3` 0.2.3 decoder. The online app loads each waveform asset only when requested; the standalone build embeds the same records for offline use. Retained raw scientific/dependency junctions on D: remain unchanged.

## Verification and remaining work

The [validation record](review/seismic/validation.json) records final source, unit/API/DOM, rendered Chrome/GPU and layout checks. New numerical checks compare every decoded waveform sample against the retained SAC bytes, validate header/time/source identity, verify window extrema and CSV rows, test lunar great circles/projections and preserve unlocated/alternate records. UI tests cover actual displayed distances, map layers, source navigation, waveform controls and downloads, independent A/B settings, report hashing/print, failed-waveform behavior, no-WebGL operation and widths from 390 to 3840 pixels.

The final JavaScript/API/DOM run passed **220/220** checks. The broad Chrome run passed 59 of 60 cases, including the headed AMD hardware-GPU/context-recovery review. Its existing Schedule case timed out while clicking Apply tested start; that case passed in the isolated nine-case integration run without a Schedule code change. All **60 distinct browser/GPU cases** therefore have passing results across the retained runs. All seven final Seismic cases also passed after the usability and loader changes.

The live development check caught a Vite-specific direct dynamic JSON import failure that the production build did not reproduce. The final loader uses dynamically imported JavaScript wrappers with static JSON imports. Two live development checks then passed, covering the actual waveform, playback/CSV and evidence/export flow. The final production Seismic checks also passed. A Chrome file-URL check verified both embedded waveforms in the standalone HTML without HTTP requests or JavaScript errors, while preserving both scenarios. Production and standalone builds passed, and all six protected evaluator/store/scientific/classic source identities match their pre-UI baseline.

Reviewed captures: [desktop evidence map](review/seismic/seismic-desktop.png), [waveform explorer](review/seismic/seismic-waveform.png), [mobile map](review/seismic/seismic-mobile-map.png) and [mobile waveform](review/seismic/seismic-mobile-waveform.png). Source-document tables on PDF pages 2 and 5 were rendered and inspected. These checks verify the implemented historical-evidence workflow, not independent physical hazard acceptance.

To try it: open `http://127.0.0.1:5173/`, refresh, and choose **Screening → Seismic**. Select Global to see the sparse historical Apollo network and controlled impacts. Inspect a map symbol or catalog record, compare A/B evidence, then choose an impact recording and use Play or the cursor slider. Export waveform CSV from that panel; use Export → Terrain evidence for the qualified scenario report.

The independent future research stage requires applicable regolith cohesion/friction/density, a validated local ground-motion model, source magnitude/depth/rupture information and uncertainty, equipment response and agreed acceptance criteria. Those inputs are not inferred from local DEM slope or from an Apollo recording. Full scientific and engineering acceptance remains open.
