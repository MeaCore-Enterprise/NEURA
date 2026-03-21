import type { PlayerCoreState } from "../types.js";

function MusicNoteIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function TrackInfo({ state }: { state: PlayerCoreState }) {
  const track = state.currentIndex !== null ? state.tracklist[state.currentIndex] : null;
  const isPlaying = state.status === "PLAYING";

  return (
    <div class="track-info">
      <div class={`artwork ${isPlaying ? "playing" : ""}`}>
        <MusicNoteIcon />
        <div class="artwork-ring" />
      </div>
      <div class="track-meta">
        <div class="track-title">{track ? track.title : "Sin canción"}</div>
        <div class="track-artist">{track?.artist ?? "Artista desconocido"}</div>
      </div>
    </div>
  );
}
