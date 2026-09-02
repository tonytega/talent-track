#!/usr/bin/env bash
# Creates a Render Web Service using the Render REST API
# Usage:
#   export RENDER_API_KEY="rnd_xxx"
#   ./scripts/create-render-service.sh

set -euo pipefail

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "RENDER_API_KEY environment variable is not set. Export your Render API key and re-run." >&2
  exit 1
fi

API_URL="https://api.render.com/v1/services"
read -r -d '' PAYLOAD <<'JSON'
{
  "name":"talent-track-backend",
  "repo":"https://github.com/tonytega/talent-track.git",
  "branch":"master",
  "autoDeploy": true,
  "env":"node",
  "plan":"starter",
  "type":"web",
  "region":"oregon",
  "buildCommand":"npm ci && npm run build",
  "startCommand":"npm run start",
  "healthCheckPath":"/api/health"
}
JSON

curl -sS -X POST "$API_URL" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

