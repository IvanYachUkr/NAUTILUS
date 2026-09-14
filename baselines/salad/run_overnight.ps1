$ErrorActionPreference = "Stop"

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Here

$LogDir = Join-Path $Here "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Log = Join-Path $LogDir "fp32_build_$Stamp.log"

function Run-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host "`n============================================================"
    Write-Host $Name
    Write-Host "============================================================"

    & $Command 2>&1 | Tee-Object -FilePath $Log -Append

    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE. See $Log"
    }
}

Run-Step "1/2 FP32 SMOKE TEST" {
    powershell -ExecutionPolicy Bypass -File .\smoke_test.ps1
}

Run-Step "2/2 FULL FLOAT32 SALAD REFERENCE EMBEDDINGS" {
    python .\build_salad_reference_embeddings.py `
      --device cuda `
      --batch-size 64 `
      --workers 1
}

Write-Host "`n============================================================"
Write-Host "FP32 REFERENCE BUILD COMPLETE"
Write-Host "Log: $Log"
Write-Host "============================================================"
