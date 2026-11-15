# Product Requirements Document (PRD)

> **Superseded specification — 15 November 2026:** This original v1.0 document is retained for history. [PRDnew.md v4.9](PRDnew.md) is the current requirements authority; [the implementation plan](IMPLEMENTATION_PLAN.md) and [terrain/NASA reference increment](docs/TERRAIN_REFERENCE_INCREMENT.md) describe the delivered scope. The older PASS examples, challenge-completeness claims and accepted LCSS/logistics wording below are not current validation results. Nominal environmental fits remain uncertain; full physical terrain/global uncertainty, equipment calibration and selected-site extractable ice remain open. The published NASA reference architecture is a labeled study, not calibration of the 20 legacy LCSS assumptions.

## SiteLight AI — Lunar Landing Site Navigator
### Complete Hackathon Submission Specification

**Event:** 2026 NASA Space Apps Challenge — *Lunar Landing Site Navigator*
**Team:** [Your team name]
**Document version:** 1.0 (build-ready)
**Submission deadline:** [date]
**Status:** Approved for build

---

## 1. Executive Summary

**One-sentence pitch:**
> *When a lunar landing date slips, planners currently re-run separate tools by hand and compare raw outputs; SiteLight AI shows them which constraint broke, by how much, and the exact launch-date shift that fixes it — in one interactive screen.*

SiteLight AI is a web application that lets mission planners, educators, and the public **compare lunar landing sites and dates in seconds**, visualize Sun and Earth positions relative to the local terrain horizon, and understand **causally why a scenario succeeds or fails**. It fulfills every requirement of the challenge and adds two differentiated capabilities the challenge does not ask for but that judges will recognize as innovations: a **causal binding-constraint explainer** that turns verdicts into negotiable decisions, and a **Life-Support Coupled Site Score (LCSS)** that surfaces a hidden logistics penalty no existing site-selection tool models.

---

## 2. Challenge Requirement Mapping

This table proves the submission covers every explicit ask in the challenge brief.

| Challenge requirement (verbatim) | Where covered | Status |
|---|---|---|
| "Create an intuitive tool or application" | Whole app; guided demo mode | ✅ |
| "Compare landing sites and dates quickly" | Scenario A/B cards, launch-date slider, flip points | ✅ |
| "Visualizing Sun and Earth positions relative to the horizon" | Polar horizon plot with Sun and Earth tracks | ✅ |
| "Assess power generation potential" | Solar elevation, Sun-visible %, power-positive fraction | ✅ |
| "Assess direct-to-Earth communication windows" | Earth-visible %, Earth visibility timeline | ✅ |
| "Interactive site selection and comparison" (consideration) | Curated sites + custom coordinates + side-by-side cards | ✅ |
| "Date and time flexibility" (consideration) | Date picker + ±60-day offset slider | ✅ |
| "Sun and Earth position visualization" (consideration) | Polar horizon plot + elevation timeline | ✅ |
| "Power and communication assessment" (consideration) | Per-scenario metrics: Sun %, Earth %, overlap %, min elevation | ✅ |
| "Multiple visualization approaches" (consideration) | Polar plot, timeline strip, verdict cards, heatmap (stretch) | ✅ |
| "Temporal dynamics" (consideration) | Timeline strip; animation as stretch | ✅ (stretch: animation) |
| "Accessibility across skill levels" (consideration) | Technical / Plain-language toggle; educator view | ✅ |
| "Account for lunar topography in horizon" (consideration) | LOLA-derived azimuthal horizon profiles | ✅ |
| "Account for Earth's libration" (consideration) | Libration modeled in Earth ephemeris; noted in provenance | ✅ |
| "Handle south pole terrain complexity" (consideration) | Curated polar sites; horizon profile captures ridges and crater rims | ✅ |
| "Support planners responding to schedule changes" (consideration) | Scenario surgery sliders; flip-point detection | ✅ |

**Verdict: all required and suggested considerations are covered.** The LCSS and robustness envelope are additive innovations, not substitutes.

---

## 3. Problem Statement

