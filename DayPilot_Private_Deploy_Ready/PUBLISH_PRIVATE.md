# DayPilot 4 · Private deployment guide

You **do not need the Apple App Store**. This is a personal iPhone-installable web app (PWA). Publishing the website is separate from publishing an App Store listing.

## Before you start

- **Do not send ChatGPT, GitHub, or DayPilot your personal passwords or verification codes.** Authorize third-party accounts only through their official sign-in flows once an integration is actually implemented.
- The current app **does not import Gmail, Moodle, WebAssign or iCloud automatically**. You can manually import school `.ics` files and export your calendar to Apple Calendar. iCloud CalDAV integration is a planned feature, **not connected**.
- The Markets tab **does not connect to a brokerage or live stock-price feed**. You manually log actual trades, dividends, reference prices and watch levels. It cannot trade or send live price alerts.
- This project is a starter app, not a security-audited financial/medical platform. Back up your records regularly and use your brokerage statement for official holdings and tax records.

## Recommended stack

- **GitHub private repository**: source control so your future changes can deploy automatically.
- **Render Node Web Service**: HTTPS hosting for the app plus the private AI endpoint. Render can deploy from a *private* GitHub repo and automatically publish changes from the linked branch.
- **Supabase Auth + database**: email-link sign-in and row-level security so your personal records are only accessible to your account. DayPilot's app gate also asks for a login when Supabase is configured.
- **OpenAI API (optional)**: live AI questions about your planner and investing basics. API keys stay on the server, **not** in HTML, GitHub or your phone.

A *private GitHub repository does not automatically make a hosted website private*. The Render address itself is internet reachable. The included DayPilot sign-in gate controls use of the interface; Supabase RLS guards personal records. The static HTML/CSS/JS assets are still publicly downloadable. For a truly inaccessible website address, an additional access proxy/custom-domain setup would be required. Do not confuse these two privacy levels.

## Step-by-step (desktop setup, iPhone usage)

### 1. Back up the old app

In the previous DayPilot version, open **Settings → Download backup JSON**. Keep the file somewhere private. After DayPilot 4 is hosted and you're signed in, **Settings → Restore backup** to migrate classes, barber bookings, skincare and gym records. Version 4 reads the old data format and adds empty watchlist/trade arrays.

### 2. Create a private GitHub repository

1. Sign in at **https://github.com/** using GitHub's own website.
2. Create a repository, e.g. `daypilot-private`, and set visibility to **Private**.
3. Unzip the `DayPilot_4_Obsidian_Markets_Private.zip` file and upload the **contents of the `DayPilot_4_Obsidian` directory** to the repository root (so `server.js` and `package.json` are at the top level).
4. Never commit `.env`, downloaded backups, customer lists, or access keys. The supplied `.env.example` contains only blank examples.

### 3. Set up the database and login at Supabase

1. Create a personal project at **https://supabase.com/**.
2. In its SQL Editor, paste and run the included `schema.sql`. It creates tables for encrypted-transport cloud syncing and per-user row-level security.
3. In project API settings, copy **Project URL** and the **anon/publishable key**. The anon key is meant for public clients; the **service role key must stay secret** on the server.
4. Under Authentication, enable email-link sign-in. Keep email confirmation enabled. While testing your *first* account, allow it to be created. Once your account exists, under Auth general settings, turn **Allow new users to sign up** off. This makes the owner-only use easier to manage.
5. After Render gives you a URL, add its exact HTTPS address to Authentication **URL Configuration → Site URL** and **Redirect URLs**.

### 4. Deploy the Node app on Render

1. Go to **https://render.com/**, create an account if needed, and choose **New → Web Service**.
2. Connect GitHub through Render's official authorization, then select your private `daypilot-private` repository.
3. Runtime: **Node**. Build command: `npm install`. Start command: `npm start`. Render provides the port; `server.js` listens on `0.0.0.0`.
4. In **Environment**, set:

   - `SUPABASE_URL` = your Supabase Project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon/publishable key
   - `DAYPILOT_OWNER_EMAIL` = **your** email address for the private DayPilot login
   - `OPENAI_API_KEY` = optional key for full conversational AI, held on Render only
   - `OPENAI_MODEL` = optional model name supported by your API account

5. Deploy. You'll receive an HTTPS URL like `https://your-service.onrender.com`. This is **an example, not a live link to your app**.
6. Add that exact URL in Supabase Auth redirect settings (step 3). Open the URL, request your magic email link, and sign in. Do not share that email link.

**Check**: if `/api/status` says `cloudEnabled: true`, email login should work once Supabase is configured. `/api/access` requires your valid session; non-owners get a 401 when `DAYPILOT_OWNER_EMAIL` is configured. The app's static code is still on a public web address, not end-to-end private hosting.

### 5. Install it on your iPhone

1. Open your own hosted HTTPS address in **Safari**.
2. Tap **Share → Add to Home Screen** (and choose **Open as Web App** if shown).
3. Tap **Add**. DayPilot appears on your Home Screen like an app; it does not need an App Store listing.
4. Sign in and restore your backup on the new hosted address. Keep occasional backups too.

### 6. Update it later without new downloads

Edit the source in the **same private GitHub repo** and commit/push to its connected branch. Render's automatic deploy feature publishes the updated code to the *same URL*. Reopening/refeshing DayPilot normally loads the new version. Because it stays on the same origin, your browser data is usually preserved; Supabase cloud sync is the better safety net. The existing service worker uses network-first loading for app assets, but a refresh may be needed.

GitHub connection to ChatGPT is separate from GitHub's deployment connection to Render. A ChatGPT connection does **not** grant me deployment access automatically; future edits need your authorization or changes made in GitHub yourself.

## Reliability, pricing and safety notes

- **Render Free web services spin down after 15 minutes without incoming traffic**, and can take time to wake. Fine for a trial, **not reliable for background reminder delivery**. Use a non-sleeping paid plan or an external scheduled notification service if timing matters. Verify current pricing with the provider before buying.
- Supabase free tiers and quotas may change; check current limits. OpenAI API usage is billed separately from ChatGPT. Set an API spending budget.
- If you enable phone notifications, the included push server requires additional keys (`SUPABASE_SERVICE_ROLE_KEY` and VAPID keys). Never put these in the browser or GitHub. Notifications are best-effort, not a guaranteed alarm.
- User-provided market prices are **not quotes** and do not refresh automatically. Calculated realized gains use a simplified average-cost estimate, which may differ from your brokerage's reporting and tax treatment. Do not treat DayPilot as authoritative tax software.
- Use a strong, unique password and MFA on **GitHub, Render, Supabase and your email**. Since email links grant access to DayPilot, securing the email account is essential.
- **If you want the webpage itself inaccessible to anyone else**, rather than just your data/login being private, ask to add a site-level access proxy before sharing the URL. The starter deployment does not implement that extra layer.

## Useful official documentation

- Render's Node deploy guide: https://render.com/docs/deploy-node-express-app
- Render's GitHub auto-deploy: https://render.com/docs/deploys
- Render's free hosting limitations: https://render.com/docs/free
- Supabase authentication: https://supabase.com/docs/guides/auth
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Apple Home Screen web app: https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iphea86e5236/ios
