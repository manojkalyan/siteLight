**Current authority:** [PRD v4.1](../PRDnew.md) and [current delivery/acceptance status](CURRENT_STATUS.md). Reliability checks now include 119 application checks and six scientific fixtures; rendered browser and independent engineering acceptance remain open. Historical implementation notes below should be read with that current status.

# Reference-style lunar workspace

The user-supplied design is implemented in [lunar-workspace.html](../lunar-workspace.html), approximately 14.2 MB, and the main Vite application. The latest default uses real PGDA terrain plus geometric DE421 positions at six study points. It now includes 125 km multiscale horizons, source-RMS sensitivity, ranked interruptions, and historical Diviner context; see [increment 3](SCIENCE_INCREMENT_3.md). The local app generates additional real date blocks throughout 2027–2033; the standalone file constrains choices to loaded records. See [the coverage correction](DATA_COVERAGE_FIX.md) and [real-data increment](REAL_DATA_INCREMENT.md). The design reference and all four earlier prototypes are preserved.

## Open or develop

Double-click `lunar-workspace.html` to open the offline version, or run:

```powershell
npm.cmd run dev
```

Use the local URL printed by Vite. No CopperOS service, API key, external CDN, or login is required. Development Vite serves assets locally; the standalone HTML embeds the data, renderer, style, and globe maps.

```powershell
npm.cmd run build
npm.cmd run build:workspace
npm.cmd test
```

The production bundle is deliberately data-heavy because it includes bounded offline reference ephemerides. Vite may report a large-chunk advisory. The scientific acceptance gates are separate from a successful frontend build.

## Working features

| Area | Behavior |
| --- | --- |
| Reference layout | Compact dark editor, site/scenario outliner, central 3D scene, persistent A/B cards, property inspector, and UTC timeline |
| Scenarios | Two independently selected sites/start times; shared requirements; six regional presets and validated custom coordinates |
| Setup | Explicit UTC date and time, 48–336 hour assessment interval, original start retained separately from date preview |
| Comparison | Solar-eligible time, Earth visibility, overlap, requirement margins, plain/technical explanations, and percentage-point differences |
| Horizon views | Same provider/records supply the altitude-versus-azimuth chart, polar skyplot, current position readouts, and verdicts |
| Timeline | Colored sunlight/Earth/overlap lanes, scrubber, hour stepping, start/end, animation, sunset/Earthset brackets |
| Scenario changes | Date-offset preview/apply/reset; nearest passing tested daily sample within the bounded search and data coverage |
| Screening | Real PGDA scale-defined slope, detrended roughness, finite-grid coverage/area and source RMS context at three study points; separate synthetic demonstration; darkness, solar-criterion loss, and Earth-outage intervals |
| Calendar | A 29-day daily sweep centered on the selected date; uncovered cells remain unknown |
| Reports | Structured JSON, interruption CSV, browser print/PDF, source checksums, conventions, and original/preview inputs |
| Recent features | Explicit temperature, logistics/ice, connectivity, dust, plume, radiation, and contingency model gates; no fabricated outputs |
| Evidence | NASA challenge coverage matrix, source routes, model boundaries, and real-versus-synthetic labels |

Keyboard operation covers navigation tabs, native form controls, time slider, timeline buttons, and 3D orbit/zoom. Reduced motion disables playback and camera smoothing. Playback pauses when the document is hidden. A missing WebGL 2 context leaves charts and assessment controls available.

## Data and scientific limits

**Real DEM + DE421 local mode is the default.** Its six source-derived points, 2 m observer, 7 km terrain rays, packaged January–March 2027 series, and on-demand local date generation are documented in [DATA_COVERAGE_FIX.md](DATA_COVERAGE_FIX.md). Nominal local fits remain uncertain while far-field and propagated uncertainty are unassessed. Compatible site lists and transactional date changes prevent normal supported selections from creating empty comparison cards.