Mission planners at the lunar south pole must jointly satisfy **power generation** (solar elevation and duration) and **direct-to-Earth communication** (Earth above the local terrain horizon) for a candidate site–date pair. Launch slips force rapid replanning. Existing tools—NASA QuickMap, Moon Trek, JPL Horizons—are built for detailed analysis and require navigating multiple interfaces and interpreting raw outputs. The result is a **replanning bottleneck**: planners can see *that* a site–date fails, but not **which constraint is binding, by how much, or what change would make it viable**. A further gap—documented in the 2026 site-selection literature—is that **life-support mass penalties tied to site-specific regolith chemistry are treated as external assumptions, not decision variables**, so a site can pass every traditional check and still be logistically unsustainable.

SiteLight AI closes both gaps in one interactive screen.

---

## 4. Goals and Success Metrics

| ID | Goal | Success metric |
|---|---|---|
| G1 | Compare ≥2 site–date scenarios in <2 s per verdict | Verdict renders <2 s on laptop |
| G2 | Name the binding constraint and its time window for every failing scenario | Ranked attribution with timestamps shown |
| G3 | Let the user flip a verdict live by changing a parameter | Flip detected and displayed in <1 s of slider movement |
| G4 | Serve planners (technical) and educators/public (plain) | Toggle between technical and plain views |
| G5 | Surface site-specific logistics mass penalty as a first-class constraint | LCSS rendered per site with attribution |
| G6 | Be scientifically honest — visible provenance and approximations | Provenance panel always accessible; reproducibility hash per verdict |
| G7 | Cover every explicit challenge requirement | Section 2 mapping table: 100% covered |

**Hackathon success metrics:**

| Metric | Target |
|---|---|
| Time from page load to first explained verdict | <15 s |
| Time to demonstrate a verdict flip in demo | <30 s |
| Scripted demo scenarios correctly attributed | 3 / 3 |
| Judge comprehension of the one-sentence pitch | Immediate, no follow-up question |
| Reproducibility: identical scenario → identical hash | Yes |

---

## 5. Target Users

| Persona | Primary need | How SiteLight serves them |
|---|---|---|
| **Mission planner (engineering)** | "Which constraint killed this site, and is the alternative robust to a 30-day slip?" | Ranked causal decomposition, flip points, side-by-side comparison |
| **Logistics planner** | "Which site minimizes Earth-supplied consumables over two years?" | LCSS ranking and mass-contribution breakdown |
| **Science planner** | "Does a 40 km relocation improve the power-positive window?" | Custom coordinates, delta view between scenarios |
| **Educator / student** | "Why is the south pole so hard?" | Plain-language sentence, horizon silhouette, Sun/Earth tracks |
| **Hackathon judge** | "Does this solve the stated gap in under a minute?" | Guided demo mode with one-click failing scenario and live flip |

---

## 6. Scope Tiers

### Tier 1 — MVP (must ship)
- Site and date selection, curated + custom coordinates
- Sun/Earth alt-az computation with terrain horizon
- Verdict engine (Sun, Earth, overlap)
- Binding Constraint Explainer with ranked attribution and plain-language sentence
- Scenario surgery sliders with flip-point detection
- Polar horizon plot
- Provenance panel
- Plain-language toggle

### Tier 2 — Should ship (differentiator)
- Life-Support Coupled Site Score (LCSS) as fourth constraint
- Logistics attribution tab
- Water-ice concentration slider
- Logistics flip point

### Tier 3 — Stretch (only if time allows)
- Epoch-robustness heatmap (cheap: reuses verdict engine over a date grid)
- Animated Sun/Earth track over the mission window
- Delta view between scenarios
- PDF report export
- Guided demo scripting with step-by-step overlay

### Explicitly out of scope
- Full ray-traced shadowing at sub-meter resolution
- Relay constellation or DSN link-budget modeling
- Rover traverse planning
- Full HELIOS-class ECLSS reliability simulation
- Multi-user accounts, cloud persistence
- Cost (dollar) modeling
- Any LLM-generated explanation in the verdict path

---

## 7. Functional Requirements

