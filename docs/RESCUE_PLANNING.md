# Conditional rescue planning — v4.4

14 November 2026. Implemented as a hypothetical time/endurance exploration, separate from environmental verdicts. Model: `conditional-rescue-time-1`; report evaluator: `workspace-evaluator-6`.

## Use

1. Open **Screening**. In **Terrain connectivity**, select a destination direction in source-grid axes. The asset origin is the footprint center; the casualty is the existing sampled destination near 80% of the footprint radius.
2. In **Conditional rescue planning**, declare a hypothetical asset for the selected point and incident start, then explicitly assume it available. No asset is declared or available by default.
3. Set outbound speed, loaded return speed, mobilization and casualty-handling times, total-response endurance and completion time limit. Choose whether to include return to the footprint center.
4. Inspect arrival/completion times, UTC timestamps, each time-limit margin and the route qualification. A and B retain independent rescue inputs.

The incident is assumed at the selected scenario start, including any date preview. Declarations are bound to mode, point ID, coordinates/height and incident start. Changing these does not silently deploy the asset at a different point/time: the result becomes not evaluated until declared again. Direction and terrain-setting changes recompute the bounded route and response; they do not move the asset origin.

## Assumptions and scope

| Input | Default | Meaning |
| --- | --- | --- |
| Declared / available | false / false | Explicit hypothetical declarations, not an inventory of actual lunar assets |
| Outbound / loaded return speed | 0.5 / 0.25 m/s | Constant speed along the selected 3D sampled path |
| Mobilization / handling | 10 / 15 min | Assumed delays included in elapsed response time |
| Total response endurance | 120 min | Assumed allowable elapsed time, including delays; not inferred battery range |
| Completion limit | 60 min | User-defined limit from incident to completion; not a medical survival threshold |
| Return | required | Use the same path in reverse; transport capacity is assumed adequate |

No source establishes these default speeds, timings, endurance or asset availability; they are adjustable planning examples. Real mode uses the existing pinned PGDA terrain path. Sample mode remains synthetic. JPL-reference mode has no assessed terrain route and cannot produce response timing. Routes stay within the assessed footprint; distant bases and destinations are not connected with straight-line distance guesses.

## Equations and interpretation

For one-way sampled 3D length L metres, outbound speed v_out and loaded return speed v_return in m/s:

- Outbound minutes = L / (60 v_out).
- Return minutes = L / (60 v_return) if required; otherwise zero.
- Arrival minutes = mobilization + outbound.
- Completion minutes = arrival + handling + return.
- Each margin = declared limit − completion. Equality fits, with a 1e−9 minute floating-point comparison tolerance.

If return is disabled, completion means handling completed at the casualty; evacuation is not evaluated. With return enabled, it means the hypothetical casualty reaches the footprint-center origin. UTC timestamps are the incident timestamp plus the corresponding elapsed minutes.

| State | Meaning |
| --- | --- |
| `not_evaluated` | No current asset declaration, stale declaration, unavailable terrain or invalid route; no timing credit |
| `asset_unavailable` | A current declared asset is assumed unavailable; no response time credited |
| `no_sampled_route` | No path under the selected sampled cell/edge slope and coverage limits; not proof that all rescue alternatives fail |
| `conditional_fit` | Both declared elapsed-time limits fit under these assumptions |
| `conditional_shortfall` | One or both limits are exceeded; separate margins identify the deficit |

Neither conditional result changes the environmental status or establishes rescue feasibility. The model does not evaluate energy, battery capacity, communications, lighting/thermal conditions along the route, vehicle clearance, traction, boulders, medical care or real transport capacity. Endurance is an assumed time allowance. Global horizon/correlated uncertainty and vehicle-level validation remain open.

## Reports and verification

JSON includes `rescueExploration` with independent A/B settings, asset scope, route samples/length/scale/classification, incident time, phase timings, UTC timestamps, margins, exclusions, model version and `acceptedForVerdict: false`. Canonical report hashing includes this layer. The print report lists assumptions and results for both scenarios.

Reference fixture: an 80 m flat path, 0.5 m/s outbound, 0.25 m/s return, 10-minute mobilization and 15-minute handling gives arrival at 12⅔ minutes and completion at **33 minutes**. Both limits of 33 minutes fit; limits of 32 and 30 minutes miss by 1 and 3 minutes. Without return, completion is 27⅔ minutes and evacuation remains unassessed.

Automated cases cover this independent arithmetic, exact limits, absent/unavailable/stale assets, changed coordinates/mode/time, blocked/missing/malformed routes, invalid inputs, immutable evidence, A/B isolation, real-terrain UI interaction, scenario changes and report output. Rendered browser/GPU/accessibility review remains unverified; the supported browser connection was unavailable in the last recorded review.

Final verification: **135 JavaScript/API/DOM checks pass**, including five dedicated rescue numerical/state cases and a bundled real-terrain interaction case. Loading guards prevent changing rescue assumptions during pending scientific preparation. Both builds pass; the offline HTML is 14,232,349 bytes and the four earlier prototypes remain unchanged. The production build retains its existing large-chunk advisory.

[Six-point real-terrain evidence](RESCUE_VALIDATION.json) uses the default 100 m footprint, 20 m slope baseline, 12° limit and +X destination. Connecting ridge gives **33.028 minutes** completion under the example assumptions. de Gerlache, Peak and Malapert also fit these declared limits; Shackleton and Nobile have no sampled route and receive no timing estimate. These outcomes are conditional examples, not actual asset or rescue validation. The record retains the scientific bundle SHA, source identities, route samples and hypothetical settings.
