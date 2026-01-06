import type { PlayerCoreState } from "../types.js";
 

export function PlayerControls({ controller, state }: { controller: any; state: PlayerCoreState }) {
  const canPlay = state.status === "IDLE" || state.status === "STOPPED" || state.status === "PAUSED";
  const canPause = state.status === "PLAYING";

  async function onPlay() {
    const idx = state.currentIndex ?? 0;
    await controller.playIndex(idx);
  }
  async function onPause() { await controller.pause(); }
  async function onResume() { await controller.resume(); }
  async function onNext() { await controller.next(); }
  async function onPrev() { await controller.previous(); }

  return (
    <div class="controls">
      <button class="btn" onClick={onPrev} disabled={state.tracklist.length === 0}>◄</button>
      {canPause ? (
        <button class="btn primary" onClick={onPause}>Pause</button>
      ) : (
        <button class="btn primary" onClick={canPlay ? onPlay : onResume}>{canPlay ? "Play" : "Resume"}</button>
      )}
      <button class="btn" onClick={onNext} disabled={state.tracklist.length === 0}>►</button>
    </div>
  );
}