### Module A — Site and Date Selection
- **FR-A1** Curated site list of ≥6 entries: Shackleton Rim, Malapert Massif, de Gerlache Rim, Connector Ridge, Nobile Rim, and at least one Apollo or CLPS reference site.
- **FR-A2** Each site carries lat, lon, elevation, horizon profile reference, and water-ice concentration.
- **FR-A3** Custom coordinate entry (lat, lon, elevation) with south-polar bounds validation.
- **FR-A4** Two scenarios active (A and B) minimum; four supported as stretch.
- **FR-A5** Date picker constrained to 2027–2033.
- **FR-A6** Mission duration input (hours; default 168 h).
- **FR-A7** Display lunar local time context (solar longitude / lunar-day phase) alongside UTC.

### Module B — Ephemeris and Terrain Horizon
- **FR-B1** Compute Sun and Earth geometric altitude/azimuth at ≤10-minute sampling over the mission window.
- **FR-B2** Use a documented JPL ephemeris kernel (DE421 or DE440) with explicit frame transformation chain (Moon-fixed → local horizon).
- **FR-B3** Model Earth libration in Earth-position computation; state treatment in provenance.
- **FR-B4** Load LOLA-derived DEM for each curated site; for custom coordinates use nearest available tile.
- **FR-B5** Precompute azimuthal horizon profile at 1° azimuth resolution (360 bins) per scenario.
- **FR-B6** Visibility test = geometric altitude > terrain horizon at that azimuth. No atmospheric refraction (Moon has none).
- **FR-B7** Render horizon silhouette as polar plot with Sun and Earth tracks overlaid, colored by visibility.
- **FR-B8** Expose geometric altitude separately from terrain-masked visibility in the timeline view.

### Module C — Verdict Engine
- **FR-C1** Binary verdict per scenario: **PASS** if during the mission window cumulative power-positive time ≥ threshold **and** cumulative Earth-visible time ≥ threshold **and** overlap ≥ threshold.
- **FR-C2** Configurable thresholds: minimum solar elevation (default 2°), minimum Sun-visible fraction (default 40%), minimum Earth-visible fraction (default 30%), minimum overlap fraction (default 20%).
- **FR-C3** Verdict must be deterministic and rule-based — no ML in the verdict path.
- **FR-C4** Verdict label must distinguish failure modes when applicable: `PASS`, `FAIL (illumination)`, `FAIL (communication)`, `FAIL (logistics)`, or combined labels.

### Module D — Causal Attribution (Binding Constraint Explainer) — *Core Differentiator*
- **FR-D1** For each failing scenario, compute contiguous violation intervals per constraint.
- **FR-D2** Rank constraints by documented criticality weight × violation duration. Default weights: power loss 1.0, communication loss 0.6.
- **FR-D3** Return top-ranked constraint with: name, responsible azimuth band, start/end timestamps, duration, operational consequence.
- **FR-D4** Generate a plain-language binding-constraint sentence templated from structured data (not free-text generated):
  > *"This site fails mainly because the terrain horizon blocks the Sun for 41 hours starting 12h after landing (azimuth 200°–280°). No solar power is available during that interval."*
- **FR-D5** Sentence must update live as thresholds, dates, or sites change.

### Module E — Scenario Surgery
- **FR-E1** Sliders for: launch-date offset (±60 days), mission duration (48–336 h), minimum solar elevation (0–8°), water-ice concentration (0.1–6.0 wt%).
- **FR-E2** On slider change, re-evaluate verdict and attribution within 1 s (precomputed grid + interpolation acceptable).
- **FR-E3** Display **flip point**: the exact parameter value at which the verdict changes, and which constraint is relieved.
- **FR-E4** "Snap to flip" button sets the scenario to the nearest feasible configuration.
- **FR-E5** If no flip exists in range, display "no flip within this range" rather than failing silently.

### Module F — Comparison and Reporting
- **FR-F1** Side-by-side verdict cards for scenarios A and B.
- **FR-F2** Per-card metrics: Sun-visible %, Earth-visible %, overlap %, and (Tier 2) LCSS in kg.
- **FR-F3** Per-card binding-constraint caption, switching to the dominant failure mode.
- **FR-F4** (Stretch) Delta view showing differences in metrics and binding constraint between A and B.
- **FR-F5** (Stretch) One-page printable report with parameters, verdicts, attributions, provenance, timestamp.

