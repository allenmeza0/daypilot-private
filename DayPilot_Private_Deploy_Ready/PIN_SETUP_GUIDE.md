# DayPilot 4.2 — Private access code edition

This edition adds a **server-side access-code screen** instead of Supabase email sign-in. Your existing hosted URL stays the same. No sign-in emails. **Your planner, skincare, barber and investing records remain in each device’s browser** and are not synced across devices.

## Update your existing GitHub/Render app

1. **Back up your DayPilot data**: open your existing dashboard and use Settings → Export backup before updating. Do not clear your browser’s storage.
2. Download and extract the `DayPilot_PIN_Update.zip` file. It contains exactly four replacement files.
3. Open your private GitHub repository `daypilot-private` → `DayPilot_Private_Deploy_Ready` (the folder already configured as Render **Root Directory**).
4. Replace `server.js`, `index.html`, `sw.js`, and `package.json` in **that same folder**. Commit to `main`. Do not create a nested folder or upload the ZIP itself.
5. In Render → your DayPilot Web Service → **Environment**, add an environment variable with **Key** `DAYPILOT_ACCESS_CODE` and **Value** a unique private code **at least 6 characters**; **8+ random digits or a longer passphrase is recommended**. Never put the code in GitHub, screenshots or chat. Do not reuse a password.
6. Save/deploy in Render. Its status should become **Live**. Open your DayPilot URL in a private browser window. You should see **Unlock DayPilot**. Enter your code and press **Unlock DayPilot**.
7. Your dashboard has a **Lock** button to end the current session manually. The server remembers successful sessions for up to 14 days, but a Render restart or redeployment will require re-entering the code. This is intentional for simple private hosting.

## Testing

- Visiting `/` in a fresh private browser window should show the access-code page.
- Wrong codes should be rejected. After 8 failed attempts, further attempts are blocked temporarily for about 15 minutes.
- After unlocking, `/api/status` should show `accessCodeEnabled: true`, `cloudEnabled: false`, `storage: this-device-only`.
- Visit the same site in an incognito window (without unlocking): dashboard source should **not** load. 
- If you still see an unlocked dashboard, refresh while online, close old tabs, and let the new service worker update. Avoid clearing **site data**, which would delete local saved records.

## Limitations and safety

A code **reduces access risk; it does not eliminate security risk.** A short or shared code can be guessed or leaked, and a person who can use your already-unlocked phone/browser may access local data. Avoid public/shared devices. The frontend is not a vault for sensitive credentials. Do not put financial passwords or client secrets in notes.

This is a single-process, memory-backed session gateway intended for one personal Render service; the session expires after 14 days and resets after redeploys/restarts. It is not a security-audited product, and it is not appropriate for storing highly sensitive records or providing a publicly billable AI endpoint without further safeguards. **Live AI, Gmail, iCloud, school sync, cloud storage and market quotes remain disabled**. Add backend authorization, spending caps and provider OAuth before enabling those capabilities.

The access code stays in Render Environment and is compared server-side. If you forget it, you can set a new one in Render and redeploy. You don't need Supabase for this device-local mode; existing Supabase variables are ignored. 
