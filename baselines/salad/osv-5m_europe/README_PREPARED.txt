OSV-5M Europe subset
====================

Repository:
  osv5m/osv5m

Prepared splits:
  train, test

Important folders:
  metadata/europe.csv
      Combined European metadata.

  metadata/train_europe.csv
  metadata/test_europe.csv
      Per-split metadata.

  images/train/
  images/test/
      Europe-only extracted images.

  raw_metadata/
      Original OSV-5M CSV metadata downloaded from Hugging Face.

  ZIP staging directory:
      By default this is ../osv-5m_zips next to the preparation script.
      In --mode download ZIPs are retained there.
      In --mode extract or pipeline each ZIP is deleted after successful extraction.

  state/
      Resume information. Re-run the same command after interruption.

Suggested next step:
  Compute one SALAD descriptor per image and build a FAISS index. Keep the
  descriptor row order linked to metadata/europe.csv by OSV image ID.