### Module G — Life-Support Coupled Site Score (LCSS) — *Second Differentiator*
- **FR-G1** Each site carries a water-ice concentration value (wt%) with documented source.
- **FR-G2** Compute a two-year ECLSS-ISRU screening mass estimate per site using a documented parameter table (Section 11).
- **FR-G3** LCSS = total two-year system mass (kg). Site passes logistics if LCSS ≤ configurable budget (default 18,000 kg for 4-crew, two-year mission).
- **FR-G4** Logistics is a first-class constraint in the verdict engine.
- **FR-G5** Mass breakdown into named contributors: Earth-supplied water, ISRU reactor mass, ISRU power-system mass, ECLSS loop hardware, spares.
- **FR-G6** Ranked attribution for logistics failures with kg impact per contributor.
- **FR-G7** Plain-language logistics sentence naming the dominant driver and its mass impact.
- **FR-G8** Water-ice concentration slider enables live logistics verdict flips.
- **FR-G9** Display the logistics flip point (minimum concentration at which the site passes, or maximum tolerable drop if passing).
- **FR-G10** Show confidence flag on water-ice value: measured (LCROSS), orbital proxy, inherited, or user-adjusted.

### Module H — Epoch-Robustness Envelope — *Stretch*
- **FR-H1** Compute verdict across a monthly epoch grid (2027–2033, 84 epochs) per site.
- **FR-H2** Render 7×12 heatmap with pass/marginal/fail coloring.
- **FR-H3** Overall robustness score = fraction of passing epochs.
- **FR-H4** Classify site as robust, seasonally marginal, or structurally limited, with a one-line note.
- **FR-H5** Clicking a cell jumps the scenario date to that epoch.

### Module I — Provenance and Reproducibility
- **FR-I1** Always-accessible provenance panel listing:
  - Ephemeris kernel, frame chain, libration treatment, sampling interval.
  - DEM product and resolution, horizon azimuth resolution, DEM confidence treatment.
  - Water-ice source and confidence (Tier 2).
  - ECLSS-ISRU model reference and all parameter assumptions (Tier 2).
- **FR-I2** Explicit approximations list (no ray-tracing, DEM resolution limits, screening-level mass model, mock vs. real kernel status, etc.).
- **FR-I3** Every verdict and LCSS value carries a reproducibility hash of its input parameters and data version.
- **FR-I4** Identical inputs produce byte-identical output.

### Module J — Accessibility and Education Mode
- **FR-J1** Toggle between Technical and Plain-language views. Plain mode shows the binding sentence first and hides threshold controls by default.
- **FR-J2** Keyboard navigable controls; WCAG AA contrast on verdict states.
- **FR-J3** Guided demo mode: one click loads a scripted failing scenario, prepositions sliders, and highlights the flip.
- **FR-J4** Mobile/tablet responsive down to 1024px (comparison grid stacks).

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial scenario load <5 s; slider re-evaluation <1 s; LCSS lookup <200 ms |
| **Determinism** | Identical inputs → identical verdict, attribution, LCSS, and hash |
| **Transparency** | No black-box ML in verdict, attribution, or LCSS path |
| **Robustness** | Bad DEM values masked, never crash; invalid coordinates rejected with clear message; sliders safe at extremes |
| **Portability** | Static web deploy (Vercel/Netlify) with precomputed data bundle; no login required |
| **Accessibility** | WCAG AA contrast; keyboard navigation; plain-language mode |
| **Offline resilience** | App loads from cache if network drops during demo (service worker optional) |

---

## 9. Technical Architecture

**Stack:** React + Vite front end; Python precompute pipeline; static JSON data bundle. Precompute at build time is the key hackathon advantage: fast demo, deterministic science, no client-side compute risk.

