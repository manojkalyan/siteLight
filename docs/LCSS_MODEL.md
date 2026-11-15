# Water-logistics screening model — version 1

**v4.3 evidence update:** Model identifier `water-logistics-screen-2` preserves the equations/defaults below and adds [engineering evidence tracking](ENGINEERING_CALIBRATION.md). The inspector, print view and JSON include two pinned NASA primary references, seven verified transcriptions, parameter applicability requirements and review gates. All 20 architecture parameters remain planning assumptions; no architecture-specific source value is silently adopted. Earlier verification counts below are historical snapshots.

Status: implemented exploratory calculator, analytical fixtures verified; independent engineering calibration/review pending. This is the LCSS exploration layer, not an accepted production logistics constraint. Environmental results remain separate.

## Accounting boundary

The calculator estimates a **water-logistics system subtotal in kg** for four crew over 730 days. Contributors are Earth-supplied water, installed extraction units plus shared balance of plant, ISRU power generation, ISRU energy storage, life-support hardware and dry-system spares. Equipment is deployed once for the two-year period. Initial inventory and reserve water are always Earth supplied. Produced water replaces only net makeup water, and production is curtailed at the target; unused rated capacity is not credited as another mass saving.

The model excludes food, unrelated oxygen supplies, habitat, launch packaging, lander/transport and deployment mass. Startup scheduling, excavation accessibility, degradation, maintenance outages, contamination and a validated two-year power supply are outside this version. Hardware mass inputs must include the installed excavation, extraction, capture, purification and feed equipment appropriate to the user's architecture. The entered balance-of-plant mass covers shared facilities rather than a second copy of per-unit equipment. Hardware assumptions require engineering review.

## Inputs and provenance

All numeric defaults are **planning assumptions**, not calibration to any selected site. Inputs and supported ranges are defined in `src/workspace/logistics.mjs` and editable in the Resources inspector. The four crew/730 days, 75% recovery, 2.5 kW per unit, 20 kg/kW generation, 8000 kg hardware, 10% spares and 18000 kg budget are inherited from the user brief. Additional defaults complete a reproducible illustrative architecture:

| Input | Default | Interpretation |
| --- | --- | --- |
| Gross circulating water demand | 4 kg/crew/day | Assumed demand stream to which loop recovery applies; not a drinking-water prescription |
| Initial inventory / reserve | 100 kg / 30 makeup-demand days | Both imported; reserve is not counted as dry spares |
| ISRU share of net makeup | 1 | Target, curtailed to demand |
| Ice concentration | 1 wt% independently for A/B | Hypothetical, user-adjustable 0–6 wt%; not assigned from a remote measurement |
| Extractable fraction / capture recovery | 0.5 / 0.75 | Multiply ice concentration; not measured local yield |
| Regolith throughput | 20 kg/h/unit | Mechanical throughput ceiling |
| Process energy | 0.1 kWh/kg regolith + 0.5 kWh/kg recovered water | Assumed complete process-load coefficients |
| Duty | 0.5 | Average operation over 730 days; independent of the short visibility calculation |
| Installed extraction unit / shared plant | 150 kg/unit / 500 kg | Assumed installed masses; no claim of complete engineering sizing |
| Storage autonomy / efficiency / specific mass | 72 h / 0.9 / 10 kg/kWh | Storage sized to installed ISRU nameplate power; conservative simultaneous-unit load assumption |

