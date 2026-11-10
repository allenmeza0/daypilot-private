# DayPilot 4.1 — No Login Edition

This version **removes the sign-in screen entirely**. It uses the original DayPilot dashboard, assignments, calendar, barber earnings, gym, skincare, email follow-ups, and manual markets journal.

## Your hosting setup (same URL)

Replace these files **inside the existing repository folder used by Render**:

- `index.html`
- `server.js`
- `sw.js`
- `package.json`

Commit the update on GitHub. Render will redeploy the same app URL. Open in a private browser window or hard-refresh after it says Live. You don't need to change Supabase settings, but DayPilot in this mode ignores them entirely.

## Important consequences

- Anyone can open the public DayPilot web address, **but only sees their own empty/local browser data**. Your browser's saved data is not sent to the server or shared with other visitors.
- There is **no cloud sync** between devices. Each browser maintains separate data. Export a backup JSON in Settings and import on another device.
- No live AI or background push notifications. In-app quick responses and reminders while open still work. This protects your paid OpenAI key from becoming an unprotected public endpoint.
- Gmail, iCloud, Moodle direct auto-imports, brokerage linking, and live market prices are not enabled.
- Never store passwords or account access tokens in the notes or backups. Be cautious with private client contact and financial information on a shared device.
- Before clearing browser storage or switching devices, export a backup. The service worker and localStorage use the same origin and storage key as the earlier hosted app, so existing local browser data should remain. This project was not given access to your actual hosted account.

For true private cloud sync or personal-only AI access in the future, access must be secured in another way (e.g. authenticated site gateway, passkeys, or owner-only backend). A private GitHub repository alone does not protect a public Render website.
