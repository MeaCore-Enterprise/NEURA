#!/usr/bin/env bash
set -euo pipefail

DEBUG=${DEBUG:-0}

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
TAURI_DIR="$REPO_DIR/src-tauri"
[ -d "$TAURI_DIR" ] || { echo "ERROR: src-tauri no existe"; exit 1; }

if [ "$DEBUG" = "1" ]; then
  (cd "$TAURI_DIR" && cargo tauri build --debug)
else
  (cd "$TAURI_DIR" && cargo tauri build)
fi

echo "Binarios en: src-tauri/target/release/bundle/ (o debug)"
