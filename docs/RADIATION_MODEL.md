# Radiation observations and primary-proton screening — v4.7

15 November 2026. Model `orbital-context-proton-csda-1`, report evaluator `workspace-evaluator-9`. Implements real historical orbital observations and a separate, limited primary-proton range/energy comparison. **Surface/human dose and full shielding effectiveness remain unassessed.**

## Use

Open **Screening → Radiation observations & proton shielding → Explore radiation evidence and primary protons**. A/B settings are independent. Select an archived month, CRaTER detector D1–D6, source lunar-shadow correction and minimum daily coverage. Separately select aluminum, polyethylene or liquid water, a tabulated incident energy, assumed normal areal density and panel area.

The left panel reports silicon absorbed dose rates from a historical detector product, qualifying-day counts, a daily chart with gaps, and source values/coverage/flags. The right panel reports the CSDA range and residual energy of a hypothetical monoenergetic primary proton at normal incidence, equivalent reference-density slab thickness and panel mass. A coverage curve and same-mass-per-area material comparison are included. No mission date, terrain sky fraction or orbital observation is used to scale the proton calculation.

## Observations: source and interpretation

[UNH's CRaTER PI legacy daily-dose product](https://crater-products.sr.unh.edu/data/inst/dose/table_l30drate.php) supplies **1285 daily entries from 26 June 2009 through 31 December 2012**, six measured detector rates and six source lunar-shadow-corrected rates, in **mGy in silicon per day**. The file is a legacy derived product from the instrument team, not a newly processed PDS event archive or a current radiation feed. The [NASA PDS PPI archive](https://pds-ppi.igpp.ucla.edu/data/lro-crater/) separately provides the underlying mission data and documentation.

Source `AB`, `NA` and `NE` entries are preserved as flags with unavailable numeric values; their operational causes are not guessed. Coverage flags are retained separately from zero or partial numeric coverage. Valid numeric zero remains a real value. Dates/DOY, column order, detector names, silicon units and coverage contracts are checked during preparation.

The viewer creates all calendar days in the selected archived month. Days outside the loaded interval, flagged values and days below the user coverage threshold are unavailable; no rates are filled or extrapolated. The mean is the unweighted arithmetic mean of qualifying daily rates, with the count/threshold explicit. It is not a complete-month dose, integrated exposure or future mission estimate. No uncertainty values were supplied in this legacy product, so uncertainty remains null. A source lunar-shadow correction does not convert orbital detector readings into lunar-surface dose. **Absorbed Gy in silicon is not effective/equivalent Sv in tissue.**

## Proton data and calculation

[NIST PSTAR, Standard Reference Database 124](https://physics.nist.gov/PhysRefData/Star/Text/PSTAR-t.html) provides 132 default energy rows per material, **396 rows** across aluminum, polyethylene and liquid water. Incident energies offered by this implementation are the exact tabulated energies from **1 to 1000 MeV**; inverse range lookup retains lower-energy rows down to 0.001 MeV. Source columns distinguish electronic, nuclear and total stopping power, CSDA range, projected range and detour factor. The calculator uses **CSDA range in g/cm²**, not projected range.

[NIST defines CSDA range](https://physics.nist.gov/PhysRefData/Star/Text/programs.html) through integration of inverse total stopping power. We use it as a straight-path, normal-incidence slab approximation. It does not transport secondary neutrons/fragments or reproduce projected penetration/scattering distributions. Reference densities are 2.6989 g/cm³ aluminum, 0.94 g/cm³ polyethylene and 1 g/cm³ liquid water, from the corresponding NIST material-composition pages; actual hardware/environment density is not measured here.

For incident tabulated energy E₀, source range R(E₀), normal areal density X and panel area A:

1. Remaining CSDA range = R(E₀) − X.
2. At X=0, retain E₀. If remaining range ≤0, report **CSDA range exhausted** and zero residual primary energy in this approximation. Secondary radiation and total dose remain unassessed.
3. For a positive remaining range, invert the monotonically increasing source range table. Exact range endpoints return the tabulated energy. Between endpoints, interpolate log energy against log CSDA range; report both the energy bracket and source lines.
4. If remaining range is below the lowest table value, return no estimated energy and a 0–0.001 MeV bracket. Do not extrapolate.
5. Thickness (cm) = X (g/cm²) / reference density (g/cm³).
6. Panel mass (kg) = X × 10 × A (m²), since 1 g/cm² = 10 kg/m².

Inputs allow X=0–1000 g/cm² and A=0.01–1000 m². These are numerical/assumption bounds, not approved shielding designs. The curve samples 31 areal densities from zero to the greater of the selected X and 1.2 times the selected incident CSDA range. It retains unavailable residual estimates. No exponential attenuation rule, dose-reduction percentage or universal material ranking is invented.

## Evidence acquisition and preparation

```powershell
npm.cmd run radiation:acquire
npm.cmd run radiation:prepare
```

Nine source assets are pinned in `data/radiation-inputs.json`: one CRaTER legacy table, three NIST proton tables, three composition pages and two NIST method definitions. POST request parameters for the NIST table service are retained. The acquisition canonicalizes NIST data/preformatted or composition text to exclude changing analytics/challenge scripts; the canonicalization recipes are explicit in the manifest. Changed pinned content fails verification instead of being silently replaced.

Raw evidence is under ignored `data/raw/radiation`. `scripts/prepare-radiation.py` verifies every source hash, CRaTER detector/unit/date/flag contracts, each NIST material identity/density, positive data and strictly increasing energy/range sequences. It writes the bundled `data/radiation/radiation-evidence.json` and `build-report.json`, including source hashes, counts and preparer/bundle SHA-256 identities. The offline app uses these checked records without network queries.

## Full dose-model research decision

The [Bond et al. OLTARIS dataset](https://pmc.ncbi.nlm.nih.gov/articles/PMC6920470/) and its publicly retrievable supplementary workbooks were inspected as candidates for dose-versus-shield lookup. The workbooks identify thickness, materials and phantoms but do not themselves supply dose units. The related analysis has a [2021 corrigendum](https://doi.org/10.1016/j.actaastro.2021.01.033) whose content was not obtained; its applicability is unresolved. These values are **not imported into the app** or assigned guessed dose units. This records an unresolved applicability gate, not a conclusion that the published dataset is wrong.

[OLTARIS](https://oltaris.larc.nasa.gov/) supports full radiation-transport calculations but requires approved account access. No account was created and no OLTARIS solver was run. The implemented NIST primary-proton comparison does not substitute for that solver. A future accepted surface/shelter dose feature needs a defined GCR/SEP spectrum and event/time context, geometry/material layering, secondary/albedo transport, response quantity/quality factors, verified units/corrections and suitable independent reference cases. No health limit or safety verdict is offered.

## Reports, defaults and verification

Exploration starts disabled. Stored examples use the December 2012 D1 measured archive with a 95% coverage filter, and an independent 100 MeV primary-proton case through 5 g/cm² aluminum over 10 m². These choices do not describe any selected future mission.

JSON `radiationExploration` and print reports retain settings, source/units, selected daily records/flags/coverage, proton range/energy brackets, interpolation provenance, reference thickness/mass, sources and limitations. Canonical hashing includes the layer. `surfaceDose`, `effectiveDose` and `secondaryTransport` remain `not_evaluated`, `terrainApplied` is false and `acceptedForVerdict` is false. Environmental verdicts, Diviner history and the existing upward-solid-angle context remain independent.

Independent fixtures check the 100 MeV aluminum CSDA range **10.01 g/cm²**, distinct from its **9.976 g/cm² projected range**; zero shield; exact exhaustion; lower-table boundaries; a geometric interpolation midpoint; and the mass conversion **5 g/cm² × 10 m² = 500 kg**. CRaTER fixtures check measured D1 **0.10356 mGy Si/day** and source-corrected **0.15486** on 31 December 2012, partial coverage and flagged data. These are source/numerical checks, not full radiation-transport, physical shielding or rendered-browser acceptance.

Final verification: **159 JavaScript/API/DOM checks and eight Python scientific/ingestion fixtures pass**. Seven dedicated radiation cases cover bundle/source/preparer identity, quantity separation, NIST inverse endpoints/brackets and units, archived values/flags, immutable evidence, invalid edits and A/B isolation. The bundled UI case checks archive/correction/source flags, proton-range status, material/input changes and reports; pending preparation disables controls. Production/offline builds pass; four earlier prototypes remain unchanged. Offline size is 14,784,350 bytes; production retains its large-chunk advisory. Browser timing, graphics and rendered accessibility remain unverified.

[Retained example outputs](RADIATION_VALIDATION.json) compare the same hypothetical 100 MeV primary proton through 5 g/cm² and 10 m² panels. Aluminum yields an interpolated **67.6348 MeV** residual, polyethylene **52.1006 MeV**, and water **55.8487 MeV**, with **500 kg** panel mass in all three cases. These energy numbers are not dose values or overall material-protection rankings. Reference densities change thickness, not mass at fixed areal density/area.
