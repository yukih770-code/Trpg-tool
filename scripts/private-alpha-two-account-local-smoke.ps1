$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $workspaceRoot '.env'
$smokePort = if ($env:PRIVATE_ALPHA_LOCAL_SMOKE_PORT) { [int]$env:PRIVATE_ALPHA_LOCAL_SMOKE_PORT } else { 8791 }
$stdoutPath = Join-Path ([System.IO.Path]::GetTempPath()) ("trpg-alpha-smoke-{0}.out.log" -f [guid]::NewGuid())
$stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ("trpg-alpha-smoke-{0}.err.log" -f [guid]::NewGuid())
$distServerPath = Join-Path $workspaceRoot 'dist-server'
$createdBuildOutput = -not (Test-Path -LiteralPath $distServerPath)
$serverProcess = $null
$smokeExitCode = 1

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw 'Local .env is required for the isolated Private Alpha smoke.' }
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
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    try { $listener.Stop() } catch { }
  }
}

try {
  Import-DotEnv $envFile
  if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is required for the two-account protocol smoke.' }
  if (-not $env:PRIVATE_ALPHA_INVITE_CODE) { throw 'PRIVATE_ALPHA_INVITE_CODE is required for the two-account protocol smoke.' }
  if (-not $env:PRIVATE_ALPHA_SESSION_SECRET) { throw 'PRIVATE_ALPHA_SESSION_SECRET is required for the two-account protocol smoke.' }
  if (-not (Test-LocalPortAvailable $smokePort)) { throw "The isolated smoke port $smokePort is already in use." }

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

  Push-Location $workspaceRoot
  try {
    & npm.cmd run server:build
    if ($LASTEXITCODE -ne 0) { throw 'Server build failed before the isolated smoke.' }

    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $serverProcess = Start-Process -FilePath $nodePath `
      -ArgumentList @('dist-server/server/room-server.js') `
      -WorkingDirectory $workspaceRoot `
      -WindowStyle Hidden `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -PassThru

    $deadline = [DateTime]::UtcNow.AddSeconds(45)
    $ready = $false
    while ([DateTime]::UtcNow -lt $deadline) {
      if ($serverProcess.HasExited) { throw 'The isolated Private Alpha backend exited before becoming ready.' }
      try {
        $health = Invoke-RestMethod -Uri "http://localhost:$smokePort/health" -Method Get -TimeoutSec 3
        if ($health.ok -eq $true -and $health.authMode -eq 'privateAlpha') {
          $ready = $true
          break
        }
      } catch { }
      Start-Sleep -Milliseconds 300
    }
    if (-not $ready) { throw 'The isolated Private Alpha backend did not become ready within 45 seconds.' }

    & npm.cmd run alpha:verify:two-account-protocol -- --strict
    $smokeExitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
    $serverProcess.WaitForExit(5000) | Out-Null
  }
  foreach ($path in @($stdoutPath, $stderrPath)) {
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
  }
  if ($createdBuildOutput -and (Test-Path -LiteralPath $distServerPath)) {
    Remove-Item -LiteralPath $distServerPath -Recurse -Force
  }
}

exit $smokeExitCode
