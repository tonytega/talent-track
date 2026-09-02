# Creates a Render Web Service using the Render REST API
# Usage:
#   $env:RENDER_API_KEY = 'rnd_xxx'
#   ./scripts/create-render-service.ps1

if (-not $env:RENDER_API_KEY) {
  Write-Error "RENDER_API_KEY environment variable is not set. Export your Render API key and re-run."
  exit 1
}

$api = "https://api.render.com/v1/services"

$payload = @{
  name = "talent-track-backend"
  repo = "https://github.com/tonytega/talent-track.git"
  branch = "master"
  autoDeploy = $true
  env = "node"
  plan = "starter"
  type = "web"
  region = "oregon"
  buildCommand = "npm ci && npm run build"
  startCommand = "npm run start"
  healthCheckPath = "/api/health"
} | ConvertTo-Json -Depth 5

Write-Output "Creating Render service 'talent-track-backend'..."
try {
  $resp = Invoke-RestMethod -Uri $api -Method Post -Headers @{ Authorization = "Bearer $env:RENDER_API_KEY"; "Content-Type" = "application/json" } -Body $payload -ErrorAction Stop
  Write-Output "Render API response:"
  $resp | ConvertTo-Json -Depth 5
} catch {
  Write-Error "Render API call failed: $_"
  exit 1
}
