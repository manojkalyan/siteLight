# SiteLight AI —(working prototype)

## Current development requirements

**GitHub / Vercel:** [Deployment settings and backend scope](docs/DEPLOYMENT.md). Import the repository root, use Node 24, build with `npm run build`, and publish `dist`. Required prepared real data stays tracked; raw archives, caches, local tools and generated previews remain excluded. On-demand scientific preparation requires the separately connected backend.

**Moonquake and ground stability:** [Seismic evidence screening](docs/SEISMIC_CONTEXT.md) adds the real polar-scarp/event/station map, A/B nominal catalog proximity beside measured terrain, searchable source records, and two real Apollo LPZ waveform replays with CSV downloads. Open **Screening > Seismic**. The original records, missing/alternate locations, source hashes and unquantified local hazard remain explicit.

**Evidence and export reference UI:** [The source-library and report redesign](docs/EVIDENCE_EXPORT_REFERENCE_UI.md) adds source search and metadata, Validation/Limits tabs, live report sections, inclusion switches, canonical SHA-256/copy, real sampled-record CSV, JSON and Print/PDF. Open **Evidence**, then **Export**. Report selections preserve actual calculations and mandatory scientific qualifications.

**Thermal & dust reference UI:** [The Thermal redesign](docs/THERMAL_DUST_REFERENCE_UI.md) adds the source-backed historical Diviner bin map, study-point selection, radiator/material/coverage controls, all device assumptions, calculated clean/mixed-optics chart and equilibrium/heat-margin readouts. Open **Screening → Thermal & dust**. Only two southern-summer source time bins are loaded per catalog point; other times/seasons remain hatched. Neither historical observations nor laboratory simulant properties are a mission forecast or equipment-survival verdict.

**Logistics reference UI:** [The Logistics redesign](docs/LOGISTICS_REFERENCE_UI.md) adds the lunar backdrop, live A/B LCSS assumption explorer, complete mass accounting, budget-fit search, all 20 architecture inputs, and the separate published NASA water-ISRU study with its source values, diagram and exclusions. Open **Screening → Logistics**. Values follow the existing calculations; hypothetical ice and equipment assumptions remain explicitly labeled.

**Terrain screening reference UI:** [The Terrain redesign](docs/TERRAIN_SCREENING_UI.md) adds a Cinematic crater presentation and a measured **Source DEM** toggle, clipped slope-cell overlays, sampled route controls, live footprint metrics, the published local ensemble plot, and source-qualified evidence disclosures. Cinematic landforms and overlay placement are illustrative; all analysis continues using the existing real data. Open **Screening → Terrain**. The validation record retains the JavaScript/API/DOM and Chrome/GPU results.

**Schedule reference UI:** [The Schedule redesign](docs/SCHEDULE_REFERENCE_UI.md) adds real loaded-start counts and windows, an isolated weekly preview with rechecked Apply, and the evaluated 84-month robustness grid. Validation passed 197 JavaScript/API/DOM checks and all 36 distinct Chrome/GPU cases across the recorded runs. Open **Compare → Schedule**. See the storage note in that document for the retained dependency/source directories on D:.

**Compare reference UI:** [The comparison redesign](docs/COMPARE_REFERENCE_UI.md) adds the two scenario cards, live shared-criteria table, binding constraints, source intervals and an isolated UTC start preview with a rechecked Apply. Current values remain calculated from source data; the cinematic backdrop is labeled illustrative. The validation record retains 195 passing JavaScript/API/DOM checks and passing results for 33 distinct Chrome/GPU cases across the recorded runs.

**UI reference correction:** the [latest layout and validation](docs/UI1_REFERENCE_MATCH.md) covers the larger silver-gray Moon, black scene, compact panels, open horizon and slim timeline. Open `http://127.0.0.1:5173/?scenario=B` while the development server is running to review Nobile with actual calculations.

**UI 1 is implemented:** the four-tab interface, mission draft sheet, six Screening sections, source library, report preview and dynamic local footprint ensembles are connected to live calculations. [Release and validation](docs/UI1_RELEASE.md) records 188 JavaScript, 18 Python and 18 Chrome/GPU checks. Run `npm.cmd run dev` for the new default; `/classic.html` retains the previous interface.

