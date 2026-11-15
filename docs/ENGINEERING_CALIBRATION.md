# LCSS engineering evidence and NASA reference architecture

15 November 2026. PRD v4.9; evaluator `workspace-evaluator-11`.

**Current result:** a published NASA reference architecture is implemented and clearly labeled as a reference study. The 20-input four-crew/730-day LCSS explorer remains hypothetical, with **0/20 parameters accepted**. Reference arithmetic is implemented; physical hardware/process/operations calibration and selected-site extractable ice remain open.

The [current terrain/reference increment](TERRAIN_REFERENCE_INCREMENT.md) and [cross-model audit](SCIENTIFIC_ENGINEERING_VERIFICATION.md) record the declared scope. [The machine-readable source audit](ACCEPTANCE_SOURCE_AUDIT.json) checks 681 retained source records, seven artifacts and 13 linkages. Current software evidence includes 179 JavaScript checks and 14 Python fixtures. Browser evidence is maintained separately in [the Windows Chrome review](BROWSER_VALIDATION.md).

## Selected published NASA reference study

The user selected a published NASA architecture rather than assigning invented equipment values. [Kleinhenz and Paz (2020), Case Studies for Lunar ISRU Systems Utilizing Polar Water](https://ntrs.nasa.gov/citations/20205007966), NASA NTRS 20205007966, describes a **two-site propellant-production architecture over 225 days**. The Logistics inspector and report display its own 23 source values, page links, source identity, declared exclusions and seven accounting/rounding checks.

| Published item / check | Reference result | Interpretation |
| --- | --- | --- |
| Printed hardware subtotal | 4,900 kg | Printed components total 4,890 kg; the 10 kg residual is retained as source rounding, not forced to zero |
| Ridge plus mine power demand | 46 + 22 = 68 kW | A demand ledger, not a supplied electrical-generation system |
| Water and regolith | 15 tonnes water; 398 tonnes regolith | At assumed 5 wt% water and 75% extraction/capture yield, 398 tonnes produces 14.925 tonnes; consistent with printed precision, not exact equality |
| Water concentration | 5 wt%, assumed | Does not establish any selected site's local extractable ice |
| Reference checks | 7/7 bookkeeping/rounding checks pass | Reproducible declared identities, not a reproduced unpublished subsystem model or physical equipment validation |

The study retains its own boundary and exclusions, including power generation/transmission and additional autonomy/communications, and does not explicitly model water cleanup or propellant delivery to the end user. The UI/source specification carries the full declared wording. Its masses, process yield and battery assumptions are not copied into unrelated legacy LCSS parameters. Maximum battery depth of discharge differs from conversion efficiency, and nameplate battery energy density does not establish installed storage mass.

Run `npm.cmd run engineering:verify-nasa` to verify all 23 transcriptions against the pinned PDF/specification and write `data/engineering/nasa-reference-validation.json`. The assessment is `nasa-polar-water-reference-1`, with `calibratedLegacyParameters: 0` and `acceptedForVerdict: false`.

## Earlier v4.3 evidence tracker (retained)

The following sections describe the original seven-value/two-PDF context tracker. They remain valid for that bounded scope; the separate current reference study above is additive.

## Delivered

The Logistics inspector and print report now include **Engineering evidence and calibration**. It lists two source PDFs with page links and SHA-256 identities, seven checked published values, all 20 current architecture inputs with their units and required evidence, and five explicit review gates. Related context is linked for seven inputs. JSON exports retain this evidence for both scenarios and include it in the existing canonical input hash.

All 20 architecture inputs remain planning assumptions. Matching a published number does not establish matching hardware, water streams or operating conditions. No reference value is automatically applied. `water-logistics-screen-2` adds evidence metadata; its mass equations, defaults and environmental isolation are unchanged. Accepted logistics remains `not_evaluated` and `acceptedForVerdict` remains false.

## Primary references and applicability

| Source | Checked values / pages | Applicability limit |
| --- | --- | --- |
| [NASA BVAD Rev. 2, February 2022](https://ntrs.nasa.gov/citations/20210024855) | Potable content 3.217 kg/crew/day; Table 3-31, printed p. 58, PDF p. 72 | One metabolic interface stream; not the entire gross circulating habitat demand |
| [NASA lunar water ISRU study, June 2021](https://ntrs.nasa.gov/citations/20210016820) | PDF p. 3: extraction 75%, battery 140 Wh/kg, maximum discharge 80%, production 225 days. PDF p. 8: rounded mass 4.9 tonnes and power 68 kW | Propellant architecture; mass excludes power supply/transmission and system thermal management. PDF p. 7 qualifies the operating timeline |

The reciprocal battery assumption is 1000/140 = 7.142857 kg/kWh of nameplate energy. This conversion does not establish installed storage mass. Maximum discharge and conversion efficiency also have different meanings. No propellant-architecture mass or power is divided into fictitious LCSS unit sizes.

## Reproduce the evidence checks

```powershell
npm.cmd run engineering:acquire
npm.cmd run engineering:verify
```

The first command verifies or downloads the exact PDFs pinned in `data/engineering-inputs.json`; changed bytes fail verification without repinning. Raw PDFs stay under ignored `data/raw/engineering`. The second uses the workspace Python runtime and pypdf, verifies checksums, extracts the declared PDF pages, compares all seven numeric transcriptions, and writes `data/engineering/reference-validation.json`. The small source specification and validation record are packaged; offline use does not require fetching PDFs. These are transcription checks, not seven independently accepted hardware models.

## Ordered engineering work still required

1. Define a single water architecture, stream-by-stream recovery balance and installed equipment boundary. Resolve capture versus extraction yield and usable storage versus conversion efficiency.
2. Acquire a matching equipment bill of materials, process/auxiliary/peak energy data, generation/distribution/storage design, and margin definitions. Validate against independent architecture-matched numerical cases.
3. Define startup and a 730-day operations schedule with outages, degradation, maintenance and replacement inventory. Short geometric visibility windows cannot substitute for this schedule.
4. Obtain applicable ice accessibility/yield evidence, or retain an explicitly hypothetical study with that interpretation accepted during review.
5. Record an independent engineering review and agreed numerical tolerances before enabling accepted logistics verdicts.

Historical v4.3 browser-host failures were later bypassed through the authorized Playwright/Windows Chrome path; see [the current browser evidence](BROWSER_VALIDATION.md). That review cannot close scientific or engineering gates. The six catalog horizons now extend to 500 km with a conditional beyond-extent height ceiling and local correlated ensembles, while independent absolute terrain accuracy and full global/orientation covariance remain open; see [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Historical v4.3 verification

At v4.3, all **129 JavaScript/API/DOM checks, six Python scientific fixtures and seven primary-reference transcription checks passed**. The bundled interaction test opens Logistics, confirms the 0/20 accepted count and PDF page link, verifies evidence in the scenario export, adjusts hypothetical ice and preserves the environmental result. Three dedicated engineering cases verify specification/source identities, assumption isolation despite matching published numbers, unit conversion, evidence ownership and unchanged mass results. Production and offline builds pass; the four earlier prototype fingerprints are preserved. Offline size is 14,223,016 bytes. The production bundle retains its large-chunk advisory; no actual browser performance claim follows from these checks.
