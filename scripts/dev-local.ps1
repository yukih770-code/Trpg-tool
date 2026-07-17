[CmdletBinding()]
param(
  [ValidateSet('Start', 'Doctor', 'Stop', 'Backend', 'Frontend')]
  [string]$Mode = 'Start'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EnvFile = Join-Path $ProjectRoot '.env'

function Write-LocalStatus([string]$Message) {
  Write-Host "[dev:local] $Message"
}

function Import-ProjectEnv {
  if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw 'Missing .env. Copy .env.example to .env and configure local development before starting.'
  }

  Get-Content -LiteralPath $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $name, $value = $line.Split('=', 2)
      $name = $name.Trim()
      $value = $value.Trim().Trim('"').Trim("'")
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

function Assert-RequiredLocalEnv {
  $required = @(
    'DATABASE_URL',
    'VITE_API_BASE_URL',
    'VITE_DEV_VIEWER_USER_ID',
    'POSTGRES_USER_DEV_API_ENABLED'
  )
  $missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, 'Process') })
  if ($missing.Count -gt 0) {
    throw "Missing required local environment variables: $($missing -join ', ')."
  }
  if ([Environment]::GetEnvironmentVariable('POSTGRES_USER_DEV_API_ENABLED', 'Process') -ne 'true') {
    throw 'POSTGRES_USER_DEV_API_ENABLED must be true for the local development runner.'
  }
  if ([Environment]::GetEnvironmentVariable('VITE_API_BASE_URL', 'Process').TrimEnd('/') -ne 'http://localhost:8787') {
    throw 'VITE_API_BASE_URL must point to the local backend for dev:local.'
  }
}

function Get-LocalPortProcess([int]$Port) {
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  $processId = $connection.OwningProcess
  if (-not $processId) {
    $line = netstat.exe -ano | Select-String -Pattern "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$" |
      Select-Object -First 1
    if (-not $line -or $line.Line -notmatch 'LISTENING\s+(\d+)\s*$') { return $null }
    $processId = [int]$Matches[1]
  }

  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  return [pscustomobject]@{
    Id = $processId
    Name = $process.ProcessName
    CommandLine = [string]$processInfo.CommandLine
  }
}

function Test-SafeLocalService($PortProcess, [ValidateSet('backend', 'frontend')][string]$Kind) {
  if (-not $PortProcess -or $PortProcess.Name -notmatch '^node(?:\.exe)?$') { return $false }
  $commandLine = $PortProcess.CommandLine.ToLowerInvariant()
  if ($Kind -eq 'backend') {
    return $commandLine -match 'room-server\.(ts|js)'
  }
  return $commandLine -match 'vite' -and $commandLine -match '(--port\s+3000|--port=3000)'
}

function Stop-SafeLocalService([int]$Port, [ValidateSet('backend', 'frontend')][string]$Kind) {
  $portProcess = Get-LocalPortProcess $Port
  if (-not $portProcess) {
    Write-LocalStatus "Port $Port is available."
    return
  }
  if (-not (Test-SafeLocalService $portProcess $Kind)) {
    throw "Port $Port is in use by process $($portProcess.Id) ($($portProcess.Name)). It does not match the known local $Kind service signature, so it was not stopped."
  }

  Stop-Process -Id $portProcess.Id -Force
  for ($attempt = 1; $attempt -le 10; $attempt++) {
    if (-not (Get-LocalPortProcess $Port)) {
      Write-LocalStatus "Stopped the stale local $Kind service on port $Port."
      return
    }
    Start-Sleep -Milliseconds 300
  }
  throw "The local $Kind service on port $Port did not stop cleanly."
}

function Assert-PortAvailable([int]$Port) {
  $portProcess = Get-LocalPortProcess $Port
  if ($portProcess) {
    throw "Port $Port is still in use by process $($portProcess.Id) ($($portProcess.Name))."
  }
}

