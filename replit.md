# NEURA Desktop

A cross-platform audio player UI built with Preact + Vite, backed by a Tauri v2 native desktop app.

## Architecture

- **`ui/`** — Preact frontend (Vite dev server, port 5000)
- **`core/`** — TypeScript audio logic (engine abstraction, player state/reducers)
- **`dist/`** — Compiled output from `tsc` (core) and `vite build` (UI)
- **`src-tauri/`** — Tauri v2 Rust backend entry point
- **`tauri-plugin-neura-audio/`** — Custom Rust plugin for native audio (Rodio/CPAL/Symphonia)

## Audio Engine Resolution

The `resolveAudioEngine()` function automatically picks:
1. **NativeAudioEngine** — when running inside Tauri with the neura-audio plugin
2. **TauriAudioEngine** (Web Audio) — browser fallback when no native plugin
3. **MockAudioEngine** — last resort when Web Audio is unavailable

## Development

```bash
npm run ui:dev       # Start Vite dev server for the UI (port 5000)
npm run ui:build     # Build the UI to dist/
npm run build        # Compile core TypeScript (tsc)
```

## Workflow

- **Start application**: `npm run ui:dev` — runs the Vite dev server on port 5000

## Deployment

Configured as a **static** deployment:
- Build: `npm run ui:build`
- Public dir: `dist/`

## Package Manager

npm (Node.js 20)

## Key Dependencies

- preact ^10.20.2
- vite ^5.4.8
- @preact/preset-vite ^2.7.0
- typescript ^5.6.3
