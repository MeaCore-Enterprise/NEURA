import type { PlayerCoreState } from "../types.js";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ProgressBar({
  state,
  onSeek,
}: {
  state: PlayerCoreState;
  onSeek: (ms: number) => void;
}) {
  const track = state.currentIndex !== null ? state.tracklist[state.currentIndex] : null;
  const duration = track?.durationMs ?? 0;
  const position = state.positionMs;
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  function handleClick(e: MouseEvent) {
    if (!track || duration === 0) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * duration));
  }

  return (
    <div class="progress-wrap">
      <span class="progress-time">{fmt(position)}</span>
      <div
        class={`progress-bar ${!track ? "disabled" : ""}`}
        onClick={handleClick}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={position}
      >
        <div class="progress-fill" style={`width: ${pct}%`} />
        <div class="progress-thumb" style={`left: ${pct}%`} />
      </div>
      <span class="progress-time">{fmt(duration)}</span>
    </div>
  );
}
