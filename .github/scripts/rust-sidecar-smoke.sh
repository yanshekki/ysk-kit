#!/usr/bin/env bash
# Optional local smoke for the dest-only ICryptoPort crate.
# Skip 0 when rustc is missing. Do not add this to required GitHub Actions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CRATE="$ROOT/tooling/create-ysk-app/templates/rust-sidecar/crate"

if ! command -v rustc >/dev/null 2>&1 || ! command -v cargo >/dev/null 2>&1; then
  echo "skip: rustc/cargo not on PATH"
  exit 0
fi

cd "$CRATE"
cargo test
