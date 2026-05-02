$workspaceRoot = Split-Path -Parent $PSScriptRoot
$nextPath = Join-Path $workspaceRoot "instalyzer-next"
$nextExecutable = Join-Path $nextPath "node_modules\\.bin\\next.cmd"

if (-not (Test-Path $nextPath)) {
  throw "Could not find instalyzer-next at $nextPath"
}

if (-not (Test-Path $nextExecutable)) {
  throw "Could not find Next executable at $nextExecutable"
}

Start-Process -FilePath $nextExecutable -WorkingDirectory $nextPath -ArgumentList @(
  "dev",
  "-p",
  "3000"
)

Write-Host ""
Write-Host "Instalyzer startup launched."
Write-Host "Next app: http://localhost:3000"
