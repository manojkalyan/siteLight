# Conditional plume/ejecta exploration — v4.6

15 November 2026. Model `conditional-spherical-ejecta-1`, report evaluator `workspace-evaluator-8`. Implements the **post-acceleration trajectory** increment. Engine-driven erosion, launch distributions and damage prediction remain unassessed.

## What is implemented

Open **Screening → Plume & ejecta exploration → Explore conditional ejecta trajectories**. Set a particle's assumed release speed, elevation, bearing and height after plume acceleration. Set a spherical grain diameter/density for single-grain mass and energy. Add/remove up to five hypothetical assets, each with a name, include state, surface distance/bearing, circular footprint diameter and radial height. A/B settings are independent.

The panel shows ideal-sphere surface range, flight duration, peak height, landing speed, a trajectory profile and illustrative north-up asset layout. For each included asset it distinguishes a footprint miss, an asset outside the flown segment, a trajectory passing above it, or geometric entry into its assumed envelope. Entry results include elapsed time, height, speed and **one grain's** total kinetic energy. No intersection in one trajectory does not establish asset safety.

The site/start is retained as illustrative scenario context. Source DEM elevations, terrain shielding and actual asset coordinates are not applied. This model is deliberately separate from the real terrain/visibility evaluator. Default release and asset inputs are hypothetical examples, not observed landing or soil values.

## Source/model decision

