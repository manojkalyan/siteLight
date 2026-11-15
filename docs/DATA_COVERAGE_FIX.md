# Real-data coverage correction

**Version:** 3.6 · 14 November 2026  
**Issue:** A user could select a point from the wrong data mode or preview a date outside the packaged records, then see an empty “Insufficient data” comparison card.

## What changed

1. **Six actual DEM study points:** NASA PGDA Sites 04, 01, 11, 06, 07, and 23 now have pinned surface/height-RMS/slope-RMS products, derived coordinates/observer heights, 7 km local terrain horizons, footprint grids, geometric series, and reference checks.
2. **Compatible site lists:** Real mode offers only its prepared DEM study points. Reference mode offers its own covered regional points. Mode changes preserve separate scenario histories; incompatible point IDs no longer carry across modes.
3. **Real dates on demand:** The local Vite app has a scientific service that computes missing Sun/Earth records using the pinned DE421 kernels for supported points throughout 2027–2033. These are freshly calculated geometric source records, not synthetic replacements or extrapolated percentages.
4. **Prepare before applying:** Site/date/duration changes are staged. A progress message is displayed while source records load; the previous covered assessment remains displayed. The proposed inputs are committed only after source, coordinate, frame, step, and full-interval coverage checks succeed.
5. **Safe offline controls:** Opening the standalone file directly uses packaged January–March 2027 data. Date/offset ranges reflect actual loaded coverage; unsupported calendar cells are disabled. A rejected change cannot replace a covered scenario with blanks.
6. **Custom point protection:** Real custom coordinates need their own terrain preparation. Unsupported custom edits are blocked before mutation. The app never borrows another point's horizon or silently switches to sample data.
7. **Useful initial comparison:** The initial real scenarios use the sourced Shackleton and Nobile study points. The default Nobile window has a nonzero nominal solar/overlap result under the local model, retaining its uncertainty qualification. No values were adjusted to force this result.

The lower-level `INSUFFICIENT_DATA` state remains for genuinely invalid or missing scientific inputs. This fix prevents normal supported UI selections from entering that state; it does not replace unknown measurements with zeros or pretend the research models are complete.

## Run the corrected application

```powershell
cd "C:\Users\DELL\Downloads\SiteLight_AI_CopperOS_Integration_v1\SiteLight_CopperOS_StepByStep"
npm.cmd run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`. Refresh an existing tab with **Ctrl+Shift+R**. The workspace's isolated Python runtime and pinned kernels must be present for new-date generation; they are already installed in this working copy. To recreate them, use the science bootstrap/acquire/prepare commands in [REAL_DATA_INCREMENT.md](REAL_DATA_INCREMENT.md).

The same local scientific service is available with `npm.cmd run preview` after building. A separately hosted static site or directly opened HTML file has no scientific server and stays inside its loaded coverage. It must not claim dynamic arbitrary-date support.

## Actual source definitions

| Tile | Study point | Latitude °N | Longitude °E | Surface height m |
| --- | --- | ---: | ---: | ---: |
| Site04 | Shackleton | −89.7667414771 | −171.8928090830 | 767.9786 |
| Site01 | Connecting ridge | −89.4631577570 | −137.5019849076 | 1944.7671 |
| Site11 | de Gerlache | −88.6835255155 | −67.9340775548 | 1793.6644 |
| Site06 | Nobile | −85.4381159443 | 37.3681200573 | 5946.3809 |
| Site07 | Peak near Shackleton | −88.8108937553 | 123.6911692620 | 1645.5488 |
| Site23 | Malapert | −85.9948673649 | −0.2346096915 | 4783.6294 |

These are tile-center study points, not mission landing targets. The observer remains 2 m above the source surface. Coordinates/heights are from the actual gridded products, not the approximate coordinates in the earlier design reference. Sources and hashes are recorded in [science-inputs.json](../data/science-inputs.json).

## Service, cache, and validation

- GET `/api/science/capabilities` reports whether the local runtime is available.
- POST `/api/science/coverage` accepts a known study-point ID and bounded, explicit UTC interval. Requests are limited to 180 days, aligned to ten minutes, and must stay within the target years. The UI pads requested windows to support nearby date searches.
- Request identity includes coordinates, source/kernel/algorithm versions, date interval, and generator contents. Source kernels are checksum-checked. Duplicate requests share work; at most two workers run concurrently. Cache files use unique temporary names and atomic replacement.
- Browser adapters verify convention, coordinates, pinned kernels, ordered complete records, and actual full-interval coverage before registering a block. Provider/result caches are invalidated when new records arrive. Disjoint date blocks are not mistaken for continuous coverage.
- The service is local, accepts same-origin requests, uses argument-based subprocess execution, and restricts cache output to the scientific cache directory. Raw kernels/tooling are excluded from Vite file serving and watching.

Tests exercise all six selectable real points, mode-switch histories, offline range/coordinate rejection, failed-loader preservation, invalid HTTP input/origins, actual SPICE-generated 2030 and late-2033 blocks, and the real UI's load-before-commit behavior. The test runner limits concurrent suites on the reference laptop so native scientific workers and DOM tests do not exhaust its available memory.

## Scientific limits remain explicit

Source-backed results are still a **bounded local terrain model**: 7 km ray extent, 1° azimuth bins, ten-minute geometry records, and 2 m observer. Far-field terrain and correlated uncertainty are unassessed. Nominal fits remain uncertain. Temperature, life-support mass, plume, radiation dose, and rescue models remain gated.

Packaged scientific data is about 10.6 MB; the offline HTML is about 13.8 MB. A production build includes a large offline data chunk. [Local compute timings](performance/latest.json) are recorded separately from network/browser/GPU load timing, which remains unverified.
