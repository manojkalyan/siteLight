**v4.2 delivery:** [Monthly robustness, terrain connectivity and sky geometry](ADVANCED_PLANNING.md) are implemented. Dust, plume, radiation-dose and rescue work now has explicit source/input/reference requirements in that document; their numerical operational models remain gated.

**Implementation update (14 November 2026):** Real 125 km multiscale horizons, source-RMS sensitivity, ranked diagnostics and historical Diviner context are now implemented. See [increment 3](SCIENCE_INCREMENT_3.md). The research/model gates below still apply.

# SiteLight AI — additional features and real-data roadmap

**Reviewed:** 14 November 2026  
**Status:** Approved staged roadmap: terrain and continuous-gap screening next, thermal context conditional, advanced physical/operational models gated. No new scientific dataset or numerical model is implemented by this documentation update.  
**Authority:** [PRDnew.md](../PRDnew.md), with work order in [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md).

The [supplied research notes](reference/user-supplied-extension-research.txt) describe useful topics but also make unsupported assumptions about data availability, universal limits, and safety predictions. The roadmap below narrows each topic to an output the available evidence can support.

## 1. Approved additions and staging

| Extension | Stage | Useful deliverable | Data/method gate |
| --- | --- | --- | --- |
| EXT-01 — Terrain screening | First extension after real terrain ingestion | Slope, optional scale-defined roughness, footprint coverage, and uncertainty | Covered DEM and documented spatial scale; no vehicle safety inferred |
| EXT-02 — Continuous visibility gaps | Alongside the core visibility evaluator | Longest darkness and geometric Earth-outage intervals with timestamps | Validated shared visibility series and sufficient coverage |
| EXT-03 — Thermal context | Next bounded layer | Surface-temperature product overlay, extent, units, and comparison to a declared threshold | Appropriate Diviner product, temporal meaning, quality mask, and resolution |
| EXT-04 — Terrain connectivity | Optional later demonstration | Connected terrain/path under explicit geometric screening assumptions | Covered DEM, declared slope/cost rules, and reference route fixtures |
| EXT-05 — Dust/thermal sensitivity | Research only until model accepted | Literature evidence and parameter sensitivity for a specified thermal system | Dust loading/optical properties, device geometry/heat loads, and accepted thermal model |
| EXT-06 — Plume/ejecta assessment | Research only | Inspect model inputs and applicability; later validated vehicle-specific outputs | Propulsion/descent configuration, regolith inputs, and PSI validation |
| EXT-07 — Radiation context | Research only for dose | Radiation observations and, separately, geometric sky-view context | A justified radiation transport/environment model before any dose estimate |
| EXT-08 — Contingency reachability | Research only | Conditional route/time assessment for declared assets | Actual or explicitly hypothetical asset, mobility, availability, communication, and endurance inputs |

EXT-01/02 are approved as the next required screening additions. Keep the current core working and make EXT-03 conditional on coverage and time. EXT-04 remains optional, and EXT-05 through EXT-08 are accepted research/model-definition backlog items rather than unsupported numerical promises. Not every topic is a hackathon delivery requirement.

## 2. Real-data and reference sources

### Terrain, slope, roughness, and coverage

