# Changelog

Todos los cambios notables en NEURA Desktop se documentan en este archivo.

## [1.0] - 2026-03-21

### ✨ Características

**Audio & Reproducción**
- Motor de audio dual: Rust nativo (Rodio/CPAL/Symphonia) + Web Audio fallback
- Soporte para MP3, FLAC, WAV, OGG, AAC, M4A, OPUS
- Tres modos de reproducción: FOCUS (repetir), CHILL (aleatorio), ACTIVE (siguiente)
- Control de volumen e indicador de posición en tiempo real

**Interfaz de Usuario**
- Diseño moderno dark mode con glassmorphism
- Visualizador de barras animadas en tiempo real
- Barra de progreso interactiva con seek por click
- Lista de reproducción editable y scrollable
- Componentes responsivos para escritorio

**Gestión de Archivos**
- Carga archivos locales: click, drag-and-drop, explorador del sistema
- Detección automática de duración desde metadatos
- URLs blob para memoria eficiente
- Limpieza automática de memoria al cambiar listas

**Atajos de Teclado**
- Space/K: Play/Pause
- ←/J: Pista anterior
- →/L: Pista siguiente
- ↑/↓: Ajustar volumen

**Build & Deploy**
- GitHub Actions para builds automáticos (Windows/macOS/Linux)
- Generación de instaladores (.msi, .dmg, .AppImage)
- Tags semánticos para versionado (ej: 1.0, 1.5)

### 🏗️ Arquitectura

- **Frontend**: Preact 10 + Vite 5 + TypeScript
- **Backend**: Tauri v2 + Rust
- **Audio**: Rodio + Symphonia + CPAL
- **Estado**: Observable store con reducer pattern

### 📦 Requisitos Mínimos

- Node.js 20+
- Rust 1.70+
- Windows 10+, macOS 10.13+, o Linux (GTK 3.0+)

### 🎯 Casos de Uso

- Reproductor de música local de alto rendimiento
- Gestor de listas de reproducción personalizadas
- Herramienta de concentración con modo FOCUS
- Plataforma extensible para plugins de audio

### 📝 Notas

- Primera versión estable y lista para producción
- Performance optimizado para listas de miles de pistas
- Interfaz intuitiva sin curva de aprendizaje
- Código de calidad empresarial con TypeScript

---

## Formato

Las actualizaciones futuras seguirán este formato:
- **Added** para nuevas características
- **Changed** para cambios en funcionalidad existente
- **Deprecated** para funcionalidad pronto a eliminar
- **Removed** para características eliminadas
- **Fixed** para correcciones de bugs
- **Security** para vulnerabilidades
