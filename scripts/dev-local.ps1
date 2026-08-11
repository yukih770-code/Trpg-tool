[CmdletBinding()]
param(
  [ValidateSet('Start', 'Doctor', 'Stop', 'Backend', 'Frontend')]
  [string]$Mode = 'Start',
  [switch]$Lan,
  [switch]$PrivateAlpha
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EnvFile = Join-Path $ProjectRoot '.env'
$PostgresComposeFile = Join-Path $ProjectRoot 'docker-compose.postgres.yml'

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

function Configure-LocalAuthMode {
  if ($PrivateAlpha) {
    $requiredSecrets = @('PRIVATE_ALPHA_INVITE_CODE', 'PRIVATE_ALPHA_SESSION_SECRET')
    $missingSecrets = @($requiredSecrets | Where-Object { -not [Environment]::GetEnvironmentVariable($_, 'Process') })
    if ($missingSecrets.Count -gt 0) {
      throw "Private Alpha local mode requires: $($missingSecrets -join ', '). Add local-only values to .env."
    }
    [Environment]::SetEnvironmentVariable('PRIVATE_ALPHA_AUTH_ENABLED', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('VITE_PRIVATE_ALPHA_AUTH_ENABLED', 'true', 'Process')
    [Environment]::SetEnvironmentVariable('VITE_LOCAL_DEV_AUTH_ENABLED', 'false', 'Process')
    [Environment]::SetEnvironmentVariable('POSTGRES_USER_DEV_API_ENABLED', 'false', 'Process')
    Write-LocalStatus 'Authentication mode: Private Alpha sign-in (cloud-like local verification).'
    return
  }

  [Environment]::SetEnvironmentVariable('PRIVATE_ALPHA_AUTH_ENABLED', 'false', 'Process')
  [Environment]::SetEnvironmentVariable('VITE_PRIVATE_ALPHA_AUTH_ENABLED', 'false', 'Process')
  [Environment]::SetEnvironmentVariable('VITE_LOCAL_DEV_AUTH_ENABLED', 'true', 'Process')
  [Environment]::SetEnvironmentVariable('POSTGRES_USER_DEV_API_ENABLED', 'true', 'Process')
  Write-LocalStatus 'Authentication mode: local development identity.'
}

function Assert-RequiredLocalEnv {
  $required = @('DATABASE_URL', 'VITE_API_BASE_URL')
  if (-not $PrivateAlpha) {
    $required += @('VITE_DEV_VIEWER_USER_ID', 'POSTGRES_USER_DEV_API_ENABLED')
  }
  $missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, 'Process') })
  if ($missing.Count -gt 0) {
    throw "Missing required local environment variables: $($missing -join ', ')."
  }
  if (-not $PrivateAlpha -and [Environment]::GetEnvironmentVariable('POSTGRES_USER_DEV_API_ENABLED', 'Process') -ne 'true') {
    throw 'POSTGRES_USER_DEV_API_ENABLED must be true for the local development runner.'
  }
  if ([Environment]::GetEnvironmentVariable('VITE_API_BASE_URL', 'Process').TrimEnd('/') -ne 'http://localhost:8787') {
    throw 'VITE_API_BASE_URL must point to the local backend for dev:local.'
  }

  try {
    $databaseUri = [Uri][Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
  } catch {
    throw 'DATABASE_URL is not a valid PostgreSQL connection URL.'
  }
  if ($databaseUri.Host -notin @('localhost', '127.0.0.1', '::1')) {
    throw 'dev:local only applies migrations to a loopback PostgreSQL target. Use a localhost DATABASE_URL.'
  }
}

function Ensure-ProjectDockerDatabase {
  $databaseUri = [Uri][Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
  $databaseName = $databaseUri.AbsolutePath.Trim('/')
  $usesProjectContainer = $databaseUri.Port -eq 55432 -and $databaseName -eq 'trpg_platform_dev'
  if (-not $usesProjectContainer) { return }

  if (-not (Test-Path -LiteralPath $PostgresComposeFile)) {
    throw 'The project PostgreSQL compose file is missing.'
  }
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required for the configured localhost:55432 database, but the docker command is unavailable.'
  }

  & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path -LiteralPath $dockerDesktop)) {
      throw 'Docker Desktop is not running. Start it, then run npm run dev:local again.'
    }
    Write-LocalStatus 'Starting Docker Desktop for the project PostgreSQL container.'
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden | Out-Null
    $dockerReady = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
      Start-Sleep -Seconds 2
      & docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        break
      }
    }
    if (-not $dockerReady) {
      throw 'Docker Desktop did not become ready within 60 seconds.'
    }
  }

  Write-LocalStatus 'Ensuring the project PostgreSQL container is running.'
  & docker compose -f $PostgresComposeFile up -d
  if ($LASTEXITCODE -ne 0) { throw 'Unable to start the project PostgreSQL container.' }

  for ($attempt = 1; $attempt -le 30; $attempt++) {
    $health = & docker inspect --format '{{.State.Health.Status}}' trpg-platform-postgres-dev 2>$null
    if ($health -eq 'healthy') {
      Write-LocalStatus 'Project PostgreSQL container is healthy.'
      return
    }
    Start-Sleep -Seconds 1
  }
  throw 'Project PostgreSQL container did not become healthy within 30 seconds.'
}

