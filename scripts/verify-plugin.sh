#!/usr/bin/env bash
set -euo pipefail

cmd_exists() { command -v "$1" >/dev/null 2>&1; }
cmd_exists cargo || { echo "ERROR: cargo no encontrado"; exit 1; }

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
TAURI_DIR="$REPO_DIR/src-tauri"
PLUGIN_DIR="$REPO_DIR/tauri-plugin-neura-audio"

[ -d "$TAURI_DIR" ] || { echo "ERROR: src-tauri no existe"; exit 1; }
[ -d "$PLUGIN_DIR" ] || { echo "ERROR: tauri-plugin-neura-audio no existe"; exit 1; }

grep -E '\.plugin\(tauri_plugin_neura_audio::init\(\)\)' "$TAURI_DIR/src/main.rs" >/dev/null || { echo "ERROR: main.rs no registra el plugin"; exit 1; }
grep -E 'tauri-plugin-neura-audio' "$TAURI_DIR/Cargo.toml" >/dev/null || { echo "ERROR: Cargo.toml de app no declara el plugin"; exit 1; }
[ -f "$PLUGIN_DIR/Cargo.toml" ] || { echo "ERROR: Cargo.toml del plugin no encontrado"; exit 1; }

(cd "$PLUGIN_DIR" && cargo check --quiet)
(cd "$TAURI_DIR" && cargo check --quiet)

echo "OK: Plugin nativo verificado"
