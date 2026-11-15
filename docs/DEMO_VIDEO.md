# SiteLight website walkthrough

The Demo video tab follows Evidence. It hosts a 2–3 minute recording of actual application interactions, with written explanations beside the app. This is the longer website tutorial and is separate from the submission guide's 30-second video option.

The tour covers the purpose of SiteLight, independent A/B scenarios, site and mission settings, cinematic versus measured terrain, the horizon and timeline, comparing sites under shared requirements, testing another start, all four visible Screening tabs, and Evidence/export.

## Delivery

- Public player URL: https://sitelight.vercel.app/?view=demo
- MP4, poster, English WebVTT captions, transcript and provenance: `public/demo/`.
- Chapter data and video identity: `data/demo/walkthrough.json`.
- Source observations and numerical results remain the app's real NASA/partner-derived records. The recording does not add measurements or enable the scientific backend.
- The movie has no audio. Explanations appear in its sidebar, with optional English captions and a readable transcript.
- The player loads metadata only, supports chapter seeking and playback speed, and pauses when the visitor leaves Demo video. Viewing and seeking do not edit either mission scenario.

## Reproducing the capture

`scripts/record-demo.mjs` drives actual Chrome clicks and saves a private recording under `.deploy-local/tutorial/`. Run `node scripts/record-demo.mjs --dry` first. Install Playwright's recording binary with `node node_modules/@playwright/test/cli.js install ffmpeg` if needed. `SITELIGHT_DEMO_URL` can point to a local production build. Match the public capabilities response when recording local bundled-data behavior.

Run `node scripts/record-demo.mjs` to capture. Then set `SITELIGHT_FFMPEG` to a local FFmpeg executable and run `node scripts/prepare-demo.mjs`. The script trims setup time and writes the web-ready H.264 movie with fast-start metadata, poster, captions, transcript and source identity. It validates the chapter count and 2–3 minute duration. Raw video and rehearsal screenshots stay private and do not belong in the deployment.

ChatGPT/Codex assisted the script, written explanations and implementation. The video shows the real application and contains no SI-generated images, audio or video footage. The app retains NASA SVS credit for Moon maps and labels illustrative cinematic terrain.
