# Integración completa Tauri v2 (Plugin Nativo)

## Requisitos

- Rust estable instalado y en PATH
- Toolchain para Windows/macOS/Linux según plataforma
- Node.js 18+
- Tauri v2

## Instalación

- Añadir el plugin nativo en `src-tauri/Cargo.toml` y registrar en `src-tauri/src/main.rs`
- Configurar `src-tauri/tauri.conf.json` con permisos mínimos

## Registro del plugin

- `src-tauri/src/main.rs` contiene el registro de `tauri_plugin_neura_audio::init()` y manejo de errores de arranque

## Frontend

- Resolver engine con `resolveAudioEngine()`
- Intercambiar automáticamente entre `NativeAudioEngine` y `TauriAudioEngine`
- Fallback a `MockAudioEngine` si el entorno no soporta audio

## Builds

- Debug: logs habilitados; probar comandos `load/play/pause/seek/stop`
- Release: validar tamaño y rendimiento; medir latencia y frecuencia de `position`
- Multiplataforma: verificar reproducción y rutas (assets y rutas absolutas)

## Troubleshooting

- TAURI_NOT_AVAILABLE: verificar `__TAURI__` y registro del plugin
- ERR_MODULE_NOT_FOUND: comprobar rutas y extensiones `.js` en imports TS
- Audio no suena: revisar permisos y path real del archivo (usar `app://assets/...` o ruta absoluta)
- `position` sin eventos: confirmar `configure_position_fps` y loop de emisión

## Decisión WebView vs Nativo

- Usar WebView para simplicidad; Nativo para producción y latencia baja

## Ejemplo

- `examples/native_adapter_usage.ts` muestra el flujo con `resolveAudioEngine()` y `PlayerController`
