$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'dev-local.ps1') -LibraryOnly

$checks = [System.Collections.Generic.List[string]]::new()

function Assert-Check([string]$Name, [bool]$Condition) {
  if (-not $Condition) { throw "failed: $Name" }
  $checks.Add($Name)
}

Assert-Check 'local payload matches local expectation' (Test-ReportedLocalAuthMode ([pscustomobject]@{ authMode = 'localDev' }) 'localDev')
Assert-Check 'private payload matches private expectation' (Test-ReportedLocalAuthMode ([pscustomobject]@{ authMode = 'privateAlpha' }) 'privateAlpha')
Assert-Check 'local payload rejects private expectation' (-not (Test-ReportedLocalAuthMode ([pscustomobject]@{ authMode = 'localDev' }) 'privateAlpha'))
Assert-Check 'private payload rejects local expectation' (-not (Test-ReportedLocalAuthMode ([pscustomobject]@{ authMode = 'privateAlpha' }) 'localDev'))
Assert-Check 'missing auth mode is not accepted' (-not (Test-ReportedLocalAuthMode ([pscustomobject]@{ service = 'legacy' }) 'localDev'))
Assert-Check 'missing payload is not accepted' (-not (Test-ReportedLocalAuthMode $null 'localDev'))

[pscustomobject]@{
  total = $checks.Count
  passed = $checks.Count
  failed = 0
  checks = $checks
} | ConvertTo-Json -Depth 4
