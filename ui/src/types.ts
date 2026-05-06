// Re-exporta los tipos del core para uso dentro del UI.
// Así evitamos duplicar definiciones y garantizamos compatibilidad de tipos.
export type { PlayerState, ContextMode, Track } from "../../core/audio/AudioEngine.js";
export type { PlayerCoreState, ErrorInfo } from "../../core/player/types.js";
