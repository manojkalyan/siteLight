# SiteLight — hybrid prototype

Open [lunar-hybrid-prototype.html](../lunar-hybrid-prototype.html) directly in a modern browser. It is a self-contained offline HTML file, including the embedded 3D explorer. Keep [the original immersive prototype](../lunar-prototype.html) as a separate sample; it was not modified to create this version.

## Four views

1. **Compare:** Light Apple-inspired workspace with two independent scenarios, common requirements, actual synthetic interval charts, explanations, and a date preview.
2. **Explore:** Embedded original Lunar Studio with procedural WebGL terrain, spring camera motion, floating glass panels, and a Canvas fallback.
3. **Logistics:** Clearly labeled static mass-breakdown fixture. It does not calculate LCSS or participate in environmental verdicts.
4. **Data:** Synthetic/real-data status, assumptions, links to acquisition sources, and prototype lineage.

## Shared context

Select A or B before opening Explore. The selected site's date, duration, requirements, and inspected time pass into the explorer. User changes return to the comparison workspace. Each scenario preserves its own baseline date and preview offset.

Moving the date slider previews a change. Apply preview commits it; Reset preview restores the original date. Find a passing date tests daily starts within ±60 days using the same deterministic sample evaluator. It does not change thresholds to manufacture a passing result.

All geometry, terrain, sites, and results are synthetic. The artistic terrain and analytic horizon are separate demonstration models. The two-year logistics example is distinct from environmental mission duration, and its mass values are fictional UI fixtures.

## Packaging and verification

The single file includes an encoded copy of the original explorer. It does not depend on another HTML file at runtime. `scripts/assemble-hybrid-prototype.mjs` embeds the evaluator and explorer from the original and records its SHA-256 without altering it. Run the assembler after intentionally changing the source explorer; it updates the marked embedded regions while retaining the hybrid shell.

Run `npm test` for the original evaluator/fallback checks and the hybrid navigation/context/preview tests. Contract-harness tests do not establish actual browser layout or GPU shader behavior. Browser visual verification could not run because the computer-use preview service was unavailable.