function Ensure-LocalDatabaseReady {
  Ensure-ProjectDockerDatabase
  Push-Location $ProjectRoot
  try {
    Write-LocalStatus 'Applying pending local database migrations.'
    & npm run db:migrations:apply -- --apply
    if ($LASTEXITCODE -ne 0) { throw 'Local database migrations failed.' }
    Write-LocalStatus 'Verifying all local PostgreSQL schemas.'
    & npm run db:verify:e2e -- --strict
    if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL readiness verification failed.' }
  } finally {
    Pop-Location
  }
}

function Enable-LanAlphaForProcess {
  if (-not $Lan) { return }
  [Environment]::SetEnvironmentVariable('LAN_ALPHA_ENABLED', 'true', 'Process')
  Write-LocalStatus 'LAN Alpha is enabled for this process. Private IPv4 CORS origins are generated when no explicit LAN_ALLOWED_ORIGINS value is configured.'
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
  $lanArgument = if ($Lan) { ' -Lan' } else { '' }
  $privateAlphaArgument = if ($PrivateAlpha) { ' -PrivateAlpha' } else { '' }
  $command = "& { Set-Location -LiteralPath '$rootPath'; & '$scriptPath' -Mode $ChildMode$lanArgument$privateAlphaArgument }"
  Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command
  ) | Out-Null
}

function Wait-ForBackendHealth {
  for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 2
      $payload = $response.Content | ConvertFrom-Json
      $databaseReady = $payload.database.status -eq 'ok' -and $payload.database.worldServerSchema.status -eq 'ready'
      if ($response.StatusCode -eq 200 -and $databaseReady) {
        Write-LocalStatus 'Backend and World Server database health checks passed.'
        return
      }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw 'Backend HTTP started, but the World Server database did not become ready. Run npm run dev:local:doctor.'
}

function Invoke-Doctor {
  Import-ProjectEnv
  Configure-LocalAuthMode
  Enable-LanAlphaForProcess
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  Write-LocalStatus "Node available: $([bool]$node)"
  Write-LocalStatus "npm available: $([bool]$npm)"
  Write-LocalStatus ".env available: $([bool](Test-Path -LiteralPath $EnvFile))"

  $required = @('DATABASE_URL', 'VITE_API_BASE_URL')
  if ($PrivateAlpha) {
    $required += @('PRIVATE_ALPHA_INVITE_CODE', 'PRIVATE_ALPHA_SESSION_SECRET')
  } else {
    $required += @('VITE_DEV_VIEWER_USER_ID', 'POSTGRES_USER_DEV_API_ENABLED')
  }
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

  if ($Lan) {
    Write-LocalStatus 'LAN endpoint candidates and CORS status:'
    Push-Location $ProjectRoot
    try {
      & npm run lan:print-join
      if ($LASTEXITCODE -ne 0) { Write-Warning 'LAN endpoint diagnostics did not pass.' }
    } finally {
      Pop-Location
    }
    Write-LocalStatus 'LAN reminder: allow Node through Windows Firewall on private networks. VPN adapters can change the chosen private IPv4 address.'
  }
}

function Invoke-Backend {
  Import-ProjectEnv
  Configure-LocalAuthMode
  Enable-LanAlphaForProcess
  Assert-RequiredLocalEnv
  Set-Location -LiteralPath $ProjectRoot
  & npm run server:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & npm run server:start
  exit $LASTEXITCODE
}

function Invoke-Frontend {
  Import-ProjectEnv
  Configure-LocalAuthMode
  Enable-LanAlphaForProcess
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
    Configure-LocalAuthMode
    Enable-LanAlphaForProcess
    Assert-RequiredLocalEnv
    Ensure-LocalDatabaseReady
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
