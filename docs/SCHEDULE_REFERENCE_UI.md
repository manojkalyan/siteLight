# Schedule reference interface

15 November 2026. The Compare → Schedule destination follows the supplied loaded-start/monthly-grid design using the existing source-backed calculations.

## Delivered

- A loaded-source coverage chip, scan action, actual tested/nominal-fit/unknown counts, and a range strip generated from the actual coverage and grouped ten-minute starts. Empty data is marked untested; example counts and windows from the reference image are not inserted.
- Candidate rows with first UTC start, inclusive last UTC start and sampled-start count. Preview and Last evaluate the requested boundary through the complete evaluator and show its actual Sun/Earth/overlap lanes. Preview does not change either mission. Apply rechecks the selected start against the current study, selected source point and shared requirements before committing it.
- A 2027–2033 monthly grid containing 84 first-of-month samples. All cells begin untested. The real monthly action loads and evaluates the existing pinned geometry; nominal fits are blue, criteria-unmet samples are gray, and unknowns are disabled. Clicking an evaluated cell applies that exact 00:00 UTC sample through the existing coverage-checked transaction. It is not a claim of continuous feasible windows.
- Scenario selection and mission settings remain available. Changing applicable requirements, source point or loaded coverage invalidates stale scan/preview results. Daily ±14-day alternatives, exact boundary application controls, sampling limits, source coverage and report exports remain accessible.
- Neutral glass panels over the existing illustrative terrain backdrop, two-column desktop layout, stacked tablet/mobile controls, and horizontally scrollable data regions with keyboard access. The range plot, weekly labels and monthly cells are driven by evaluated inputs rather than decorative example bars.

The existing scanner, monthly evaluator, scientific engine/store and pinned scientific bundles retain their calculation behavior. The calendar presentation helper has an optional compact mode; the classic entry retains its default presentation.

## Verification

The [validation record](review/mission-settings/schedule-validation.json) retains the final checks and protected file hashes. Tests cover the initial untested state, actual Nobile counts (11,953 tested starts, 2,303 nominal fits, zero unknown for the existing loaded quarter and requirements), preview isolation, last-boundary recheck/application, stale requirement invalidation, all 84 monthly colors against actual results, exact monthly application, other-scenario isolation and desktop/mobile bounds. The mockup's sample rows and monthly color pattern are not scientific inputs.

Screenshots: [evaluated desktop Schedule](review/mission-settings/schedule-desktop.png), [mobile Schedule](review/mission-settings/schedule-mobile.png), [mobile monthly grid](review/mission-settings/schedule-mobile-monthly.png). The retained browser results include existing Compare, Explore, Screening, Evidence, export and GPU checks. Production and standalone offline builds are verified after the final implementation. Scientific and engineering acceptance limits remain open.

Final checks: 197/197 JavaScript/API/DOM tests passed. The full Chrome run passed 35/36 cases; the existing rescue test timed out because it clicked a daily alternative without opening its newly collapsed section. After updating that navigation, both the rescue case and the responsive Schedule case passed in the final targeted run. All 36 distinct browser/GPU cases therefore passed across the recorded runs. Headed Windows Chrome reported the AMD hardware renderer with no lost WebGL context. The development server at `http://127.0.0.1:5173/` also loaded Schedule with 84 initially untested cells and no JavaScript exceptions after storage recovery. The scientific engine, store, pinned bundles and classic entry hashes match the pre-UI baseline.

## Local storage

Disk exhaustion interrupted the first final build; that attempt is not counted as a pass. To recover stable working space, project dependencies and retained raw scientific files were relocated to the existing task storage on D: while retaining their original project paths through NTFS junctions:

- `node_modules` → `D:\SiteLight-test-temp\node-runtime\node_modules`
- `data/raw` → `D:\SiteLight-test-temp\retained-source-data\raw`
- `.tools/pylibs` already points to `D:\SiteLight-test-temp\runtime-pylibs` from the earlier disk recovery.

Keep these directories with this local installation. Every relocated raw source file was compared by SHA-256 before the original duplicate was removed. The application continues using its existing project paths. The standalone HTML is rebuilt after recovery; it contains its own prepared data, while live scientific requests still need the local runtime and retained files.
