Create Render service (local)

This repository includes helper scripts to create the Render Web Service for the backend programmatically.

PowerShell (Windows):

1. Open PowerShell and set your Render API key as an environment variable:

   ```powershell
   $env:RENDER_API_KEY = 'rnd_...'
   ```

2. Run the script:

   ```powershell
   ./scripts/create-render-service.ps1
   ```

Bash (macOS / Linux / WSL):

1. Set your Render API key in shell:

   ```bash
   export RENDER_API_KEY='rnd_...'
   ```

2. Run the script:

   ```bash
   ./scripts/create-render-service.sh
   ```

Notes and next steps:
- The script calls Render's REST API to create a minimal Web Service using this repo and branch `master`.
- The script does not set environment secrets on Render (you should add them in the Render UI or via the Render dashboard/API after creation):
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (secret)
  - SUPABASE_DB_URL
  - GEMINI_API_KEY (optional)
- If you shared your API key in chat, consider rotating it in Render Dashboard for security.
- If the API call fails, copy the full error and paste it here and I will help diagnose.
