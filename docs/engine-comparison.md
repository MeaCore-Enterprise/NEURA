# Comparativa Engines (WebView vs Nativo)

| Criterio | WebView (TauriAudioEngine) | Nativo (NativeAudioEngine) |
|---|---|---|
| Latencia | Media | Baja |
| Formatos | MP3/AAC (dependiente plataforma) | MP3/WAV/FLAC/OGG |
| Control | Básico (seek/volumen del navegador) | Preciso (seek, volumen, pausas) |
| Complejidad | Baja | Media/Alta |
| Consumo | Bajo/Medio | Optimizable |
| Extensibilidad | Limitada | Gapless y crossfade viables |
| Dependencias | Ninguna nativa | Plugin Tauri + Rust |

## Casos de uso

- WebView: prototipos, apps sencillas
- Nativo: producción, requisitos de precisión y formatos avanzados