```
┌────────────────────────────────────────────────────────┐
│  BUILD-TIME PIPELINE (Python)                          │
│  • Ephemeris: Skyfield + DE421 (swap from mock)        │
│  • DEM: LOLA tiles → azimuthal horizon profiles        │
│  • Verdict grid: dates × thresholds × concentration    │
│  • Attribution: rule engine → ranked constraints       │
│  • LCSS table: site × concentration → mass breakdown   │
│  • Epoch grid: 84 months × verdict                     │
│  Output: JSON bundle + provenance manifest             │
└──────────────────────┬─────────────────────────────────┘
                       │ static deploy
┌──────────────────────▼─────────────────────────────────┐
│  CLIENT (React)                                        │
│  • Scenario builder, comparison cards                  │
│  • Polar horizon plot (canvas or SVG)                  │
│  • Attribution panel + plain-language sentence         │
│  • Surgery sliders → grid lookup                       │
│  • LCSS tab + logistics attribution                    │
│  • Robustness heatmap (stretch)                        │
│  • Provenance panel + hash                             │
└────────────────────────────────────────────────────────┘
```

**Data sources:**
- Ephemeris: JPL DE421/DE440 via Skyfield (documented, well-tested).
- Topography: LOLA polar DEM (document product name and resolution in provenance).
- Water ice: LCROSS/Cabeus anchor (5.6 ± 2.9 wt%), Artemis candidate upper bound (≤2.0 wt%), neutron-spectrometer proxies (>0.5 wt% in PSRs).
- ECLSS-ISRU model: screening-level parameter table (Section 11), grounded in published HELIOS-type relationships.

**Key architectural decision:** precompute everything that is expensive; compute nothing on the client except lookup, interpolation, and rendering.

---

## 10. Information Architecture / Screens

1. **Header** — brand, Technical/Plain toggle, Demo Mode button, Provenance button.
2. **Left sidebar — Scenario Builder** — two scenario blocks (site, date), mission parameters, feasibility thresholds.
3. **Center top — Comparison** — two verdict cards with metrics and binding-constraint captions.
4. **Center bottom — Scenario Surgery** — sliders and flip banner.
5. **Right panel — Deep Dive tabs:**
   - **Horizon** — polar plot with Sun/Earth tracks and legend.
   - **Attribution** — plain-language sentence + ranked constraint list.
   - **Logistics** — LCSS value, mass-contribution bar, ranked contributors, confidence flag.
   - **Robustness** (stretch) — heatmap and classification note.
   - **Provenance** — data manifest, approximations, hash.

---

## 11. LCSS Model Parameter Table (Minimum Viable Implementation)

| Parameter | Value / source | Notes |
|---|---|---|
| Crew size | 4 | Fixed baseline; document as assumption |
| Mission duration | 730 days | Two-year baseline |
| Water-ice anchor (LCROSS) | 5.6 ± 2.9 wt% | Highest documented south-polar value |
| Artemis candidate upper bound | ≤2.0 wt% | Default for curated Artemis-region sites |
| South-polar PSR lower bound | >0.5 wt% | Default for low-confidence sites |
| Extraction recovery efficiency | 75% | Mass recovery from regolith to stored water |
| Reactor max power | 2500 W each; parallel reactors beyond | Iterative reactor count |
| Reactor mass proxy | 0.46 m dia × 1.0 m height, Inconel, 3.0 mm wall | Volume × density estimate |
| ISRU power specific mass | Documented constant (e.g., 20 kg/kW solar+storage) | State clearly as placeholder |
| ECLSS hardware mass | Fixed per architecture (e.g., 8,000 kg for 4-crew loop closure) | Document source or assumption |
| Spares fraction | 10% of hardware mass | Document as assumption |
| Logistics budget | 18,000 kg | Configurable; document derivation |

All parameters must be visible in the provenance panel.

---

## 12. Acceptance Criteria (Demo-Day Checklist)