**The earlier JPL reference mode is retained separately.** Six regional reference points use acquired NASA/JPL Horizons body-center Sun and Earth directions from 2027-01-01 through 2027-02-01, every ten minutes. A seven-day request can begin no later than January 25 at 00:00 UTC. Each whole interval must be covered. Unsupported points or dates return insufficient data; they do not switch silently to synthetic values.

Raw responses, exact request URLs, API signature, source headers, and SHA-256 hashes are retained in `data/horizons/`. Source headers report DE441 and high-precision MEAN_ME lunar orientation. The provider uses wrap-aware interpolation between adjacent records; intervals use ten-minute left samples, weighted partial intervals, and the half-open assessment convention. Transition brackets have ten-minute source precision, not event-refined timing.

These are **airless apparent** observer angles, including light-time and aberration corrections. They are not the uncorrected geometric states requested by the final PRD recipe. Future UTC leap seconds are handled as described in the archived Horizons output. A 0° local tangent is the explicitly chosen **reference horizon**. A measured DEM horizon, local surface altitude, height-reference compatibility, and independent scientific validation are still missing. Environmental criteria here apply to that reference model; no actual landing suitability is established.

The six coordinates are inherited regional points from the supplied design, not independently sourced exact landing targets. Zero-kilometer altitude is above Horizons' 1737.4 km reference sphere, not above measured local terrain. Custom coordinates receive only sample-mode geometry until their own source records are acquired. Another point's records are never reused.

**Sample mode** uses deterministic analytic Sun/Earth geometry and a synthetic horizon. The terrain-screening grid computes actual statistics on a procedural height field; the separately rendered crater scene is artwork and does not define that horizon or footprint. The globe uses [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) rendering maps, credited to NASA's Scientific Visualization Studio. These maps do not complete real terrain ingestion. Three.js is embedded under its [MIT license](licenses/three-MIT.txt).

No local temperature, measured ice concentration, logistics mass, radiation dose, plume hazard, path safety, or rescue viability is calculated. Unsupported values present in the reference design were removed. Their PRD acceptance gates remain in force.

## NASA review

The supplied challenge text is archived at [nasa-challenge-2026.txt](reference/nasa-challenge-2026.txt), with the [official challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) linked. See [NASA_CHALLENGE_COVERAGE.md](NASA_CHALLENGE_COVERAGE.md) for implementation evidence and remaining limits. The challenge objective list is advisory; this is a feature-coverage review, not certification, judging approval, or a guarantee of eligibility.

## Verification and next work

Automated checks cover independent scenario state, UTC/coordinate validation, interval weighting, separate azimuth horizons, overlap, gap boundaries/missing values, countdown brackets, nearest-date search, reference-data coverage, source checksum/header/row consistency, known-plane slope/roughness, unchanged earlier prototypes, bundle parsing, and full DOM startup/control navigation without graphics. Production and standalone builds are checked.

**Browser preview infrastructure was unavailable.** Node/LinkeDOM checks do not validate rendered layout, GPU shaders, graphics recovery, frame rate, real-device accessibility, or visual texture registration. Those remain browser-review tasks. No screenshot or measured performance claim is made.

Next required scientific work:

1. Expand from three source-derived study points to more source-backed sites, preserving coordinate/surface/observer definitions.
2. Complete independent orientation/terrain review beyond the implemented matched geometric recipe and inertial-vector checks.
3. Extend local real-terrain horizons to broader far-field coverage and propagate correlated uncertainty; retain missing-cell behavior.
4. Expand actual ephemeris date coverage and verify transition precision.
5. Validate rendered layout, keyboard use, reduced motion, and graphics fallback in browsers.
6. Accept Diviner/LCSS model inputs before numerical outputs; retain advanced models as research until their gates pass.

To regenerate the bounded source data, run `npm.cmd run data:workspace`. Existing raw responses are reused, keeping the dataset pinned. Review configuration and source provenance before changing the coverage or inputs.
