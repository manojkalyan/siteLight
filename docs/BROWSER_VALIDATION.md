# Playwright and Windows Chrome validation

**UI 1 follow-up, 15 November 2026:** [The current release](UI1_RELEASE.md) supersedes the older interface counts below: 17 automated Chrome cases plus one headed GPU/context-recovery case pass. [UI 1 verification](review/ui1/validation.json) records the migrated navigation, real dynamic ensemble, source search, settings draft and visual review. Original results below describe the earlier interface.

15 November 2026. PRD v4.9; evaluator `workspace-evaluator-11`; scientific bundle `dem-de421-4` plus `sitelight-terrain-acceptance-evidence-1`.

The current rerun passes **12 automated UI cases and one headed Windows Chrome case (13 total)**. The added case checks 500 km catalog horizon metadata, 100 published local realizations per selected point, the 23-value NASA reference study and its seven rounding checks, visible panels, and unchanged environmental isolation. Monthly-study export also retains the outer terrain source. A stale 125 km chart label found by the first run was corrected and the complete suite rerun successfully. Current local compute measurements are in [the performance report](performance/latest.json); they are separate from browser readiness/GPU timing.

The user authorized Playwright for automated UI tests and Chrome on Windows for the final visual/GPU review. The official Microsoft VS Code Playwright extension (`ms-playwright.playwright`, installed version 1.1.19) and project runner (`@playwright/test` 1.65.1) are installed. Chrome is launched with a temporary, isolated test profile; the user's normal Chrome profile and tabs are not controlled.

## Run in VS Code

Open this project folder in VS Code. The Testing view discovers [playwright.config.mjs](../playwright.config.mjs) and its two projects. Select `ui-chrome` for headless automation, or `windows-chrome-review` for the visible Windows review. The supplied `.vscode/tasks.json` also exposes both commands under **Terminal → Run Task**. The extension installation and CLI execution are verified; interaction with the VS Code Testing view itself was not observed.

From the VS Code terminal:

```powershell
npm.cmd run test:ui
npm.cmd run test:chrome
npm.cmd run test:ui:report
```

Both test commands build the current production application first. Playwright starts a separate local production preview at `http://127.0.0.1:4174/`, with the real scientific API middleware, then stops that test server. It does not replace the normal development server on port 5173. Chrome must already be installed. Future-date/monthly tests require the existing local Python and pinned scientific inputs.

`npm.cmd run test:ui:debug` opens the Playwright debugger for the automated project; build first when using that command. `npx.cmd playwright test` runs both projects against the current build. Set `SITELIGHT_UI_BASE_URL` explicitly only when intentionally testing an already running server. Screenshots, HTML and JSON reports are written beneath `artifacts/`; [retained evidence](review/playwright-ui.json) records the verified run.

The runner uses one worker and disables full traces to bound memory on this laptop. The first attempts exhausted the Windows commit limit (approximately 16.46 GB used of 16.73 GB). After unused applications were closed, the production-preview run completed. No unrelated application processes, security settings, browser profile data or Windows paging configuration were changed.

## Automated UI scope

Twelve real-browser cases cover the following existing workflows plus the new sourced terrain/NASA reference panel and export case:

1. Initial real A/B results, 3D canvas and all six workspace panels.
2. Every loaded ten-minute start, rechecked boundary application, A/B preservation and stale-study invalidation.
3. Actual 2030 real-date loading and previous-scenario preservation after an intentionally aborted subsequent API request.
4. The 84-start real monthly grid and exact December 2033 sample application.
5. LCSS assumption controls, expected mass examples and environmental/A/B isolation.
6. Hypothetical rescue declaration, conditional timing and re-declaration after a changed start.
7. Dust, ejecta and primary-proton controls, escaped asset names, source/quantity qualifications and unchanged environmental/historical records.
8. An actual JSON download, independently recomputed canonical SHA-256 and print-media report visibility.
9. Keyboard tab navigation, native guide-dialog Escape handling and reduced-motion playback suppression.
10. Mobile site access, visible comparison values, keyboard horizontal table scrolling and no document overflow at 390, 768 and 1024 pixels.
11. A deliberately unavailable WebGL context retaining the scientific charts and complete start scan. This is a simulated fallback case, separate from hardware GPU observation.

Fixtures reject unexpected page exceptions and failed local HTTP responses. Expected network failure is injected only in the explicit recovery case. These cases do not replace numerical/scientific tests or establish complete accessibility compliance.

## Windows Chrome visual and GPU review

One additional headed Playwright case launches installed Chrome **157.0.8103.52** on Windows **10.0.19045**, records Chrome system GPU information and the actual canvas renderer, and captures desktop, tablet and mobile screens. [Machine-readable GPU/timing evidence](review/windows-chrome/review.json) retains the exact measurements. The reported renderer is **ANGLE / AMD Radeon(TM) Graphics / Direct3D11**, with hardware GPU compositing and WebGL enabled. Software fallback is rejected by the review case.

The review exercises Moon/real-terrain switching, camera keyboard controls, timeline playback, deliberate WebGL context loss and restoration, comparison/calendar screens, dust/plume/radiation controls, the terrain evidence and NASA reference panels, mobile layouts and PDF generation. Context recovery is observed through the actual context state, restored notice and recovered rendered scene. The frame sample records 110 browser animation-frame intervals after warm-up during playback, approximately 60 Hz on the observed run. It is not isolated GPU timing or a guarantee on other devices. The readiness measurement includes browser navigation and service preparation; it is not a cold network/production performance acceptance test.

Screenshots are captured for visual inspection rather than treated as automatically approved image baselines. See [the review images](review/windows-chrome/desktop-moon.png), [terrain after recovery](review/windows-chrome/desktop-terrain-recovered.png), [mobile comparison](review/windows-chrome/mobile-comparison.png), and [the start-window table](review/windows-chrome/desktop-start-windows.png). PDF generation is recorded separately; it is not a page-by-page print-layout acceptance.

## Corrections found during review

- The generic range-input rule overrode the timeline slider's calculated width, producing 76 pixels of mobile document overflow. The timeline selector now has sufficient specificity.
- Phone comparison cards were crowded inside the fixed minimum layout. Phone views now use natural content height, stack A/B cards and constrain panel widths. The timeline header can wrap instead of pushing content outside the viewport.
- Landing-window UTC columns now remain legible in a minimum-width table inside a labeled, keyboard-focusable scrolling region.
- The renderer recovered its WebGL context but kept the old waiting notice. Restoration now announces **3D graphics restored.** The headed test checks the state and message.

## Remaining acceptance

This closes the inability to run and inspect a real Chrome session on this machine using the authorized Playwright path. The chat's separate browser/native connectors were not repaired. Cross-device/browser coverage, actual screen-reader testing, a full contrast/accessibility audit, cold-load/network performance, long-duration GPU/driver stability and a timed submission rehearsal remain open.

Scientific/global terrain/uncertainty acceptance, applicable LCSS engineering calibration and the research models' physical/operational evidence gates also remain open. Browser checks cannot close those gates.

Setup follows the official [Playwright VS Code guide](https://playwright.dev/docs/getting-started-vscode) and [installed-browser channel documentation](https://playwright.dev/docs/browsers).
