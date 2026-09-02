Deployment notes — Vercel (frontend) + Render (backend)

Overview
- Frontend: Vercel hosts the static Vite build (`dist`).
- Backend: Render hosts the existing Express app (Node), keeping `SUPABASE_SERVICE_ROLE_KEY` secure.
- Supabase remains the DB/Auth/Storage provider.

Environment variables
- Backend (Render service):
  - SUPABASE_URL (required)
  - SUPABASE_ANON_KEY (required)
  - SUPABASE_SERVICE_ROLE_KEY (required, secret)
  - SUPABASE_DB_URL (required for running schema apply scripts)
  - GEMINI_API_KEY (optional)

- Frontend (Vercel project):
  - VITE_SUPABASE_URL = SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY

Render service (backend)
1. Create a new Web Service in Render and connect your repo.
2. Use `npm ci && npm run build` for Build Command and `npm run start` for Start Command.
3. Set the environment variables in the Render Dashboard (do not commit secrets).
4. Set Health Check Path to `/api/health`.
5. Deploy — Render will build and start the backend and serve `dist` files for the frontend as well.

Vercel project (frontend)
1. Create a new project in Vercel and connect the same repo.
2. Build Command: `npm run build` — Output Directory: `dist`.
3. Add project environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (set in Vercel UI under Project Settings → Environment Variables).
4. Deploy — Vercel will publish the frontend.

One-time DB setup (apply schema + seed)
- Recommended to run from a secure CI or your machine with secrets configured.
- Manual via GitHub Actions: use the provided workflow `.github/workflows/supabase-setup.yml` (run via the Actions UI -> Supabase Setup -> Run workflow) which uses the repository secrets:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

Local testing commands
- Install: `npm ci`
- Apply schema + seed: `npm run supabase:setup`
- Build: `npm run build`
- Start server: `PORT=3001 npm run start` (PowerShell: `$env:PORT=3001; npm run start`)

Security notes
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend or public logs.
- Demo convenience: auto-confirm login
  - The server previously included a convenience that auto-confirmed seeded users when sign-in failed due to "Email not confirmed". That behavior is now gated by the `ALLOW_DEMO_AUTO_CONFIRM` environment variable and is disabled by default.
  - Never set `ALLOW_DEMO_AUTO_CONFIRM` in production. Keep it only for local demos where you control the environment.

If you want, I can now:
- Create a `render` service on your Render account (I cannot do that from here but I can provide exact values to paste),
- Generate a `vercel.json` route that proxies `/api/*` to the Render URL (already added placeholder),
- Add a GitHub Actions workflow to build and deploy the frontend to Vercel automatically.

Which of those should I do next?