**Current v4.9 delivery:** [Terrain and NASA reference evidence](docs/TERRAIN_REFERENCE_INCREMENT.md) adds 100 published correlated terrain realizations per study point (600 retained windows), confidence-filtered stereo comparisons, and corrected 500 km nominal catalog horizons. The published NASA water-ISRU architecture is a separate 225-day propellant reference study: 23 source values and seven bookkeeping/rounding checks pass. Its assumed 5 wt% water concentration is not a local ice measurement and does not calibrate the 20-input four-crew/730-day LCSS explorer.

**Scientific/engineering verification:** [The audit](docs/SCIENTIFIC_ENGINEERING_VERIFICATION.md) records 681 retained source-record checks, seven artifact checks, 13 linkage checks, 744 expanded JPL comparisons, 179 JavaScript checks and 14 Python fixtures. All pass within the declared scope. Partial stereo coverage/shared geodetic control, unresolved terrain, the conditional 20 km height ceiling beyond 500 km, full global/orientation covariance, physical equipment calibration and selected-site extractable ice leave full scientific/engineering acceptance open.

**Browser testing is available:** run `npm.cmd run test:ui` for the automated Chrome suite and `npm.cmd run test:chrome` for the visible Windows visual/GPU review. The Microsoft Playwright VS Code extension and test tasks are installed/configured. [The validation record](docs/BROWSER_VALIDATION.md) records the bounded automated and headed visual/GPU runs, inspected screenshots and remaining acceptance limits.

New in v4.8: **Calendar → Scan loaded ten-minute starts** checks every supported start in the loaded real records, groups nominal-fit windows and rechecks a boundary before applying it. [Methods, real-data results and remaining gates](docs/START_WINDOW_SCAN.md) distinguish the finer sampling from accepted continuous or operational feasibility.

New in v4.2: open **Calendar → Evaluate 84 real monthly starts** for the 2027–2033 sampled robustness study. **Screening** now includes sampled terrain routes and upward-sky geometric context. See [methods, checks and remaining model inputs](docs/ADVANCED_PLANNING.md).

**Current app:** Run `npm.cmd run dev` and open the URL printed by Vite. Start with [current implementation and release status](docs/CURRENT_STATUS.md); the older CopperOS instructions below describe a separate legacy demo. The [browser/demo review procedure](docs/APPLICATION_REVIEW.md) is ready for the remaining rendered review.

PRD v4.0 refines real terrain horizons to 720 half-degree rays with 2.5 m/40 m radial steps. The [six-point refinement report](docs/SAMPLING_REFINEMENT.md) records the finer-grid comparison, passing checks and remaining scientific/engineering/browser gates.

See the [14 November validation report](docs/VALIDATION_REPORT.md) for 113 application checks, numerical/scientific results, corrected custom-point loading defects, terrain convergence findings, and remaining browser/engineering acceptance limits.

The LCSS assumption explorer is available in the Logistics inspector (circle icon). Enable **Explore LCSS assumptions** to compare four-crew/730-day water-system subtotals, edit architecture and hypothetical ice inputs, and search for a tested budget fit. See [the model, equations, sources and acceptance limits](docs/LCSS_MODEL.md). Independent engineering review remains pending; exploratory mass does not enter environmental verdicts.

### Standalone visual prototype

Open the [reference-style workspace](lunar-workspace.html) for real PGDA terrain and matched DE421 geometry at six study points, A/B comparison, footprint/gap screening, reports, and Evidence. Run `npm.cmd run dev` for real date generation throughout 2027–2033; direct-file use stays within loaded coverage. See [the missing-data correction](docs/DATA_COVERAGE_FIX.md), [implementation and next stages](docs/REAL_DATA_INCREMENT.md), and [NASA challenge coverage](docs/NASA_CHALLENGE_COVERAGE.md). The current increment extends the six catalog horizons to 500 km with a sourced 240 m outer annulus; custom points retain their own prepared extent. Source-RMS sensitivity perturbs only 0-125 km while holding the outer annulus fixed. Local clone percentiles and quality-filtered partial stereo comparisons appear in Screening. Ranked failed-rule intervals and historical Diviner context remain available. See [increment 3 and remaining work](docs/SCIENCE_INCREMENT_3.md). Nominal fits retain qualifications for beyond-extent terrain and correlated uncertainty.

