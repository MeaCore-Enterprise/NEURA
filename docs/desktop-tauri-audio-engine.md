# Integración Desktop con Tauri

## Objetivo

- Usar `TauriAudioEngine` en el WebView para reproducir audio con precisión y eventos integrados en el core.

## Instalación

- Importa `TauriAudioEngine` desde `core/audio/TauriAudioEngine` y úsalo en el controlador del reproductor.

## Uso

```ts
import { TauriAudioEngine } from "../core/audio/TauriAudioEngine.js";
import { PlayerController } from "../core/player/PlayerController.js";

const engine = new TauriAudioEngine();
const player = new PlayerController(engine);

player.load([
  { id: "1", uri: "app://assets/track.mp3", title: "Track", durationMs: 180000 }
]);
await player.playIndex(0);
```

## Eventos

- `started`: inicio efectivo de reproducción
- `position`: posición periódica (hasta 60fps)
- `ended`: finalización de pista
- `error`: fallos con código y mensaje

## Formatos y rendimiento

-- WebView: MP3/AAC soportados por el sistema. Para FLAC/WAV/OGG y control nativo, usar plugin.
-- Ajusta `positionFps` si necesitas reducir carga: `new TauriAudioEngine({ positionFps: 30 })`.

## Plugins nativos (opcional)

- Implementa un plugin Tauri con `rodio/cpal` para formatos nativos y baja latencia.
- Expone comandos (`play`, `pause`, `seek`, `stop`, `set_volume`) y notificaciones (`started`, `position`, `ended`, `error`).
- En WebView, crea un adaptador que mapee estos comandos a la interfaz `AudioEngine`.

## Limpieza

- Llama `engine.destroy()` al cerrar la ventana o cambiar de vista.
