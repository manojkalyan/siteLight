# GitHub and Vercel deployment

Production frontend: **https://sitelight.vercel.app**. Repository: **https://github.com/manojkalyan/siteLight**. The initial cleaned source commit is `0dfea81143c89f8905ff9c0dbec1e46d2a305b35`; its GitHub build passed. The Vercel project is `sitelight` under `manoj2001kalyan-gmailcoms-projects`.

The initial production deployment was published through the authenticated Vercel CLI. Anonymous access returned HTTP 200. Live Chrome checks passed for the real-data assessment, both Apollo waveforms (78,840 and 77,760 samples), complete waveform CSV, JSON canonical hash, A/B preservation and mobile bounds, with no JavaScript errors or failed app resources.

Two connections remain separate from that live frontend:

1. **Automatic GitHub deploys:** Vercel currently has no GitHub Login Connection for this account, so repository linking was rejected. Connect `manojkalyan` under Vercel account Authentication/Login Connections, then connect `manojkalyan/siteLight` in this project's Git settings. Until then, future pushes do not automatically redeploy; use the CLI or complete that connection.
2. **On-demand scientific backend:** the public capabilities endpoint correctly reports `available: false` and `deploymentMode: bundled-real-data`. The live frontend uses the prepared real records. New backend-dependent records are not fabricated. Deploy and configure the separate service below to enable those operations.

The repository root is this directory: it contains `package.json`, `index.html`, `src/` and `vercel.json`. Import `manojkalyan/siteLight` into Vercel with the root directory left as `.`. Do not select an additional nested SiteLight folder.

## Frontend settings

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Node.js | 24.x |
| Install | `npm ci --no-audit --no-fund` |
| Build | `npm run build` |
| Output | `dist` |
| Production branch | `main` |

`vercel.json` supplies these build settings. GitHub Actions verifies the clean-source build and deployment/report contracts. Vercel's GitHub integration can redeploy automatically when `main` changes.

## What stays in GitHub

Application source, current requirements, source manifests, small prepared scientific/thermal/seismic datasets, rendering maps, scientific preparation scripts and tests. The prepared real-data bundle is required by the application and is intentionally retained. Exact source bytes are preserved across checkout platforms because scientific provenance includes SHA-256 identities.

Local Python/tool installations, `node_modules`, raw scientific archives, caches, credentials, build outputs, generated standalone HTML, screenshots, browser test output, old concept-image exports and ZIPs are ignored. These files remain on the development machine; exclusion from GitHub does not delete them. Do not force-add `.env`, `.tools`, `data/raw`, `data/cache`, `docs/review` or `node_modules`.

## Scientific backend

The frontend's bundled real observations, terrain assessment, A/B comparisons, loaded January–March 2027 starts, historical thermal/seismic context, exploratory models and exports run in the browser. On-demand dates outside bundled coverage, new custom terrain points, 84-month record generation and recomputed 100-member terrain ensembles use the separate scientific service. A Vite production build does not run its development-server middleware.

The Vercel endpoint `/api/science/[endpoint]` is a same-origin bridge. Without a backend URL, its capabilities response explicitly sets `available: false`; no synthetic result or borrowed coverage is substituted. Connecting a backend requires deploying the scientific runtime and its verified source assets separately.

Set these **server-side** variables in Vercel when the backend is deployed:

| Variable | Meaning |
| --- | --- |
| `SCIENCE_API_URL` | HTTPS origin of the deployed scientific service, for example `https://your-science-service.example` |
| `SCIENCE_API_TOKEN` | Optional backend authorization token; the backend must validate the same token |

The bridge calls the fixed `/api/science/capabilities`, `/coverage`, `/point`, `/monthly` and `/terrain-ensemble` paths on that origin. It forwards only small JSON request objects, never browser cookies or credentials, and streams large JSON responses. Its backend URL and token are not `VITE_` variables and are not included in browser code. Configure host-level access/rate limits and persistent source/cache storage on the actual scientific backend before making its compute endpoints public.

This bridge does not by itself deploy or port the existing Windows-local Python runtime. A full backend deployment still needs a supported Python/runtime configuration, independently verified source/kernel/terrain assets, cache storage and live API verification. Do not describe the full on-demand service as deployed until that work passes.

## Verification commands

```powershell
npm ci
npm run test:deployment
npm run build
```

These checks work from a clean frontend checkout. The complete historical research suite also uses locally retained raw source assets and generated prototype/standalone fixtures; those are deliberately excluded from the lightweight GitHub upload. The source-acquisition and preparation instructions remain in the individual model documents.

After deployment, verify Explore, Compare, Screening → Seismic, real waveform loading, A/B independence and JSON/CSV downloads. Check `/api/science/capabilities` before testing any on-demand scientific workflow. Physical scientific and engineering acceptance remains open regardless of hosting status.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [project configuration](https://vercel.com/docs/project-configuration/vercel-json), [function limits and streaming](https://vercel.com/docs/functions/limitations).
