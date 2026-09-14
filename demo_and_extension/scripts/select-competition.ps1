param(
  [switch]$Copy
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$competitionDirectory = Join-Path $root "data\competitions"

Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = "Select an OpenGuessr competition definition"
$dialog.InitialDirectory = $competitionDirectory
$dialog.Filter = "Competition JSON (*.json)|*.json"
$dialog.Multiselect = $false
$dialog.CheckFileExists = $true

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host "No competition selected."
  exit 0
}

Push-Location $root
try {
  $nodeArguments = @("scripts/export-competition.mjs", $dialog.FileName)
  if ($Copy) {
    $nodeArguments += "--copy"
  }

  & node @nodeArguments
  if ($LASTEXITCODE -ne 0) {
    throw "Competition export failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
