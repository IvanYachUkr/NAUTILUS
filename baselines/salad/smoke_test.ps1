$ErrorActionPreference = "Stop"

Write-Host "============================================================"
Write-Host "SALAD FP32 TOOLCHAIN SMOKE TEST"
Write-Host "============================================================"

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Here

Write-Host "`n[1/3] Checking Python + CUDA + imports..."
python -c "import torch,numpy,pandas,PIL,torchvision,faiss,geopy; print('Python deps OK'); print('Torch:',torch.__version__); print('CUDA:',torch.cuda.is_available()); print('GPU:',torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NO CUDA GPU'); print('FAISS:',getattr(faiss,'__version__','available'))"
if ($LASTEXITCODE -ne 0) { throw "Dependency/CUDA check failed." }

Write-Host "`n[2/3] Building 32 reference embeddings..."
python .\build_salad_reference_embeddings.py `
  --device cuda `
  --batch-size 4 `
  --workers 1 `
  --shard-size 16 `
  --max-images 32 `
  --output .\_smoke\reference_embeddings
if ($LASTEXITCODE -ne 0) { throw "Reference embedding smoke test failed." }

Write-Host "`n[3/3] Embedding up to 3 OpenGuessr queries..."
python .\embed_openguessr_queries.py `
  --device cuda `
  --batch-size 3 `
  --max-queries 3 `
  --output .\_smoke\queries
if ($LASTEXITCODE -ne 0) { throw "Query embedding smoke test failed." }

Write-Host "`n============================================================"
Write-Host "SMOKE TEST PASSED"
Write-Host "FP32 reference and query embedding stages executed successfully."
Write-Host "============================================================"
