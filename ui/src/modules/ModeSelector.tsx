import type { PlayerCoreState } from "../types.js";
 

export function ModeSelector({ controller, state }: { controller: any; state: PlayerCoreState }) {
  async function setMode(mode: PlayerCoreState["mode"]) { controller.setMode(mode); }
  return (
    <div class="modes">
      {(["FOCUS", "CHILL", "ACTIVE"] as const).map((m) => (
        <button
          class={`btn ${state.mode === m ? "selected" : ""}`}
          onClick={() => setMode(m)}
        >{m}</button>
      ))}
    </div>
  );
}
