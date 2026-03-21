import type { PlayerCoreState } from "../types.js";

function PrevIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function PlayerControls({
  controller,
  state,
}: {
  controller: any;
  state: PlayerCoreState;
}) {
  const canPlay =
    state.status === "IDLE" ||
    state.status === "STOPPED" ||
    state.status === "PAUSED";
  const isPlaying = state.status === "PLAYING";
  const noTracks = state.tracklist.length === 0;

  async function onPlayPause() {
    if (isPlaying) {
      await controller.pause();
    } else if (state.status === "PAUSED") {
      await controller.resume();
    } else {
      await controller.playIndex(state.currentIndex ?? 0);
    }
  }

  return (
    <div class="player-controls">
      <button
        class="ctrl-btn"
        onClick={() => controller.previous()}
        disabled={noTracks}
        title="Anterior"
      >
        <PrevIcon />
      </button>

      <button
        class="ctrl-btn play-btn"
        onClick={onPlayPause}
        disabled={noTracks}
        title={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        class="ctrl-btn"
        onClick={() => controller.next()}
        disabled={noTracks}
        title="Siguiente"
      >
        <NextIcon />
      </button>
    </div>
  );
}
