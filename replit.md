# NEURA Desktop

Reproductor de audio de escritorio multiplataforma. Construido con Preact + Vite en el frontend y Tauri v2 + Rust en el backend nativo.

## Arquitectura

- **`ui/`** — Frontend Preact (Vite dev server, puerto 5000)
- **`core/`** — Lógica de audio en TypeScript (abstracción de motores, estado del reproductor)
- **`dist/`** — Salida compilada de `tsc` (core) y `vite build` (UI)
- **`src-tauri/`** — Backend Tauri v2 en Rust
- **`tauri-plugin-neura-audio/`** — Plugin Rust para audio nativo (Rodio/CPAL/Symphonia)

## Componentes UI

| Archivo | Descripción |
|---------|-------------|
| `ui/src/main.tsx` | App principal, atajos de teclado, carga de tracks |
| `ui/src/modules/TrackInfo.tsx` | Artwork + título + artista con animación |
| `ui/src/modules/Visualizer.tsx` | Barras animadas CSS que responden al estado |
| `ui/src/modules/ProgressBar.tsx` | Barra de progreso interactiva con seek y tiempo |
| `ui/src/modules/PlayerControls.tsx` | Botones con iconos SVG (anterior/play-pause/siguiente) |
| `ui/src/modules/VolumeControl.tsx` | Slider de volumen con icono mute |
| `ui/src/modules/ModeSelector.tsx` | Selector Focus/Chill/Active con descripciones |
| `ui/src/modules/TrackList.tsx` | Lista de reproducción clickeable con artista y duración |

## Motor de Audio (resolución automática)

1. **NativeAudioEngine** — Cuando corre dentro de Tauri con el plugin neura-audio
2. **TauriAudioEngine** (Web Audio HTML5) — Fallback en navegador
3. **MockAudioEngine** — Último recurso

## Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Space` / `K` | Play / Pause |
| `→` / `L` | Pista siguiente |
| `←` / `J` | Pista anterior |
| `↑` | Subir volumen +5% |
| `↓` | Bajar volumen -5% |

## Carga de archivos locales

- **Botón "Abrir archivos"**: selector del sistema para cargar MP3, FLAC, WAV, OGG, AAC, M4A
- **Arrastrar y soltar**: arrastra archivos directamente sobre el panel de lista
- **Clic en el área vacía**: haz clic para abrir el selector si no hay pistas cargadas
- **Botón "+ Añadir"**: una vez que tienes pistas, agrega más sin reemplazar la lista

### Optimización de memoria
- Los archivos se almacenan como `blob://` URLs en el navegador (no se suben a ningún servidor)
- La duración se detecta automáticamente de los metadatos del archivo
- Al cargar una nueva lista, las URLs anteriores se liberan automáticamente
- Las URLs blob se limpian completamente al cerrar la pestaña o aplicación

## Desarrollo

```bash
npm run ui:dev       # Servidor Vite UI (puerto 5000)
npm run ui:build     # Compilar UI a dist/
npm run build        # Compilar core TypeScript (tsc)
```

## GitHub Actions — Release automático

El archivo `.github/workflows/release.yml` compila instaladores nativos para **Windows, macOS y Linux** automáticamente cuando se crea un tag con formato numérico:

```bash
git tag 1.0
git push origin 1.0
```

Esto genera:
- Windows: `.msi` y `.exe`
- macOS: `.dmg`
- Linux: `.AppImage` y `.deb`

Los artefactos se suben a un GitHub Release automáticamente.

## Despliegue Tauri

`tauri.conf.json` está configurado con:
- `beforeBuildCommand`: `npm run ui:build`
- `distDir`: `../dist`
- `devPath`: `http://localhost:5000`

## Package Manager

npm (Node.js 20)

## Dependencias clave

- preact ^10.20.2
- vite ^5.4.8
- @preact/preset-vite ^2.7.0
- typescript ^5.6.3
