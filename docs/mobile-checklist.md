# Checklist Mobile

- Interfaz `AudioEngine` idéntica a Desktop
- React Native: `NativeModules` con bridge iOS/Android
- Comandos nativos: play, pause, stop, seek, setVolume
- Eventos nativos: started, position, ended, error
- Gestión de batería: limitar `position` a 15–30fps
- Manejo de suspensión: reanudar timers tras `AppState` active
- Formatos: usar librerías nativas (AVAudioPlayer, ExoPlayer)
- Permisos de audio y background
- Capacitor alternativa: `@capacitor-community/media` o plugin de audio
- Pruebas en dispositivos reales y emuladores