| Primary reference | Use | Boundary |
| --- | --- | --- |
| [Shipley, Metzger and Lane, 2014, Lunar Cold Trap Contamination by Landing Vehicles](https://ntrs.nasa.gov/citations/20140017853), PDF pp. 2–3 | Ideal spherical central-gravity ballistic framework and conserved orbital quantities | We implement one prescribed neutral-particle trajectory, not the paper's ensemble/contamination prediction |
| [Lane and Metzger, 2010, Ballistics Model for Particles on a Horizontal Plane in a Vacuum Propelled by a Vertically Impinging Gas Jet](https://ntrs.nasa.gov/citations/20100031187), PDF pp. 1–2 | Records the engine/CFD-to-trajectory dependency for future plume coupling | Fitted gas-acceleration parameters and incomplete CFD matrices are not transferred to arbitrary engines or soil |
| [JPL Planetary Satellite Physical Parameters](https://ssd.jpl.nasa.gov/sats/phys_par/sep.html), Moon row | Rounded GM 4902.800 km³/s² and mean radius 1737.4 km | Fixed constants for this ideal sphere; the DE440-tagged GM is separate from the existing DE421/MOON_ME visibility chain |

NASA's [PSI project](https://www.nasa.gov/plume-surface-interaction/) distinguishes flow, erosion and ejecta dynamics. This increment supplies the final ballistic stage with a user-specified release state. A validated engine/nozzle/descent/soil/CFD case is still needed before deriving launch states, erosion rate or total ejected mass. Empty engine controls would not establish those quantities, so no numerical thrust-to-hazard conversion is offered.

Three raw references are pinned in `data/plume-inputs.json`. `data/plume/constants.json` selects the two JPL values; `data/plume/reference-validation.json` records source/specification hashes and transcription status. Source acquisition and constant transcription are reproducible:

```powershell
npm.cmd run plume:acquire
npm.cmd run plume:verify
```

Acquisition verifies existing bytes or downloads the exact pinned references. Changed bytes fail without silent repinning. Verification checks all three hashes and the two numerical values in JPL's Moon table row. Raw files remain under ignored `data/raw/plume`; source metadata/constants are embedded for offline calculation. Reference verification does not validate an engine or an asset damage response.

## Mathematical model

Let R be the mean radius, μ the central gravitational parameter, h₀ release height, v release speed and θ elevation above horizontal. Distances use metres, times seconds, angles radians internally. Set r₀ = R+h₀, v_t = v cos θ, v_r = v sin θ, angular momentum per mass H = r₀ v_t, p = H²/μ, k = p/r₀ and e_y = −v_r H/μ.

For angular travel φ in the trajectory's great-circle plane:

- r(φ) = p / [k cos φ + (1−cos φ) + e_y sin φ].
- Height is r−R; the implementation rearranges this expression and evaluates 1−cos φ as 2 sin²(φ/2) to avoid loss of precision at short ranges.
- First post-release return to the sphere solves height = 0 by a 75-iteration bracketed bisection. Supported trajectories are bound and return before φ = π.
- Surface range = R φ_end. Peak angle = atan2(−e_y, 1−k).
- Elapsed time = ∫ r²/H dφ, using composite Simpson integration with 128 subintervals.
- Radial velocity = (μ/H)[(k−1) sin φ − e_y cos φ]; tangential velocity = H/r. Their magnitude supplies encounter/landing speed.
- Grain mass = density × π/6 × diameter³, with micrometres converted to metres. Conditional kinetic energy = ½ m v_encounter². At a specified release state, changing mass does not change vacuum geometry.

For an asset at surface arc distance d and relative bearing Δ, the nearest point on the trajectory's great circle has phase atan2(sin(d/R) cos Δ, cos(d/R)); cross-track angle is asin(sin(d/R) sin Δ). A spherical circular-footprint calculation finds the along-track entry/exit interval. That interval is clipped to the actual flown segment. The trajectory must also fall within the declared radial asset height. A descending top entry is solved separately by bisection. The column is an angular footprint with radial height, not a detailed solid/vehicle mesh; particle finite radius and impact-normal energy are not evaluated.

The trajectory has one apex in the supported interval, so minimum height over a clipped footprint interval occurs at an endpoint. Only the earliest geometric entry is reported. Footprint/bearing and height checks are geometric conditional tests, not stochastic exposure estimates.

## Numerical domain and defaults

The implemented domain is **1–500 m/s**, **0.1–80°** elevation, **0–100 m** release height and **0–359.99°** bearing. It is a software/numerical scope, not a certified physical-validity envelope. Faster ejecta and escape trajectories remain unassessed; unsupported inputs are rejected rather than capped. Assets may be 1–100000 m away, 0.1–1000 m in footprint diameter and 0.1–100 m high. At most five are supported. Grain diameter spans 1–10000 µm and density 100–10000 kg/m³ as assumed inputs.

The model starts disabled. Stored examples are 100 m/s, 5° elevation, northward bearing, 0.1 m release height, 100 µm grain diameter and 3000 kg/m³ density. Two explicitly hypothetical assets are supplied for editing: a 1000 m northward habitat footprint and a 500 m eastward array footprint. No actual lunar infrastructure is asserted.

## Exclusions and reporting

No engine thrust/nozzle/descent solution, soil cohesion/erosion, post-release gas drag/lift, particle collisions, electrostatics, lunar rotation, asymmetric gravity, terrain interception, berms, rebounds or shielding is modeled. No source supplies a launch particle-count/speed/size distribution for the chosen site. Hence there is no mass flux, deposition, damage probability, material damage threshold, EVA waiting time or safe exclusion distance.

JSON `plumeExploration` retains independent A/B release/asset assumptions, illustrative site/start, physical/source identities, trajectory samples, asset states, conditional encounter values and exclusions. `engineErosion`, `particleDistribution` and `damage` remain `not_evaluated`, `terrainApplied` is false and `acceptedForVerdict` is false. Print reports retain dimensions, assumptions and results; canonical hashing includes the extension. Core environmental results and historical Diviner observations remain unchanged.

## Numerical verification

Independent fixtures verify the surface-release closed-form range and equal release/landing speeds, and compare the angle-domain conic/time quadrature against a separate Cartesian RK4 time integrator in six cases including speed/angle/height boundaries. Declared software comparison tolerances are 0.001 m range, 0.0001 s flight time and 0.00001 m/s landing speed. These are agreement tolerances between implementations of the same ideal physics, not physical prediction-error bounds.

Other cases cover off-bearing/above/beyond-range/excluded assets, descending top entry, bearing rotation, first geometric entry, diameter-cubed mass/energy scaling, malformed inputs, immutable reports, transactional add/edit/remove and A/B isolation. The bundled interaction case exercises controls, escaped asset names, invalid values, source/qualification output and reports. Pending scientific preparation disables ejecta inputs and asset actions. Rendered browser/GPU review and operational plume engineering validation remain open.

Final verification: **151 JavaScript/API/DOM checks pass**, including seven dedicated ejecta cases and a bundled release/asset/report interaction case. Three source checksums/two published constants pass reference verification. Production/offline builds pass; four earlier prototype fingerprints are preserved. Offline HTML is 14,262,576 bytes; production retains the existing large-chunk advisory. These are numerical/source/DOM checks, not a rendered-browser or physical plume acceptance.

[Retained hypothetical examples](PLUME_VALIDATION.json) preserve all assumptions and source identities. The default release yields range **1074.033 m**, flight **10.7816 s** and peak height **23.5668 m**. Its two example assets are passed above/missed. Raising the northward asset envelope to 100 m produces first geometric entry at **995 m**, after **9.9882 s**, at **6.4199 m** altitude and **99.8973 m/s**; one assumed 100 µm, 3000 kg/m³ grain has **7.83786×10⁻⁶ J** kinetic energy there. No damage threshold, particle count or real plume observation is assigned to this result. Published-constant and release-state uncertainties are not propagated.
