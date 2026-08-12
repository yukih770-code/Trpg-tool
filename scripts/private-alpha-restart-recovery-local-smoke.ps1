$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $workspaceRoot '.env'
$smokePort = if ($env:PRIVATE_ALPHA_RESTART_SMOKE_PORT) { [int]$env:PRIVATE_ALPHA_RESTART_SMOKE_PORT } else { 8792 }
$statePath = Join-Path ([System.IO.Path]::GetTempPath()) ("trpg-alpha-restart-{0}.json" -f [guid]::NewGuid())
$distServerPath = Join-Path $workspaceRoot 'dist-server'
$createdBuildOutput = -not (Test-Path -LiteralPath $distServerPath)
$serverProcess = $null
$smokeExitCode = 1
$logPaths = [System.Collections.Generic.List[string]]::new()

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw 'Local .env is required for the restart recovery smoke.' }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) { continue }
    $parts = $trimmed.Split('=', 2)
    $name = $parts[0].Trim()
    if ($name -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { continue }
    $value = $parts[1].Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

function Test-LocalPortAvailable([int]$Port) {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try { $listener.Start(); return $true } catch { return $false } finally { try { $listener.Stop() } catch { } }
}

function Start-IsolatedBackend([string]$Stage) {
  $stdoutPath = Join-Path ([System.IO.Path]::GetTempPath()) ("trpg-alpha-restart-$Stage-{0}.out.log" -f [guid]::NewGuid())
  $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ("trpg-alpha-restart-$Stage-{0}.err.log" -f [guid]::NewGuid())
  $logPaths.Add($stdoutPath)
  $logPaths.Add($stderrPath)
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  $script:serverProcess = Start-Process -FilePath $nodePath `
    -ArgumentList @('dist-server/server/room-server.js') `
    -WorkingDirectory $workspaceRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru
  $deadline = [DateTime]::UtcNow.AddSeconds(45)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($script:serverProcess.HasExited) { throw "The isolated backend exited during $Stage startup." }
    try {
      $health = Invoke-RestMethod -Uri "http://localhost:$smokePort/health" -Method Get -TimeoutSec 3
      if ($health.ok -eq $true -and $health.authMode -eq 'privateAlpha') { return }
    } catch { }
    Start-Sleep -Milliseconds 300
  }
  throw "The isolated backend did not become ready during $Stage startup."
}

function Stop-IsolatedBackend {
  if ($script:serverProcess -and -not $script:serverProcess.HasExited) {
    Stop-Process -Id $script:serverProcess.Id -Force
    $script:serverProcess.WaitForExit(5000) | Out-Null
  }
  $script:serverProcess = $null
  $deadline = [DateTime]::UtcNow.AddSeconds(10)
  while ([DateTime]::UtcNow -lt $deadline) {
    if (Test-LocalPortAvailable $smokePort) { return }
    Start-Sleep -Milliseconds 200
  }
  throw 'The isolated backend port did not close after restart stop.'
}

try {
  Import-DotEnv $envFile
  if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is required for the restart recovery smoke.' }
  if (-not $env:PRIVATE_ALPHA_INVITE_CODE) { throw 'PRIVATE_ALPHA_INVITE_CODE is required for the restart recovery smoke.' }
  if (-not $env:PRIVATE_ALPHA_SESSION_SECRET) { throw 'PRIVATE_ALPHA_SESSION_SECRET is required for the restart recovery smoke.' }
  if (-not (Test-LocalPortAvailable $smokePort)) { throw "The isolated restart smoke port $smokePort is already in use." }

  $env:PORT = [string]$smokePort
  $env:ROOM_SERVER_ENV = 'localDev'
  $env:SERVER_RUNTIME_MODE = 'local'
  $env:APP_PUBLIC_HTTP_URL = "http://localhost:$smokePort"
  $env:APP_PUBLIC_WS_URL = "ws://localhost:$smokePort"
  $env:ROOM_ALLOWED_ORIGINS = 'http://localhost:3000'
  $env:PRIVATE_ALPHA_AUTH_ENABLED = 'true'
  $env:POSTGRES_USER_DEV_API_ENABLED = 'false'
  $env:E2E_API_BASE_URL = "http://localhost:$smokePort"
  $env:E2E_PRIVATE_ALPHA_ACCESS_CODE = $env:PRIVATE_ALPHA_INVITE_CODE
  $env:PRIVATE_ALPHA_RESTART_STATE_FILE = $statePath

  Push-Location $workspaceRoot
  try {
    & npm.cmd run server:build
    if ($LASTEXITCODE -ne 0) { throw 'Server build failed before the restart recovery smoke.' }
    Start-IsolatedBackend 'prepare'
    & npm.cmd run alpha:verify:restart-recovery -- --prepare --strict
    if ($LASTEXITCODE -ne 0) { throw 'Restart recovery prepare phase failed.' }
    Stop-IsolatedBackend
    Start-IsolatedBackend 'verify'
    & npm.cmd run alpha:verify:restart-recovery -- --verify --strict
    $smokeExitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  try { Stop-IsolatedBackend } catch { }
  if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath -Force }
  foreach ($path in $logPaths) { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force } }
  if ($createdBuildOutput -and (Test-Path -LiteralPath $distServerPath)) { Remove-Item -LiteralPath $distServerPath -Recurse -Force }
}

exit $smokeExitCode
