import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { PlayerCoreState } from "./types.js";
import { PlayerController } from "../../dist/core/player/PlayerController.js";
import { resolveAudioEngine } from "../../dist/core/audio/resolveAudioEngine.js";
import { PlayerControls } from "./modules/PlayerControls.js";
import { ModeSelector } from "./modules/ModeSelector.js";
import { Visualizer } from "./modules/Visualizer.js";
import { TrackInfo } from "./modules/TrackInfo.js";
import { ProgressBar } from "./modules/ProgressBar.js";
import { VolumeControl } from "./modules/VolumeControl.js";
import { TrackList } from "./modules/TrackList.js";

const DEMO_TRACKS = [
  { id: "1", uri: "app://assets/a.mp3", title: "Midnight Drive", artist: "Neon Highways", durationMs: 214000 },
  { id: "2", uri: "app://assets/b.mp3", title: "Blue Static", artist: "Cold Frequency", durationMs: 198000 },
  { id: "3", uri: "app://assets/c.mp3", title: "Subwave", artist: "Depth Protocol", durationMs: 242000 },
  { id: "4", uri: "app://assets/d.mp3", title: "Glass City", artist: "Neon Highways", durationMs: 175000 },
  { id: "5", uri: "app://assets/e.mp3", title: "Phantom Signal", artist: "Cold Frequency", durationMs: 231000 },
];

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
      ctrl.load(DEMO_TRACKS);
    })();
    return () => { unsub?.(); };
  }, []);

  useEffect(() => {
    if (!controller || !state) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        const s = controller!.store.getState();
        if (s.status === "PLAYING") controller!.pause();
        else if (s.status === "PAUSED") controller!.resume();
        else controller!.playIndex(s.currentIndex ?? 0);
      } else if (e.key === "ArrowRight" || e.key === "l") {
        e.preventDefault();
        controller!.next();
      } else if (e.key === "ArrowLeft" || e.key === "j") {
        e.preventDefault();
        controller!.previous();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const s = controller!.store.getState();
        controller!.setVolume(Math.min(1, s.volume + 0.05));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const s = controller!.store.getState();
        controller!.setVolume(Math.max(0, s.volume - 0.05));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controller, state]);

  const ready = controller && state;

  return (
    <div class="neura-shell">
      <header class="neura-header">
        <div class="header-logo">
          <span class="logo-mark">N</span>
          <span class="logo-text">NEURA</span>
        </div>
        <div class="header-hint">
          <kbd>Space</kbd> play · <kbd>← →</kbd> pista · <kbd>↑ ↓</kbd> volumen
        </div>
      </header>

      <main class="neura-body">
        {ready ? (
          <>
            <div class="player-panel">
              <TrackInfo state={state!} />
              <Visualizer status={state!.status} />
              <ProgressBar
                state={state!}
                onSeek={(ms) => controller!.seek(ms)}
              />
              <div class="controls-row">
                <PlayerControls controller={controller!} state={state!} />
                <VolumeControl
                  volume={state!.volume}
                  onVolumeChange={(v) => controller!.setVolume(v)}
                />
              </div>
              <ModeSelector controller={controller!} state={state!} />
            </div>

            <div class="queue-panel">
              <div class="queue-title">Lista de reproducción</div>
              <TrackList
                state={state!}
                onPlay={(i) => controller!.playIndex(i)}
              />
            </div>
          </>
        ) : (
          <div class="loading">
            <div class="loading-spinner" />
            <span>Iniciando motor de audio…</span>
          </div>
        )}
      </main>
    </div>
  );
}

render(<App />, document.getElementById("app")!);
