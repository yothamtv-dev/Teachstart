# EduPlan AI — deploy to Vercel (production)
# Prerequisites: `vercel login` or $env:VERCEL_TOKEN set

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$envFile = Join-Path $Root ".env.local"
if (Test-Path $envFile) {
  Write-Host "Syncing environment variables to Vercel (production)..." -ForegroundColor Cyan
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Write-Host "  $name"
    $value | vercel env add $name production --force 2>&1 | Out-Null
  }
}

Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
vercel deploy --prod --yes
exit $LASTEXITCODE