- [ ] Two scenarios load side by side with verdicts in <5 s.
- [ ] At least one curated scenario is a documented **illumination or communication FAIL** with a named binding constraint and timestamped interval.
- [ ] At least one curated scenario is a documented **logistics-only FAIL** (passes Sun, Earth, overlap; fails LCSS).
- [ ] Dragging the launch-date slider flips a verdict, and the flip point is displayed.
- [ ] Dragging the water-ice slider flips the logistics verdict, and the logistics flip point is displayed.
- [ ] The plain-language sentence updates live and is grammatically correct for all constraint types.
- [ ] The horizon silhouette visibly shows the Sun track crossing below terrain at the failure time.
- [ ] The Logistics tab shows a mass-contribution breakdown and confidence flag.
- [ ] The provenance panel lists kernel, DEM product, resolutions, water-ice source, LCSS assumptions, and all approximations.
- [ ] No crashes on invalid coordinate entry or on a scenario with no terrain data.
- [ ] Identical scenario re-run produces identical hash.
- [ ] Guided demo mode runs end-to-end in under 90 seconds.

---

## 13. Judging Criteria Alignment

| Criterion | Weight (typical) | How SiteLight scores |
|---|---|---|
| **Impact** | 30% | Directly solves the replanning bottleneck; LCSS surfaces a documented gap in site-selection literature; serves planners, educators, and public |
| **Creativity** | 20% | Causal negotiation (not just comparison) and logistics-coupled scoring are both novel in this challenge space |
| **Validity / Feasibility** | 20% | Deterministic rule-based engine; precomputed science; documented parameter table; no black-box ML in the verdict path |
| **Prototype quality** | 20% | Live flip demos, polar horizon plot, four-tab deep dive; runs end-to-end in 90 s |
| **Presentation** | 10% | One-sentence pitch, guided demo mode, plain-language mode, README with screenshots |

**Strategic note:** The core tool earns the Impact and Validity points. The BCE and LCSS earn the Creativity points. The demo earns Presentation. Every dimension is deliberately covered.

---

## 14. 48-Hour Build Plan

| Phase | Hours | Deliverable | De-risk gate |
|---|---|---|---|
| **P0 — Setup** | 0–4 | Repo, stack, DE421 kernel loaded, one site's Sun/Earth alt-az time series validated against a known reference | Geometry is correct |
| **P1 — Science core** | 4–10 | LOLA horizon profile pipeline for 3 sites; visibility flags; verdict engine; unit tests on 3 scenarios | Verdicts are plausible |
| **P2 — Core differentiator** | 10–16 | Ranked attribution engine + templated plain-language sentence; verified on all 3 scenarios | BCE works for every failure mode |
| **P3 — Core UI** | 16–24 | Scenario builder, comparison cards, verdict cards, plain/technical toggle | **MVP complete and demoable** |
| **P4 — Core UI polish** | 24–28 | Polar horizon plot with Sun/Earth tracks, surgery sliders, flip banner | Flip demo works |
| **P5 — LCSS integration** | 28–36 | Parameter table → precompute mass table; fourth metric column; Logistics tab; water-ice slider; logistics flip point | Logistics-only FAIL verified |
| **P6 — Provenance + education** | 36–40 | Provenance panel, approximations list, hash, plain-language mode, guided demo mode | Honesty and accessibility covered |
| **P7 — Stretch (optional)** | 40–44 | Robustness heatmap; delta view; PDF export — pick at most two | Only if P0–P6 are solid |
| **P8 — Rehearse** | 44–46 | Script the 90-second demo; verify both flip points; record backup video | Demo is repeatable |
| **P9 — Submit** | 46–48 | README, slides with one-sentence pitch, video, reproducibility hash demo | Submission complete |

**De-risking rule:** If P2 is not working by hour 16, cut the LCSS (P5) and ship a flawless core. If P5 is not working by hour 36, present LCSS as "in progress" and rely on the BCE for the creativity score. Never let a differentiator break the core.

---

## 15. 90-Second Demo Script

