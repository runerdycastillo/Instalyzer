$workspaceRoot = Split-Path -Parent $PSScriptRoot
$nextPath = Join-Path $workspaceRoot "instalyzer-next"
$staticPath = Join-Path $workspaceRoot "instalyzer-static"
$nextExecutable = Join-Path $nextPath "node_modules\\.bin\\next.cmd"
$staticServerScript = Join-Path $workspaceRoot "scripts\\serve-static.js"

if (-not (Test-Path $nextPath)) {
  throw "Could not find instalyzer-next at $nextPath"
}

if (-not (Test-Path $staticPath)) {
  throw "Could not find instalyzer-static at $staticPath"
}

if (-not (Test-Path $nextExecutable)) {
  throw "Could not find Next executable at $nextExecutable"
}

if (-not (Test-Path $staticServerScript)) {
  throw "Could not find static server script at $staticServerScript"
}

Start-Process -FilePath $nextExecutable -WorkingDirectory $nextPath -ArgumentList @(
  "dev",
  "-p",
  "3000"
)

Start-Process -FilePath "node.exe" -WorkingDirectory $workspaceRoot -ArgumentList @(
  $staticServerScript,
  $staticPath,
  "5500"
)

Write-Host ""
Write-Host "Instalyzer startup launched."
Write-Host "Next app:   http://localhost:3000"
Write-Host "Static app: http://localhost:5500"
