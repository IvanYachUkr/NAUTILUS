# SALAD + OSV-5M baseline

Europe-only visual place retrieval with SALAD descriptors and OSV-5M reference coordinates. Two search modes are supported:

- `fp32` — exact exhaustive search over every FP32 descriptor shard.
- `ivfflat` — reusable FAISS IVF-Flat index over the same uncompressed vectors.

The published practical result uses IVF-Flat with explicit `nprobe` and top-1 reference coordinates.

## Setup

Use a CUDA-enabled PyTorch environment, then install the additional packages:

```powershell
python -m pip install -r requirements_extra.txt
```

Large OSV-5M images, descriptors, indexes, downloads, and caches remain untracked.

## Full reproduction

These preparation stages are needed only when rebuilding the reference database:

```powershell
python .\prepare_osv5m_europe.py --mode download
python .\prepare_osv5m_europe.py --mode extract
python .\build_salad_reference_embeddings.py --device cuda --batch-size 64 --workers 1
python .\build_salad_ivfflat_index.py --nlist 1024 --train-sample 40000
```

The embedding build is resumable and stores float32 descriptors. IVF-Flat does not compress them: `index.faiss` and `index.ivfdata` are one logical index and must stay together. Building the index temporarily requires space for the FP32 master, temporary shards, and final on-disk lists.

## Evaluate

Recommended practical mode:

```powershell
python .\salad_batch_eval.py --dataset europe-easy --index ivfflat --nprobe 32 --top-k 5
python .\salad_batch_eval.py --dataset europe-medium --index ivfflat --nprobe 32 --top-k 5
python .\salad_batch_eval.py --dataset europe-hard --index ivfflat --nprobe 32 --top-k 5
```

Use `--index fp32` for exact exhaustive retrieval. Higher `nprobe` searches more coarse lists and approaches exact recall at higher runtime cost. Always record `nprobe` in reported experiments.

For the published GUI-reduced ablation, use the same evaluator with:

```text
--index ivfflat
--nprobe 64
--images-root ../../demo_and_extension/data/starting-images-no-gui-crop/no-location-gui
--output-dir results-no-location-gui
```

Run with `--help` for batching, cache, device, index, and output options.

## Local generated assets

```text
osv-5m_europe/                    extracted Europe reference data
osv-5m_europe/salad_embeddings_fp32/ FP32 descriptor master
osv-5m_europe/salad_ivfflat/      persistent IVF-Flat index
.torch_cache/                     model cache
```

Keep the extracted reference data and final descriptor/index artifacts needed by the evaluator. Download ZIPs and temporary IVF shard indexes may be removed after a verified build.

## Outputs

- `results/` — canonical-image CSVs, details, and summaries.
- `results-no-location-gui/` — paired GUI-reduced results.

The website importer reads the source CSV's top-1 prediction, `top1_error_km`, and `inference_seconds`. Reported inference excludes one-time model/index loading and image disk decoding.
