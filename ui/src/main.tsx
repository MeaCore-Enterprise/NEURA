import { render } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { PlayerCoreState } from "./types.js";
import { PlayerController } from "../../dist/core/player/PlayerController.js";
import { resolveAudioEngine } from "../../dist/core/audio/resolveAudioEngine.js";
import { PlayerControls } from "./modules/PlayerControls.js";
import { StatusBar } from "./modules/StatusBar.js";
import { ModeSelector } from "./modules/ModeSelector.js";
import { Visualizer } from "./modules/Visualizer.js";

function App() {
  const [controller, setController] = useState<PlayerController | null>(null);
  const [state, setState] = useState<PlayerCoreState | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const engine = await resolveAudioEngine();
      const ctrl = new PlayerController(engine);
      setController(ctrl);
      unsub = ctrl.store.subscribe((s: PlayerCoreState) => setState({ ...s }));
      ctrl.load([
        { id: "1", uri: "app://assets/a.mp3", title: "A", durationMs: 180000 },
        { id: "2", uri: "app://assets/b.mp3", title: "B", durationMs: 200000 },
      ]);
    })();
    return () => { unsub && unsub(); };
  }, []);

  const ready = controller && state;
  return (
    <div class="neura-shell">
      <div class="neura-header">NEURA</div>
      <div class="neura-body">
        {ready ? (
          <>
            <Visualizer positionMs={state!.positionMs} status={state!.status} />
            <StatusBar state={state!} />
            <PlayerControls controller={controller!} state={state!} />
            <ModeSelector controller={controller!} state={state!} />
          </>
        ) : (
          <div class="loading">Inicializando…</div>
        )}
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