| Time | Action | Words |
|---|---|---|
| 0:00–0:10 | Show title, one-sentence pitch | "When a lunar landing date slips, planners re-run separate tools by hand. SiteLight shows them exactly which constraint broke and what fixes it." |
| 0:10–0:25 | Load Scenario A (Shackleton Rim, PASS) and Scenario B (de Gerlache Rim, FAIL) | "Two sites, same date. One passes, one fails. But *why*?" |
| 0:25–0:40 | Open Attribution tab for B | Read binding sentence aloud: "Terrain horizon blocks the Sun for 41 hours..." Point at polar plot where Sun track dips below the dark terrain silhouette. |
| 0:40–0:55 | Drag launch-date slider to flip point | "Fourteen days later, the Sun rotates past the ridge — FAIL becomes PASS. That's the flip point." |
| 0:55–1:10 | Switch to Logistics tab on a different site | "Here's a site that passes every power and comm check — but fails on logistics. Its water ice is too low for ISRU, so it carries thousands of extra kilos of Earth-supplied water." |
| 1:10–1:25 | Drag water-ice slider to logistics flip point | "At 2.1 wt% it would pass. The real value is 0.8. This is the trade-off no other tool shows." |
| 1:25–1:30 | Point at Provenance tab | "Every number is reproducible, with a hash and an honest list of approximations." |

---

## 16. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| LOLA DEM integration runs long | Medium | Start with 3 curated sites only; custom coordinates use nearest tile at lower horizon resolution; cut custom coords if needed |
| Ephemeris frame errors produce wrong visibility | Medium | Validate against a published reference case before demo |
| Slider re-evaluation too slow | Low–Medium | Precompute scenario grid; interpolate; cap sweep resolution |
| Demo scenario doesn't actually fail / doesn't flip | High if unprepared | Choose demo scenarios from the precomputed grid *after* verifying both flip points exist; rehearse |
| LCSS produces implausible numbers | High | Calibrate against published HELIOS-scale outputs; present as a screening estimate, not a design value |
| Judges see LCSS as "fake ECLSS" | Medium | Lead with the documented gap statement; position as decision-visibility layer, not a replacement for systems engineering |
| Perception of overlap with existing ARTEMIS submission | Medium | Lead with causal-negotiation and logistics framing; never claim superior ephemeris accuracy |
| Scope creep from Tier 3 | High | Freeze Tier 3 until P0–P6 are solid; at most two stretch items |

---

## 17. Submission Checklist

**Code and demo**
- [ ] Deployed URL, works on a fresh browser, no login
- [ ] README with one-sentence pitch, screenshots, run instructions
- [ ] Guided demo mode works end-to-end in <90 s
- [ ] Backup video recorded (in case live demo fails)

**Science and honesty**
- [ ] Provenance panel lists every data source and assumption
- [ ] Approximations list is explicit and complete
- [ ] Reproducibility hash verified identical on re-run
- [ ] No black-box ML in the verdict, attribution, or LCSS path

**Presentation**
- [ ] Slides contain the one-sentence pitch on slide 1
- [ ] Slides contain the challenge-requirement mapping table
- [ ] Slides contain at least one screenshot of each deep-dive tab
- [ ] Verbal pitch rehearsed to ≤60 seconds

**Challenge coverage**
- [ ] All 8 explicit asks in Section 2 are demonstrably met
- [ ] At least 6 of the "potential considerations" are met
- [ ] The tool serves planners, educators, and public (plain-language mode)

---

## 18. Appendix — Canonical Demo Scenarios

These must be verified against the actual precomputed data before the demo.

| Scenario | Site | Date | Expected result | Flip mechanism |
|---|---|---|---|---|
| A (reference PASS) | Shackleton Rim | 2027-01-13 | PASS all constraints | — |
| B (illumination/comm FAIL) | de Gerlache Rim | 2027-01-13 | FAIL (Sun blocked by SW ridge) | Launch-date offset ≈ +14 d → PASS |
| C (logistics-only FAIL) | Low-concentration Artemis candidate | Any date (passes Sun/Earth) | FAIL (logistics): LCSS > 18,000 kg | Water-ice slider to threshold → PASS |

Scenario C is the differentiator. It must pass every traditional constraint so the logistics failure is unambiguous.

---

**End of PRD.** This document covers every explicit and suggested challenge requirement, integrates the Binding Constraint Explainer as the core differentiator, integrates the LCSS as the second differentiator, tiers the scope to de-risk the 48-hour build, and provides the acceptance criteria, demo script, and submission checklist needed to execute.

Would you like me to generate the **Python precompute script** for the LCSS mass table and horizon profiles, or draft the **slide deck** to accompany this PRD?
