#!/usr/bin/env bash
set -euo pipefail

cmd_exists() { command -v "$1" >/dev/null 2>&1; }

for c in cargo rustc node npm; do
  if ! cmd_exists "$c"; then echo "ERROR: comando requerido no encontrado: $c"; exit 1; fi
done

if ! cargo tauri -V >/dev/null 2>&1; then echo "ERROR: Tauri CLI no disponible. Instalar: cargo install tauri-cli --version ^2"; exit 1; fi

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
TAURI_DIR="$REPO_DIR/src-tauri"
[ -d "$TAURI_DIR" ] || { echo "ERROR: src-tauri no existe"; exit 1; }

MAIN_RS="$TAURI_DIR/src/main.rs"
grep -E '\.plugin\(tauri_plugin_neura_audio::init\(\)\)' "$MAIN_RS" >/dev/null || { echo "ERROR: Plugin no registrado en main.rs"; exit 1; }

(cd "$REPO_DIR" && npm run build >/dev/null)
(cd "$TAURI_DIR" && cargo tauri dev)
