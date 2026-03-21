import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Track } from "./types.js";
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

function stemName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(isFinite(a.duration) ? Math.round(a.duration * 1000) : 0);
    a.onerror = () => resolve(0);
    a.src = url;
  });
}

async function filesToTracks(files: File[]): Promise<{ tracks: Track[]; urls: string[] }> {
  const urls: string[] = [];
  const tracks: Track[] = [];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    urls.push(url);
    const durationMs = await getAudioDuration(url);
    const title = stemName(file.name);
    tracks.push({ id: url, uri: url, title, durationMs });
  }
  return { tracks, urls };
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function App() {
  const [controller, setController] = useState<PlayerController | null>(null);
  const [state, setState] = useState<PlayerCoreState | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const engine = await resolveAudioEngine();
      const ctrl = new PlayerController(engine);
      setController(ctrl);
      unsub = ctrl.store.subscribe((s: PlayerCoreState) => setState({ ...s }));
      setState({ ...ctrl.store.getState() });
    })();
    return () => { unsub?.(); };
  }, []);

  function revokePreviousUrls() {
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];
  }

  async function loadFiles(files: File[], append = false) {
    if (!controller || files.length === 0) return;
    const audioFiles = files.filter((f) => f.type.startsWith("audio/") || /\.(mp3|flac|wav|ogg|aac|m4a|opus|weba)$/i.test(f.name));
    if (audioFiles.length === 0) return;
    if (!append) revokePreviousUrls();
    const { tracks, urls } = await filesToTracks(audioFiles);
    blobUrlsRef.current.push(...urls);
    if (append) {
      const current = controller.store.getState().tracklist;
      controller.load([...current, ...tracks]);
    } else {
      controller.load(tracks);
    }
  }

  function openFilePicker(append = false) {
    const input = fileInputRef.current;
    if (!input) return;
    input.dataset.append = append ? "1" : "0";
    input.value = "";
    input.click();
  }

  async function onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const append = input.dataset.append === "1";
    const files = Array.from(input.files ?? []);
    await loadFiles(files, append);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    await loadFiles(files, false);
  }

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

            <div
              class={`queue-panel ${dragging ? "drag-over" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div class="queue-header">
                <span class="queue-title">
                  Lista de reproducción
                  {state!.tracklist.length > 0 && (
                    <span class="queue-count">{state!.tracklist.length}</span>
                  )}
                </span>
                <div class="queue-actions">
                  <button
                    class="queue-btn"
                    onClick={() => openFilePicker(true)}
                    title="Añadir archivos a la lista"
                    disabled={state!.tracklist.length === 0}
                  >
                    <PlusIcon />
                    Añadir
                  </button>
                  <button
                    class="queue-btn primary"
                    onClick={() => openFilePicker(false)}
                    title="Abrir archivos de audio"
                  >
                    <FolderIcon />
                    Abrir archivos
                  </button>
                </div>
              </div>

              {dragging ? (
                <div class="drop-zone">
                  <div class="drop-zone-inner">
                    <FolderIcon />
                    <span>Suelta los archivos aquí</span>
                  </div>
                </div>
              ) : state!.tracklist.length === 0 ? (
                <div class="empty-state" onClick={() => openFilePicker(false)}>
                  <div class="empty-icon">
                    <FolderIcon />
                  </div>
                  <p class="empty-title">Sin pistas cargadas</p>
                  <p class="empty-sub">Haz clic aquí o arrastra archivos de audio</p>
                  <p class="empty-formats">MP3 · FLAC · WAV · OGG · AAC · M4A</p>
                </div>
              ) : (
                <TrackList
                  state={state!}
                  onPlay={(i) => controller!.playIndex(i)}
                />
              )}
            </div>
          </>
        ) : (
          <div class="loading">
            <div class="loading-spinner" />
            <span>Iniciando motor de audio…</span>
          </div>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.flac,.wav,.ogg,.aac,.m4a,.opus"
        multiple
        style="display:none"
        onChange={onFileInputChange}
      />
    </div>
  );
}

render(<App />, document.getElementById("app")!);