[NASA's ISS water-recovery milestone](https://www.nasa.gov/missions/station/nasa-achieves-water-recovery-milestone-on-international-space-station/) supplies context for recovery technology. Its 98% ISS result does not establish lunar loop recovery or replace the assumed default. [NASA's polar water ISRU architecture study](https://ntrs.nasa.gov/citations/20210016820) illustrates architecture-dependent mass/power; its propellant-scale hardware is not rescaled into this calculator.

[Colaprete et al. 2010](https://pubmed.ncbi.nlm.nih.gov/20966242/) report an estimated 5.6 ± 2.9 wt% water ice for sampled Cabeus impact ejecta. The app retains this as a separate context measurement, including location, uncertainty and a null depth field; it does not apply it to the selected point. The hypothetical input and the source measurement remain distinct in exports. No concentration is inferred from a PSR, temperature, hydrogen proxy or rendered terrain.

## Equations and units

Let C = 4 crew, D = 730 days, d = gross demand (kg/crew/day), r = loop recovery fraction, R = reserve days, I = initial inventory (kg), s = ISRU share of makeup, w = ice wt% / 100, f = extractable fraction, and η = capture/purification recovery.

1. Gross water G = C D d; recovered water = G r; makeup M = G(1−r).
2. Reserve B = C d(1−r) R. Production target T = M s. Recovered water per regolith mass y = w f η.
3. Process energy per regolith mass e = e_regolith + y e_water (kWh/kg regolith).
4. Effective regolith throughput q = min(q_mechanical, P_unit/e), in kg/h. Operating hours H = 24 D duty. Rated water capacity per unit U = q H y, in kg.
5. Units n = ceil(T/U) if both T and U are positive; otherwise n = 0. A 1e−12 dimensionless rounding tolerance handles exact floating-point integer capacity boundaries. More than 100000 units is rejected rather than silently capped.
6. Produced water W = T if n > 0, else 0. Regolith processed = W/y when y > 0. Process energy = regolith processed × e. Import makeup = M−W. Earth-supplied water = I+B+M−W.
7. Installed power P = n P_unit. Nameplate storage energy = P × autonomy / storage efficiency. Generation mass = P × generation specific mass; storage mass = nameplate storage energy × storage specific mass.
8. Extraction equipment mass = n × installed unit mass + shared plant mass if n > 0, else zero. Dry-system mass = extraction equipment + generation + storage + life-support hardware. Spares mass = dry-system mass × spares fraction.
9. Total subtotal = Earth water + dry-system mass + spares. Budget margin = budget − total. Exact equality fits; an absolute 1e−8 kg floating-point comparison tolerance is used.

At zero concentration, zero extractable yield, zero capture recovery or zero target, all required makeup water is imported and no ISRU hardware/power/storage is installed. A power-limited architecture can increase unit count. Unit-count steps and removing ISRU at zero concentration make the function nonmonotonic; a monotonic root finder would be inappropriate.

## Search and result scope

The search directly evaluates 61 concentrations from 0 to 6 wt% in 0.1 wt% increments. It chooses the fitting sample nearest the selected scenario's current assumption; lower concentration wins a tie. Applying the proposal changes exactly the ice assumption for the selected scenario and re-evaluates it. The UI explains zero-ice import behavior and no-fit outcomes. This is an exploratory budget fit, not evidence of a locally available resource or an operational mission fix.

The inspector offers opt-in exploration, independent A/B ice assumptions, shared architecture inputs/budget, contributor attribution, and mass-balance/plant readouts. JSON reports include settings, model version, evidence categories, sources, all contributors and `acceptedForVerdict: false`; canonical input hashes include this layer. The top-level accepted logistics status remains `not_evaluated` and environmental decisions retain their previous scientific qualifications.

## Analytical reference cases

- Default all-import case: gross 11680 kg; net makeup 2920 kg; reserve 120 kg; initial 100 kg; Earth water 3140 kg; hardware 8000 kg; hardware spares 800 kg; total **11940 kg**.
- Independent capacity fixture: demand 1 kg/crew/day, no recovery/reserve/initial water, 6 wt% ice, full extractable/capture fractions, 1 kg/h regolith throughput, 1 kW/unit, 0.001 kWh/kg regolith, zero additional water energy, continuous operation, 100 kg/unit, zero shared plant/storage/spares, 10 kg/kW power and 1000 kg hardware. Unit water capacity = 1051.2 kg; required units = 3; subtotal **1330 kg**. A 1330 kg budget fits; 1329 kg fails. At 3 wt%, six units produce a **1660 kg** subtotal.
- Power/storage fixture: change regolith energy to 2 kWh/kg, add 10 h autonomy, 0.5 efficiency and 2 kg/kWh storage. Throughput becomes 0.5 kg/h/unit; six units require 6 kW and **240 kg storage**.

Automated checks cover these independently calculated outputs, invalid values, no-extraction behavior, sums/mass balance, unit steps, exact thresholds, sampled search proposals/no-fit, immutable inputs and isolation from environmental decisions. Scientific acceptance still requires engineering review, credible installed masses and energy coefficients, architecture-specific validation, and site-applicable resource evidence or explicitly accepted hypothetical exploration. No accepted logistics-only mission verdict is claimed yet.

Implementation verification on 14 November 2026: 110 JavaScript/API/DOM checks pass, including six dedicated numerical/state cases and a bundled UI interaction case. Production and standalone builds pass. The four earlier prototype fingerprints remain unchanged. Rendered browser/GPU and independent engineering review remain pending.
