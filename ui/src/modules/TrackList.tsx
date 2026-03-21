import type { PlayerCoreState } from "../types.js";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

export function TrackList({
  state,
  onPlay,
}: {
  state: PlayerCoreState;
  onPlay: (index: number) => void;
}) {
  if (state.tracklist.length === 0) {
    return <div class="tracklist-empty">Sin pistas cargadas</div>;
  }

  return (
    <div class="tracklist">
      <div class="tracklist-header">
        <span class="tl-num">#</span>
        <span class="tl-title">Título</span>
        <span class="tl-artist">Artista</span>
        <span class="tl-dur">Duración</span>
      </div>
      <div class="tracklist-body">
        {state.tracklist.map((track, i) => {
          const isCurrent = state.currentIndex === i;
          const isPlaying = isCurrent && state.status === "PLAYING";
          return (
            <div
              key={track.id}
              class={`track-row ${isCurrent ? "current" : ""}`}
              onClick={() => onPlay(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && onPlay(i)}
            >
              <span class="tl-num">
                {isPlaying ? <SpeakerIcon /> : isCurrent ? <span class="tl-idx accent">{i + 1}</span> : <span class="tl-idx">{i + 1}</span>}
                <span class="tl-play-icon"><PlayIcon /></span>
              </span>
              <span class="tl-title">{track.title}</span>
              <span class="tl-artist">{track.artist ?? "—"}</span>
              <span class="tl-dur">{fmt(track.durationMs)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