The separate [cinematic Moon and terrain sample](lunar-cinematic-prototype.html) opens in Explore with a NASA-textured globe, a procedural crater landscape, and floating glass planning controls. It embeds all assets for offline use. See [controls, credits, limitations, and visual review steps](docs/CINEMATIC_PROTOTYPE.md). All planning results remain synthetic; earlier prototypes are preserved.

The latest [screening UI validation sample](lunar-validation-prototype.html) adds separate terrain, continuous-gap, and thermal-readiness views to the hybrid design. Open the single file directly, then follow the [five-minute review checklist](docs/UI_VALIDATION.md). All calculated terrain/visibility values remain synthetic.

The separate [hybrid sample](lunar-hybrid-prototype.html) opens in a light comparison workspace and includes the immersive 3D Explore view, a labeled Logistics concept, and Data view. It is also one offline HTML file. See [hybrid controls and shared-state behavior](docs/HYBRID_PROTOTYPE.md). The original immersive sample below is preserved.

Open [lunar-prototype.html](lunar-prototype.html) directly in your browser for the full-screen 3D Lunar Studio concept, floating glass panels, daylight controls, and synthetic scenario comparison. It is one self-contained offline HTML file. See [prototype controls and limitations](docs/LUNAR_PROTOTYPE.md). This separate visual exploration does not complete the real-data scientific application or LCSS model.

The current planning baseline is [PRDnew.md](PRDnew.md): environmental comparison and the Binding Constraint Explainer first, Life-Support Coupled Site Score (LCSS) next, and the multi-year calendar as stretch scope. Follow the feature list, ordered tickets, dependencies, and acceptance checks in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Previous specifications are preserved in [PRD v2.0](docs/archive/PRD-v2.0.md) and [PRD v1.0](docs/archive/PRD-v1.0.md).

The runtime instructions below describe the earlier synthetic CopperOS prototype. The independent workspace runs with `npm.cmd run dev` and builds with `npm.cmd run build`; `npm.cmd run build:workspace` produces its offline HTML. Real local terrain and the matching geometric recipe are implemented; full physical terrain/uncertainty acceptance and accepted logistics models remain pending; bounded Windows Chrome review is recorded separately.

## What this package does

A dark dashboard for **mission evidence collection → human approval → mission-time comparison**. The local CopperOS browser agent reads an official mission webpage. After a human reviews an explicitly published landing timestamp, a deterministic screening engine compares two landing times against **synthetic sample visibility data** and shows example alternatives.

**Not flight software.** This version does **not** load real NASA LOLA terrain or SPICE ephemerides. All sample Sun/Earth flags and alternatives are **synthetic**, provided solely to test the integration and UX. Do not infer actual lunar conditions.

## Step 1 — Prerequisites

- Python 3.10+ (3.11+ recommended).
- Google Chrome and the CopperOS extension, if you want browser research.
- Node.js 20+, if using the open-source local CopperOS broker.
- The CopperOS agent model must support tool calling; configure it in the extension.

## Step 2 — Set up CopperOS

Follow the project documentation: https://github.com/Jesse0502/CopperOS#setup

In a terminal:

```bash
git clone https://github.com/Jesse0502/CopperOS.git
cd CopperOS/broker
npm install
```

Copy `broker/.env.example` to `broker/.env` (if present) and add the line:

```text
TASK_API_TOKEN=choose-a-long-random-local-token
```

Start the broker:

```bash
npm start
```

Load the unpacked `CopperOS/extension/` in `chrome://extensions` with **Developer Mode → Load unpacked**; connect to **This computer** and configure an appropriate model. Do not reuse a browser profile with sensitive accounts during initial experiments. The broker's task API listens on `127.0.0.1:7332` by default.

## Step 3 — Configure SiteLight AI

Copy `.env.example` to `.env` in **this** project directory. Set:

```text
COPPEROS_TASK_API_TOKEN=choose-a-long-random-local-token
COPPEROS_API_BASE=http://127.0.0.1:7332
```

Use the **exact same** token as `TASK_API_TOKEN` in CopperOS's `broker/.env`. Do not expose it in the frontend, GitHub or screenshots. Keep localhost endpoints local.

## Step 4 — Run the application

**Windows:** double-click `start_windows.bat` (or run it in a terminal). It installs the Python dependencies and launches the application.

