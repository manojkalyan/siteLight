# Dust and radiator optical sensitivity — v4.5

14 November 2026. Model `radiator-optical-balance-1`, report evaluator `workspace-evaluator-7`. Implemented as opt-in exploration with independent A/B device inputs. Engineering calibration and operational thermal acceptance remain open.

## Use and interpretation

Open **Screening → Dust & radiator sensitivity → Explore optical dust effects**. Select a laboratory simulant endmember or custom assumed optical properties, then set coverage, active radiating area, internal heat, incident shortwave flux, clean-coating optics, radiative sky view factor, black sky/ground temperatures and a temperature comparison limit.

The panel compares clean and dust-covered equilibrium temperatures in K/°C, effective optical coefficients, heat-rejection capacity at the chosen limit and the remaining internal-heat margin. It shows a 21-sample coverage curve (0–100%, five-percentage-point increments), with the selected coverage evaluated exactly. Temperature and capacity changes retain their sign. Negative capacity means the assumed external heating exceeds rejection at the chosen limit even with zero internal heat; it is not clamped to zero.

All geometry, coverage, clean-coating properties, heat loads, boundary temperatures and comparison limits are planning assumptions. A chosen material is a laboratory endmember, not a selected-site observation or a measured dusty-coating response. No thermal-survival or mission verdict follows. Inputs remain independent of site/date; historical Diviner observations and the terrain solid-angle context are preserved separately.

## Primary data and model references

| Reference | Implemented use | Boundary |
| --- | --- | --- |
| [Gaier, Ellis and Hanks, 2011](https://ntrs.nasa.gov/citations/20110013486), Table 2, PDF p. 10 | Fine-particle (<20 µm) solar absorptance / 300 K emittance presets: JSC-1A 0.75/0.83; NU-LHT-2M 0.45/0.78; OB-1 0.73/0.92 | Laboratory simulants. Constant emittance away from 300 K is an unvalidated extrapolation |
| [NASA Thermal Impacts of Lunar Dust for Rovers, 2024](https://ntrs.nasa.gov/citations/20240009989), Eqs. 1–2, PDF p. 3 | Area-weighted optical mixture as an initial approximation | Not conservative; does not reproduce nonlinear dust-on-coating behavior or layer conduction |
| [NIST CODATA Stefan–Boltzmann constant](https://physics.nist.gov/cgi-bin/cuu/Value?sigma%7Csearch_for=stefan+boltzmann) | σ = 5.670374419 × 10⁻⁸ W m⁻² K⁻⁴ at displayed precision | Physical radiation constant; not a radiator calibration |

The two NASA PDFs are pinned in `data/dust-inputs.json`. `data/dust/materials.json` specifies the exact table rows/column meanings. `data/dust/reference-validation.json` retains source/specification identities and three verified rows (six numeric properties). Selecting an unverified preset is rejected.

```powershell
npm.cmd run dust:acquire
npm.cmd run dust:verify
```

Acquisition verifies existing bytes or downloads pinned files; changed sources fail rather than silently repinning. Verification uses the workspace Python runtime/pypdf, checks both PDF hashes and reads the selected primary table. Raw PDFs are under ignored `data/raw/dust`; small checked data and metadata are bundled for offline use.

## Equations and accounting

Assume one opaque diffuse radiating surface with area A, insulated back, uniform equilibrium temperature T and constant optical properties. The incoming shortwave flux G is already incident on the radiator, including any assumed direct/reflected component; no additional solar-incidence factor is applied. Sky and ground are black reservoirs with temperatures T_s and T_g. The **radiative** sky view factor F and its ground complement 1−F sum to one.

For assumed dust area fraction c:

- α(c) = (1−c) α_clean + c α_dust.
- ε(c) = (1−c) ε_clean + c ε_dust.
- B = F T_s⁴ + (1−F) T_g⁴.
- Heat balance: Q_internal + α G A + ε σ A B = ε σ A T⁴.
- Equilibrium: T = [B + (Q_internal/A + α G)/(ε σ)]^(1/4).
- Internal heat-rejection capacity at limit T_limit: Q_capacity = ε σ A (T_limit⁴ − B) − α G A.
- Heat margin = Q_capacity − Q_internal. Equality fits with a 10⁻⁸ W numerical comparison tolerance; this is not a scientific uncertainty allowance.

The code exports each absorbed/emitted heat term and the balance residual. Solar absorptance and IR emittance describe different spectral bands; incoming IR absorption uses IR emittance consistently. No physical dust thickness or mass is inferred from area coverage. The displayed upward sky solid-angle fraction is not substituted for a radiative view factor.

## Defaults and exclusions

The disabled-by-default model stores 25% hypothetical coverage, 1 m² area, 200 W internal heat, 500 W/m² incident shortwave flux, clean α/ε = 0.2/0.9, sky view factor 1, sky 3 K, ground 250 K and comparison limit 350 K. The selected default endmember is the checked JSC-1A laboratory pair. The custom option stores assumed α/ε = 0.8/0.9. These device/environment defaults are examples without engineering calibration. In a full-sky-view case, the ground temperature has zero contribution.

No dust-layer/grain conduction, insulating blanket response, abrasion, cleaning, degradation, transient heat capacity, mount/back conduction, two-sided exchange or spectral/directional detail is modeled. The curve may underpredict real contamination effects. Optical coefficients are held constant; no valid temperature extrapolation range or confidence interval is invented. Next engineering work requires a chosen coating/device, applicable measured dusty response and thermal test cases, followed by a justified layer/conduction/transient model where relevant.

## Reports and verification

JSON `dustExploration` retains independent settings/results for A/B, selected versus custom properties, evidence categories, source PDF hashes, material specification SHA, constants, heat terms, signed differences, coverage samples and exclusions. It remains `acceptedForVerdict: false`. The canonical report hash includes this layer; the print report preserves assumptions and both results. Disabled models produce no temperatures.

Independent reference checks include a 2 m² black radiator with 918.600655878 W internal heat, zero external flux and a 0 K sky: T = 300 K, exactly at a 300 K limit. Doubling area at fixed load gives 300/2^(1/4) K. A zero-load surface exchanging with black reservoirs at 100 K/300 K and view factors 0.25/0.75 has T⁴ = 0.25·100⁴ + 0.75·300⁴. Tests also cover endpoints, mixed optics, negative heat capacity, signed warming/cooling, source identities, invalid inputs, A/B/state isolation, loading guards and bundled UI/report interactions. Rendered browser/GPU review remains outside these numerical/DOM checks.

Final verification: **143 JavaScript/API/DOM checks pass**, including seven dedicated dust data/numerical/state cases and the bundled dust interaction case. Three material rows/six optical values pass the primary-PDF transcription check. Production/offline builds pass and four earlier prototypes are preserved. The offline HTML is 14,245,502 bytes; the production bundle retains the existing large-chunk advisory. No browser performance or visual acceptance is inferred.

[Retained example comparisons](DUST_VALIDATION.json) use the declared default device/environment settings and all three laboratory endmembers. At 25% coverage, the illustrative JSC-1A case gives clean **276.896 K**, dust-covered **292.989 K**, change **+16.093 K**, with a heat-balance residual below 10⁻¹² W. This is a numerical model example with laboratory endmember data, not an observed radiator or lunar-site temperature.
