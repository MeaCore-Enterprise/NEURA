# NEURA Desktop 🎵

Un reproductor de audio multiplataforma profesional construido con **Tauri v2** y **Rust**, con interfaz moderna en **Preact + Vite**.

![NEURA](https://img.shields.io/badge/Status-Stable%201.0-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange)
![Rust](https://img.shields.io/badge/Rust-1.70+-red)

## Características

✨ **Motor de Audio Dual**
- Motor nativo Rust (Rodio/CPAL/Symphonia) para máximo rendimiento
- Fallback a Web Audio API para navegadores
- Soporte para MP3, FLAC, WAV, OGG, AAC, M4A, OPUS

🎛️ **Interfaz Moderna**
- Diseño dark mode elegante y responsivo
- Visualizador de barras animadas en tiempo real
- Control de volumen y progreso interactivo
- Modo nocturno con degradados y efectos glassmorphism

📂 **Gestión de Archivos**
- Carga archivos locales (click, drag-and-drop, o desde el explorador)
- Detección automática de duración desde metadatos
- Gestión inteligente de memoria (blob URLs)
- Colas de reproducción editables

🎮 **Modos de Reproducción**
- **FOCUS**: repite la pista actual (ideal para concentración)
- **CHILL**: orden aleatorio (viaje musical)
- **ACTIVE**: pista siguiente automática (modo playlist)

⌨️ **Atajos de Teclado**
- `Space` / `K` → Play/Pause
- `← / J` → Pista anterior
- `→ / L` → Pista siguiente
- `↑ / ↓` → Ajustar volumen

🚀 **Build Automático**
- GitHub Actions compila para Windows, macOS y Linux automáticamente
- Instaladores `.msi`, `.dmg`, `.AppImage` listos para distribuir
- Tags semánticos (ej: `1.0`, `1.5`, etc)

## Instalación

### Requisitos Previos

**Windows**
- Node.js 20+
- Rust 1.70+ (incluye Cargo)
- Visual Studio Build Tools (C++)
- WebView2 Runtime

**macOS**
- Node.js 20+
- Xcode Command Line Tools
- Rust 1.70+

**Linux (Ubuntu/Debian)**
- Node.js 20+
- Rust 1.70+
```bash
sudo apt-get install libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libasound2-dev
```

### Primeros Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/neura-desktop.git
cd neura-desktop

# 2. Instalar dependencias
npm install

# 3. Compilar core TypeScript
npm run build

# 4. Ejecutar en desarrollo
npm run ui:dev

# 5. Compilar para distribución
npm run ui:build
cd src-tauri && cargo tauri build
```

Los binarios estarán en:
- Windows: `src-tauri/target/release/bundle/msi/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/appimage/`

## Arquitectura

```
neura-desktop/
├── core/                          # Lógica de audio (TypeScript)
│   ├── audio/
│   │   ├── AudioEngine.ts        # Interfaz abstracta
│   │   ├── NativeAudioEngine.ts  # Tauri + Plugin Rust
│   │   ├── TauriAudioEngine.ts   # Web Audio fallback
│   │   └── resolveAudioEngine.ts # Selector automático
│   ├── player/
│   │   ├── PlayerController.ts   # Lógica de reproducción
│   │   ├── reducer.ts            # Estado (Redux-like)
│   │   ├── store.ts              # Observable store
│   │   └── types.ts              # TypeScript interfaces
│   └── utils/
│       └── EventEmitter.ts       # Event bus
│
├── ui/                            # Frontend (Preact + Vite)
│   ├── src/
│   │   ├── main.tsx              # App principal
│   │   ├── types.ts              # Tipos compartidos
│   │   └── modules/
│   │       ├── TrackInfo.tsx
│   │       ├── PlayerControls.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── VolumeControl.tsx
│   │       ├── Visualizer.tsx
│   │       ├── ModeSelector.tsx
│   │       └── TrackList.tsx
│   ├── styles.css                # Estilos globales
│   ├── index.html
│   └── vite.config.ts
│
├── src-tauri/                     # Backend Tauri v2
│   ├── src/main.rs               # Entry point
│   ├── Cargo.toml
│   └── tauri.conf.json           # Configuración
│
├── tauri-plugin-neura-audio/      # Plugin Rust nativo
│   ├── src/lib.rs
│   └── Cargo.toml
│
├── .github/workflows/
│   └── release.yml               # CI/CD automático
│
└── package.json                   # Dependencias Node
```

## Desarrollo

### Scripts disponibles

```bash
# Frontend
npm run ui:dev       # Dev server Vite (puerto 5000)
npm run ui:build     # Compilar UI a dist/

# Backend
npm run build        # Compilar TypeScript
npm run typecheck    # Validación de tipos
npm run desktop:dev  # Ejecutar desktop en dev (Windows/PowerShell)
npm run desktop:build # Compilar desktop (Windows/PowerShell)

# Verificación
npm run bench        # Benchmark del motor de audio
npm run test:engine  # Pruebas del motor
```

### Estructura de Componentes

| Componente | Responsabilidad |
|------------|-----------------|
| `TrackInfo` | Artwork + título + artista con animación |
| `Visualizer` | Barras animadas que responden al estado |
| `ProgressBar` | Barra de progreso interactiva con seek |
| `PlayerControls` | Botones play/pause/siguiente |
| `VolumeControl` | Slider de volumen + mute |
| `ModeSelector` | Focus/Chill/Active con descripciones |
| `TrackList` | Lista de reproducción clickeable |

## Lanzar Versiones

El proyecto usa GitHub Actions para automatizar los builds. Para lanzar una versión:

```bash
# Crear un tag semántico
git tag 1.0
git push origin 1.0
```

GitHub Actions automáticamente:
1. Compila para Windows, macOS y Linux
2. Genera instaladores (.msi, .dmg, .AppImage)
3. Crea un GitHub Release con los archivos adjuntos

## Optimización de Memoria

- Los archivos se almacenan como `blob://` URLs (sin servidor)
- La duración se detecta automáticamente
- Las URLs se liberan al cargar una nueva lista o cerrar la aplicación
- Soporte para listas grandes sin degradación de rendimiento

## Rendimiento

- **UI**: 60 FPS gracias a Preact + CSS transforms
- **Audio**: latencia mínima con motor Rust nativo
- **Memoria**: ~50 MB en reposo, escalable con pistas cargadas

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo licencia **MIT**. Ver `LICENSE` para más detalles.

## Roadmap

- [ ] Visualizador de espectro 3D
- [ ] Soporte para internet radio (streams)
- [ ] Sincronización multiplayer
- [ ] Pluguins de audio (ecualizador, reverb)
- [ ] Integración con servicios en la nube
- [ ] Editor de metadatos (ID3, etc)

## Soporte

- 📧 Email: support@neura.dev
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/neura-desktop/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/tu-usuario/neura-desktop/discussions)

## Créditos

Construido con:
- [Tauri v2](https://tauri.app) - Framework desktop
- [Preact](https://preactjs.com) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Rodio](https://github.com/RustAudio/rodio) - Audio engine
- [Symphonia](https://github.com/jnetterf/symphonia) - Audio decoder

---

**v1.0** - Marzo 2026 • [Cambios](CHANGELOG.md)