NASA [PGDA Product 78](https://pgda.gsfc.nasa.gov/products/78) offers polar elevation, slope, height/slope uncertainty, count maps, and terrain variants for listed regions. Use the existing DS-03/04 routes in the PRD to select exact products. Additional coverage may come from [PDS LOLA](https://pds-geosciences.wustl.edu/missions/lro/lola.htm).

For image inspection and additional terrain models, use the [LROC product selector](https://data.lroc.im-ldi.com/lroc/rdr_product_select) and [LROC PDS archive](https://pds.lroc.im-ldi.com/data). The [LROC release description](https://www.lroc.im-ldi.com/news/1497?tag=PDS+Release) identifies image and DTM collections.

**Proposed method:** Specify an assessment point, area/footprint, and spatial baseline. Report slope statistics and coverage. If deriving roughness, publish the detrending/window definition. A coarse product cannot establish the absence of unresolved rocks. Keep boulder screening not evaluated without suitable imagery, a detection/inspection method, and known detection limits.

**Acceptance:** Use synthetic reference planes and known terrain cases to check slope/scale handling; test DEM edges and gaps. Display area assessed and fraction covered. Use user/vehicle-specific screening limits rather than a universal safe angle.

### Darkness and direct-to-Earth gaps

Reuse real geometry from DS-01/02 and terrain horizons from DS-03/04. No new universal blackout map is needed: compute contiguous loss intervals for the requested point, observer height, dates, and visibility convention. NASA's [Lunar Surface Propagation project](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/) discusses terrain-related RF complications; this is a distinct modeling problem from geometric visibility.

**Proposed output:** Longest and individual darkness/Earth-invisibility intervals, whether they cross assessment boundaries, and comparison with a user-declared tolerated outage. Do not hard-code a universal 24-hour limit. A visibility shortfall means the chosen requirement is unmet; it does not by itself prove a relay is mandatory or justify adding a fixed relay mass to LCSS.

Do not infer Earth invisibility from a permanently shadowed-region label. Evaluate Earth geometry independently. Relay coverage, when later modeled, needs specified assets/orbits and service assumptions; full RF link performance remains separate.

### Surface temperature

Use [PDS Diviner products and documentation](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm), especially a selected derived regional/polar product where appropriate. Retain whether a quantity is an observation, aggregate, or modeled product, along with dates/local-time context, spatial scale, and missing-value semantics.

**Proposed output:** Surface-temperature context, such as a product-supported minimum/maximum layer, with the source period visible. Historical or aggregate temperatures do not automatically predict a particular future landing timestamp. Do not equate surface temperature with cabin, battery, or radiator temperature.

**Acceptance:** Check units and any Kelvin/Celsius conversion, no-data masks, point/product coverage, and time interpretation. A user threshold is a screening assumption, not validated hardware survival.

### Dust and radiator performance

NASA's [Thermal Impacts of Lunar Dust For Rovers](https://ntrs.nasa.gov/citations/20240009989) describes dust effects and unknowns for thermal surfaces. These reports support model development; they are not a site-by-site radiator-efficiency raster.

**Required additional inputs:** Deposited dust quantity/properties, radiator coating/geometry, orientation, heat load, environmental view factors, and a justified degradation model. Regional regolith composition alone is insufficient to produce a validated radiator mass penalty. Keep any sensitivity assumptions explicit and do not feed a speculative penalty into an accepted LCSS result.

### Plume-surface interaction and ejecta

NASA's [PSI project](https://www.nasa.gov/directorates/stmd/plume-surface-interaction-psi/) and [vacuum-test description](https://www.nasa.gov/general/what-a-blast-nasa-langley-begins-plume-surface-interaction-tests/) are starting references for experimental/modeling work. They are not a ready probability layer for arbitrary landing sites.

**Required additional inputs:** Thruster/nozzle/thrust history, altitude/descent profile, lander geometry, regolith properties, nearby asset geometry, and a validated erosion/ejecta model. Do not invent damage probability, a universal exclusion radius, or an EVA waiting time such as 48 hours from a DEM or a dust score.

### Rover/path connectivity

Use terrain from DS-03/04 and imagery/DTMs from the LROC archive above. [NASA rover mobility test guidance](https://ntrs.nasa.gov/api/citations/20250003470/downloads/Mobility%20Test%20Best%20Practices%20-%20STRIVES%20April2025.pdf) is a reference for defining vehicle-dependent assumptions, not a universal rover specification.

**Initial scope:** A slope-filtered terrain connectivity or geometric path demonstration. State grid size, cost function, allowed slope, and unknown obstacles. A path is not proof of traversability.

**For operational reachability:** Add wheel/terrain interaction, payload, energy use, battery/reserve, speed, illumination and communication schedules, and return requirements. Do not label a distance radius as safe return or adopt 20 degrees as a universal tipping threshold.

### Radiation

Real CRaTER observations are available through the [PDS PPI LRO CRaTER bundle](https://pds-ppi.igpp.ucla.edu/data/lro-crater/) and its [README](https://pds-ppi.igpp.ucla.edu/data/lro-crater/Readme_2.4.txt).

**Limit:** Orbital observations do not alone provide a validated surface dose for a particular shelter. Terrain sky obstruction may be shown as a geometric sky-view measure, but converting that to dose requires particle spectra, material/geometry assumptions, secondary radiation, and a justified transport model. No fixed shielding percentage or habitat safety verdict may come from sky-view fraction alone.

### Rescue/contingency reachability

Terrain data can support a conditional route analysis, but there is no general-purpose terrain file that establishes rescue capability. Require a declared asset's position/availability, travel capabilities, response time, communication assumptions, and the relevant contingency/endurance scenario.

**Allowed output:** Under the supplied hypothetical asset and mobility assumptions, this route/time does or does not meet the declared contingency requirement. If asset inputs are absent, return not evaluated. Do not claim an actual rescue architecture exists, or reject sites as unrescuable, solely from distance to a ridge or communication point.

## 3. Data handling and verdict separation

- Apply the PRD's source IDs, checksums, frame/units, footprint/time coverage, no-data, and provenance requirements to every layer.
- Track environmental compliance, terrain screening, thermal context, logistics, and operational assessments separately.
- A disabled or unsupported check is not evaluated, never passed by default.
- Register each input as measured/derived/model-derived/assumed with validation status independent of its source reputation.
- Portal/reference availability is not proof that selected assets have been downloaded, cover the point, or support a proposed numerical method.
- Do not combine unrelated uncertainty or unit systems into one opaque safety score.

## 4. First data collection increment

1. Select one exact polar point already covered by the core DEM.
2. Obtain the elevation/slope/uncertainty metadata and define the assessment area and spatial scale.
3. Add a derived terrain-screening record with coverage and known gaps.
4. Calculate full-window contiguous darkness/Earth-invisibility intervals from the same validated core series.
5. Inspect whether a relevant Diviner product covers that point and answers a clearly defined thermal-context question.
6. Keep dust, PSI, radiation dose, and rescue model requirements recorded as research gates.

This increment has a clear user benefit without pretending to solve spacecraft design or crew safety.
