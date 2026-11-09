# DayPilot — private deployment starter

This folder is ready to upload to a **private GitHub repository**. Upload these files **to the repository root** (do not upload the outer folder itself). Do not upload personal account credentials or backups.

**Important:** This deployment copy is configured to reject web app page requests until all three basic server settings exist: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DAYPILOT_OWNER_EMAIL`. This prevents accidentally launching a usable public dashboard without authentication configured. The source HTML and assets are not secret; the web service will remain reachable by people who know the URL, but access to your account/data is restricted by the app login and Supabase database policies.

## 1 — Make a private GitHub repository

Go to https://github.com/new, choose a repository name (for example `daypilot-private`), set **Private**, and create. Upload this folder's files through **Add file → Upload files**. Never upload `.env` or your backup files.

## 2 — Create the Supabase project

Go to https://supabase.com/dashboard, create a project, and run the statements in `schema.sql` in **SQL Editor**. In Project Settings / API (labels may differ), copy its **Project URL** and **publishable/anon key**. Do not copy or publish the **service role key**. In Authentication, enable email-link login. The project URL and publishable key will be configured as Render environment variables; **do not edit `config.js` or any public source file to insert secrets**.

## 3 — Deploy your Node app on Render

Go to https://dashboard.render.com/ and choose **New → Web Service**. Link GitHub and select `daypilot-private`. Select Node, **Build Command** `npm install`, **Start Command** `npm start`. Set environment variables in Render:

* `SUPABASE_URL` = Supabase Project URL
* `SUPABASE_ANON_KEY` = Supabase publishable/anon key (not service role)
* `DAYPILOT_OWNER_EMAIL` = the email address that will be the only authorized user

Deploy to get your URL, typically `https://something.onrender.com`. Add this exact URL to Supabase **Authentication → URL Configuration → Site URL and Redirect URLs**. Sign into DayPilot using the one-time email link on that address. After your account is created, turn off **Allow new users to sign up** in Supabase Authentication so only your existing account can sign in. Keep email confirmation on.

Once the login works, you can optionally add `OPENAI_API_KEY` as a **secret Render environment variable** to enable live DayPilot AI. This is an OpenAI **API** key, billed separately from ChatGPT. Do not put it in GitHub, HTML, or a chat message. Other integrations need additional implementation; publishing alone does not sync Gmail, Moodle, iCloud, or stock prices.

## 4 — Install to iPhone

On iPhone, open your HTTPS Render URL in **Safari → Share → Add to Home Screen**, choose **Open as Web App** and **Add**. The icon is now on your Home Screen. To migrate your older data, export a JSON backup from the old app and restore it under Settings in the hosted version.

## 5 — Update later

Edit files in the same GitHub repository. When Render automatic deploys are enabled, a push to the connected branch updates the **same website and Home Screen app**. Refresh/open DayPilot to pick up updates. Keep backups. If you ever change hosting domains, you may need to install a new Home Screen icon.

## Security caveat

This is a **starter project**, not security-audited software. It controls dashboard access with an email-link sign-in and per-user database rules, but static asset URLs remain public. Do not upload passwords, sensitive identity documents, or brokerage login credentials. For truly private page-level access, add a separate authenticated access proxy. Be sure you meet each service's sign-up requirements; if any require an adult account holder, ask a parent/guardian for help rather than bypassing the requirement.

For deeper details, consult `PUBLISH_PRIVATE.md`.