function Start-LocalWindow([ValidateSet('Backend', 'Frontend')][string]$ChildMode) {
  $scriptPath = $PSCommandPath.Replace("'", "''")
  $rootPath = $ProjectRoot.Replace("'", "''")
  $command = "& { Set-Location -LiteralPath '$rootPath'; & '$scriptPath' -Mode $ChildMode }"
  Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command
  ) | Out-Null
}

function Wait-ForBackendHealth {
  for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        Write-LocalStatus 'Backend health check passed.'
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw 'Backend did not become healthy on http://localhost:8787/health. Check the backend terminal window.'
}

function Invoke-Doctor {
  Import-ProjectEnv
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  Write-LocalStatus "Node available: $([bool]$node)"
  Write-LocalStatus "npm available: $([bool]$npm)"
  Write-LocalStatus ".env available: $([bool](Test-Path -LiteralPath $EnvFile))"

  $required = @('DATABASE_URL', 'VITE_API_BASE_URL', 'VITE_DEV_VIEWER_USER_ID', 'POSTGRES_USER_DEV_API_ENABLED')
  foreach ($name in $required) {
    Write-LocalStatus "$name configured: $([bool][Environment]::GetEnvironmentVariable($name, 'Process'))"
  }
  Write-LocalStatus "Local runtime mode uses defaults: $(-not [Environment]::GetEnvironmentVariable('SERVER_DEPLOYMENT_ENVIRONMENT', 'Process') -and -not [Environment]::GetEnvironmentVariable('SERVER_RUNTIME_MODE', 'Process'))."

  foreach ($port in @(8787, 3000)) {
    $portProcess = Get-LocalPortProcess $port
    if ($portProcess) {
      $safeKind = if ($port -eq 8787) { 'backend' } else { 'frontend' }
      $managed = Test-SafeLocalService $portProcess $safeKind
      Write-LocalStatus "Port $port is listening (process $($portProcess.Id): $($portProcess.Name); managed signature: $managed)."
    } else {
      Write-LocalStatus "Port $port is available."
    }
  }

  try {
    $health = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 2
    Write-LocalStatus "Backend health: $($health.StatusCode)"
  } catch {
    Write-LocalStatus 'Backend health: unavailable.'
  }

  if ([Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')) {
    Write-LocalStatus 'PostgreSQL readiness: running read-only check.'
    Push-Location $ProjectRoot
    try {
      & npm run db:verify:e2e -- --strict
      if ($LASTEXITCODE -ne 0) { Write-Warning 'PostgreSQL readiness check did not pass.' }
    } finally {
      Pop-Location
    }
  }
}

function Invoke-Backend {
  Import-ProjectEnv
  Assert-RequiredLocalEnv
  Set-Location -LiteralPath $ProjectRoot
  & npm run server:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & npm run server:start
  exit $LASTEXITCODE
}

function Invoke-Frontend {
  Import-ProjectEnv
  Assert-RequiredLocalEnv
  Set-Location -LiteralPath $ProjectRoot
  & npm run dev
  exit $LASTEXITCODE
}

switch ($Mode) {
  'Doctor' { Invoke-Doctor; break }
  'Stop' {
    Stop-SafeLocalService 8787 'backend'
    Stop-SafeLocalService 3000 'frontend'
    break
  }
  'Backend' { Invoke-Backend; break }
  'Frontend' { Invoke-Frontend; break }
  'Start' {
    Import-ProjectEnv
    Assert-RequiredLocalEnv
    Stop-SafeLocalService 8787 'backend'
    Stop-SafeLocalService 3000 'frontend'
    Assert-PortAvailable 8787
    Assert-PortAvailable 3000
    Write-LocalStatus 'Starting backend in a separate PowerShell window.'
    Start-LocalWindow 'Backend'
    Wait-ForBackendHealth
    Write-LocalStatus 'Starting frontend in a separate PowerShell window.'
    Start-LocalWindow 'Frontend'
    Start-Sleep -Seconds 2
    Start-Process 'http://localhost:3000'
    Write-LocalStatus 'Local development is ready at http://localhost:3000.'
    break
  }
}
