# DayPilot 4.4 — Free Local AI Edition

Your existing DayPilot PIN-protected app + optional local AI model + ChatGPT fallback.

## What it does
- The PIN is still validated on Render's server (`DAYPILOT_ACCESS_CODE` still required).
- Choose **AI Assistant → Load free AI on this device** to download a small open-source language model to your browser. The first download may be hundreds of MB, may take time, and needs WebGPU + enough memory/storage. The model downloads from an external model host; conversations are generated locally (not a hosted AI API).
- Choose **Ask ChatGPT instead** for a fallback shortcut. It opens ChatGPT separately and does not automatically transmit your private DayPilot records.
- You can explicitly enable **on-device dashboard context**; it is off by default.
- Your existing planner, barber earnings, markets, gym, skincare, and other local data remain in browser storage.
- No API key, paid AI plan, cloud sync, or automated brokerage actions.

## Upgrade the live site
1. Back up from DayPilot Settings.
2. Download the ZIP and extract it.
3. Open your private GitHub repo, inside the **same folder Render uses as Root Directory** (`DayPilot_Private_Deploy_Ready` in the setup so far).
4. Replace `index.html`, `server.js`, `package.json`, `sw.js`; **add** the NEW `local-ai.js`.
5. Commit on `main`. Render deploys or select **Manual Deploy → Deploy latest commit**.
6. In Render Environment, KEEP `DAYPILOT_ACCESS_CODE`. Do not add an API key.
7. Test that your site shows a PIN, then AI Assistant → Load free AI. Safari or Chrome are recommended. If the model can't run, use Ask ChatGPT or existing quick answers.

## Important
- Do not upload the ZIP into the GitHub app folder; upload the individual contents.
- Model weight downloads are big. Not all mobile browsers have WebGPU/GPU memory support. We could not run the actual model inference in this build environment; check it on your real iPhone/computer.
- Because DayPilot has no full user accounts, data remain per-browser/per-device. PIN protection is not equivalent to audited multi-user security.
- An external JavaScript module CDN is loaded only after you tap to load the local model. It means the third-party library code is fetched into your browser, and some network contact still occurs for model download. Do not put credentials or highly sensitive data into experimental model tools.
- 'Ask ChatGPT' opens a different service, not an embedded ChatGPT session, and may have its own age, account and usage rules.