**Mac/Linux:** run `./start_mac_linux.sh`.

**Manual:**

```bash
python -m pip install -r requirements.txt
python -m uvicorn sitelight.main:app --host 127.0.0.1 --port 8080
```

Open **http://127.0.0.1:8080/** in Chrome. The original dark SiteLight AI 3D prototype is available at **http://127.0.0.1:8080/dashboard**.

> Important: double-clicking `index.html` will **not** call the backend correctly. Use the local app URL above.

## Step 5 — Verify CopperOS connection

Click **Check**. Status should say connected. If offline, check CopperOS extension, local broker, port and both tokens. The deterministic sample analysis works even without CopperOS.

The app uses CopperOS's official blocking `POST /api/task` endpoint from a Python background task. It never uses API keys in JavaScript. The UI polls SiteLight AI, not CopperOS directly. It is intentionally read-only and limited to official space-agency HTTPS domains.

## Step 6 — Research one mission update

Enter an official page URL and a mission name, then click **Start read-only research**. The task can take a few minutes. If CopperOS returns structured JSON, the UI prefills possible evidence fields. **Nothing is applied automatically.** If the source provides only a date and not an exact landing time, leave the time unapproved and do not invent a UTC hour.

CopperOS may fail, misunderstand a page, or return an incomplete result. Review its raw output and compare the extracted claim with the original page.

## Step 7 — Human approval

Open the original source, confirm the exact timestamp, enter it as `2027-03-12T10:00:00Z`, check **I reviewed**, and click **Approve**. This is a user attestation, not independent NASA authentication. If there is no exact timestamp, use the manual scenario form instead and label it as hypothetical.

## Step 8 — Evaluate a hypothetical schedule change

The **Mission Change Analyzer** compares the original and proposed times for three imaginary training sites. Change duration and min Sun/Earth fractions; click **Run scenario comparison**. The engine checks all hourly rows and searches for a nearby passing example within ±72 hours.

The data is in `data/sample_visibility.csv` (`timestamp_utc,site_id,sun_visible,earth_visible`). **You must replace it with independently validated, georeferenced, terrain-corrected data before claiming real mission predictions.** Even then, sunlight visibility is not electrical power availability, and Earth visibility is not guaranteed RF quality.

## Step 9 — Tests

```bash
python -m pip install pytest
python -m pytest -q
```

The tests cover official-domain restrictions, exact UTC time requirements, synthetic screening results, evidence-approval controls, and basic API endpoints.

## Next production milestones

1. Replace synthetic CSV with verified, time-stamped Sun/Earth horizon results for a selected lunar site, derived from LOLA DEMs and SPICE/Horizons using a documented lunar coordinate frame.
2. Cross-check event times against a trusted reference; report terrain resolution, metadata, provenance and uncertainty.
3. Replace simplified fractions with explicit mission constraints (continuous power intervals, battery model, Earth visibility windows, validated vehicle-specific limits).
4. Add the **Mission Breakpoint Finder** using real inputs and determine the earliest time shift that violates a specified constraint.
5. Measure task completion time and missed violations against a standard manual workflow.
6. Only then consider scheduled CopperOS evidence checks. Keep the browser agent optional.

## API summary

- `GET /api/health` — backend health
- `GET /api/copper/status` — local broker health
- `POST /api/evidence/start` — read-only research task (async from UI)
- `GET /api/evidence/{job_id}` — task progress and untrusted result
- `POST /api/evidence/approve` — explicit reviewed-source approval
- `GET /api/approvals` — recent user-approved evidence (in memory)
- `POST /api/mission/compare` — synthetic deterministic scenario comparison
- `GET /api/sample/info` — sample provenance and range

CopperOS upstream: https://github.com/Jesse0502/CopperOS — the broker exposes `POST /api/task`, `POST /api/tasks`, `/api/health`, and `/api/chats`. This demo uses the blocking singular endpoint in a separate server-side task and does not relax submission approvals.

## Security notes

- Broker URL pinned to loopback; browser task only navigates user-supplied approved HTTPS domains.
- Research output is untrusted: never executed, interpreted as code, or treated as a verified spacecraft timestamp.
- Don't run this development server on a public network. Add authentication, rate limits, audit records, persistent storage, and queueing before multi-user deployment.
- No browser agent is given mission-control access.
