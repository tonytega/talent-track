Render & Vercel deployment - copy/paste values

Render (backend)
- Create a new Web Service -> Connect your Git repo
- Use these values in the Render UI:
  - Repo: https://github.com/tonytega/talent-track.git
  - Branch: master
  - Build Command: npm ci && npm run build
  - Start Command: npm run start
  - Health Check Path: /api/health
- Environment variables (add as secrets in Render Service settings):
  - SUPABASE_URL = <your supabase url>
  - SUPABASE_ANON_KEY = <your supabase anon key>
  - SUPABASE_SERVICE_ROLE_KEY = <your supabase service role key>  # secret
  - SUPABASE_DB_URL = <your postgres connection string>          # for schema apply
  - GEMINI_API_KEY = <optional>
  - ALLOW_DEMO_AUTO_CONFIRM = false  # keep false in production

Vercel (frontend)
- Create a new Project -> Import repo, root = repo root
- Build Settings:
  - Framework: Vite
  - Build Command: npm run build
  - Output Directory: dist
- Environment Variables (project settings):
  - VITE_SUPABASE_URL = <your supabase url>
  - VITE_SUPABASE_ANON_KEY = <your supabase anon key>
- After Render is deployed, replace <RENDER_BACKEND_URL> in `vercel.json` with your Render service URL so `/api/*` proxy works.

GitHub Secrets (for Actions)
- Go to repo Settings → Secrets → Actions and add:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_DB_URL
  - VERCEL_TOKEN
  - VERCEL_ORG_ID
  - VERCEL_PROJECT_ID
  - (optional) GEMINI_API_KEY

Run the DB setup (one-time)
- Option A (GitHub Actions):
  - Add the secrets above, then go to Actions → Supabase Setup → Run workflow (manual dispatch).
- Option B (local):
  - Ensure env vars are set in your shell, then run:

  ```powershell
  npm ci
  $env:SUPABASE_URL='https://...'
  $env:SUPABASE_SERVICE_ROLE_KEY='...'
  $env:SUPABASE_DB_URL='postgres://...'
  npm run supabase:setup
  ```

Smoke-checks after deploy
- GET /api/health on Render service
- GET /api/debug/mode -> should show isSupabaseEnabled: true
- Login via frontend, create a job, apply to a public job

If you want, I can now:
- Prepare the exact Render UI copy-paste checklist (I already filled `render.yaml`).
- Update `vercel.json` with the Render URL once you provide it.
- Walk you through adding GitHub secrets interactively.
