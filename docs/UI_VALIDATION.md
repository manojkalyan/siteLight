# SiteLight — screening UI validation sample

Open [lunar-validation-prototype.html](../lunar-validation-prototype.html) directly in a modern browser. This is a separate, self-contained file. Both earlier prototypes are preserved.

## Design to review

- **Compare:** Quiet A/B workspace, shared requirements, date preview, and separate environment/terrain/gap/thermal state shortcuts.
- **Explore:** Embedded immersive terrain with the same selected scenario and controls as the hybrid sample.
- **Screening:** Terrain footprint/slope/coverage, continuous visibility gaps, thermal data readiness, and later-model requirements.
- **Logistics:** A labeled fictional mass-layout example; no calculated LCSS verdict.
- **Data:** What is synthetic, what remains to acquire, and the source routes.

## Five-minute review

1. Select scenario B, then open **Screening → Terrain**. Change the assumed slope limit, assessment radius, and calculation baseline.
2. Enable **Show a missing-coverage example**. Confirm the status changes to insufficient coverage even if the remaining samples have gentle slopes.
3. Open **Visibility gaps**. Distinguish direct darkness, geometric Earth loss, and time below the solar criterion. Check timestamps and window-boundary labels.
4. Enable your continuous-gap requirements. Confirm these findings stay separate from the environmental fractions.
5. Preview a date in Compare, switch through Explore and Screening, then reset. The original scenario date should remain until Apply preview.
6. Open Thermal and Later models. Unsupported temperatures, dose, plume, and rescue predictions must remain absent.

## Interpretation

Terrain statistics are calculated from the procedural demonstration surface, with an explicit fictional scale of 20 m per scene unit in all axes. They are not lunar measurements. Sample spacing is 10 m under that fictional scale; slope baseline and footprint are user controls. Roughness is plane-detrended RMS height over covered samples, not an uncertainty or vehicle stability value.

Direct darkness uses geometric Sun obstruction. Solar-ineligible time additionally includes the chosen elevation threshold. These terms are intentionally distinct. The longest gap is measured within the selected window; a boundary-touching gap can extend beyond that window. No battery, RF, or relay model is inferred.

No real Diviner product is loaded. The thermal screen presents the required product metadata and validation steps instead of generating a temperature. Logistics and advanced physical models remain outside the evaluated environmental result.

## Technical verification

Run `npm test`. The checks include known slope planes, detrending, coverage loss, unknown gap spans, boundary intervals, optional outage limits, startup, navigation, and preservation of the older files.

Run `node scripts/build-validation-prototype.mjs` to regenerate this sample from the existing hybrid and immersive files. The builder records and verifies their fingerprints without changing them. Actual browser/GPU visual verification is separate from the automated contract tests; the preview service was unavailable during this work.

**Verification record, 14 November 2026:** `npm test` passed all 40 automated checks across the three prototypes. These include mathematical reference fixtures and DOM-contract interaction tests, not a real browser rendering or scientific validation. Source fingerprints confirm the earlier two HTML files were preserved.
