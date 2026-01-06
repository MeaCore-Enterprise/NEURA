# NEURA Desktop — Build Tauri v2

## Requisitos por SO

- Windows
  - Node.js 18+
  - Rust estable (stable toolchain)
  - Visual Studio Build Tools (C++), WebView2 Runtime
  - `cargo install tauri-cli --version ^2`
- macOS
  - Node.js 18+
  - Xcode Command Line Tools
  - Rust estable
  - `cargo install tauri-cli --version ^2`
- Linux (Debian/Ubuntu)
  - Node.js 18+
  - Rust estable
  - Dependencias: `libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev` (y equivalentes en tu distro)
  - `cargo install tauri-cli --version ^2`

## Estructura del proyecto

- `core/` — motor y controlador TS
- `examples/` — ejemplos de uso
- `tauri-plugin-neura-audio/` — plugin nativo (Rust)
- `src-tauri/` — app Tauri v2 (backend y config)

## Comandos esenciales

- Preparación
  - `npm run build` — compila el core TS a `dist/`
- Desarrollo (Tauri)
  - `cd src-tauri && cargo tauri dev` — ejecuta la app en modo dev
- Build (Tauri)
  - `cd src-tauri && cargo tauri build` — genera binarios de distribución
  - Debug: `cargo tauri build --debug`
  - Release: `cargo tauri build` (por defecto)

## Binarios generados

- Windows: `src-tauri/target/release/bundle/` (NSIS/MSI/EXE)
- macOS: `src-tauri/target/release/bundle/macos/` (APP/DMG)
- Linux: `src-tauri/target/release/bundle/` (AppImage/deb/rpm)

## Verificación del plugin nativo

- Validar registro:
  - `src-tauri/src/main.rs` incluye `.plugin(tauri_plugin_neura_audio::init())`
  - `src-tauri/Cargo.toml` declara `tauri-plugin-neura-audio`
  - Existe `tauri-plugin-neura-audio/Cargo.toml`
- Verificar en runtime:
  - En WebView, `window.__TAURI__` está disponible
  - Invocar `plugin:neura_audio|configure_position_fps` desde `resolveAudioEngine()`
  - Recibir eventos `neura://audio/started` y `position`
- Script: `scripts/verify-plugin.(ps1|sh)` automatiza las comprobaciones

## Flags y modos

- Debug: logs ampliados, símbolos de depuración
- Release: optimizaciones activadas, binario distribuible

## Onboarding ≤10 minutos

1. Instala Node, Rust y Tauri CLI según tu SO
2. `npm run build`
3. `scripts/dev-desktop.(ps1|sh)` para arrancar en dev
4. `scripts/build-desktop.(ps1|sh)` para generar binarios
5. `scripts/verify-plugin.(ps1|sh)` para validar el plugin

## Notas

- `resolveAudioEngine()` selecciona automáticamente entre Nativo y WebView, con fallback a `MockAudioEngine`
- Usa URIs `app://assets/...` para empaquetar audio con la app
