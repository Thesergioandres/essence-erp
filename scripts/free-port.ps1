param(
  [Parameter(Mandatory = $false)]
  [int]$Port = 5000
)

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $listeners) {
  Write-Output "[free-port] Port $Port is already free"
  exit 0
}

$processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($processId in $processIds) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Output "[free-port] Stopped PID $processId on port $Port"
  } catch {
    Write-Warning "[free-port] Could not stop PID $processId on port ${Port}: $($_.Exception.Message)"
  }
}

exit 0
