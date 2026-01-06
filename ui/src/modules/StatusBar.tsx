import type { PlayerCoreState } from "../types.js";

export function StatusBar({ state }: { state: PlayerCoreState }) {
  return (
    <div class="status">
      <div class="left">
        <span class={`chip ${state.status.toLowerCase()}`}>{state.status}</span>
        <span class="meta">Index: {state.currentIndex ?? "-"}</span>
        <span class="meta">Pos: {Math.floor(state.positionMs / 1000)}s</span>
        <span class="meta">Mode: {state.mode}</span>
      </div>
      <div class="right">
        {state.error ? <span class="error">{state.error.message}</span> : null}
      </div>
    </div>
  );
}
