import type { AudioEngine, Track } from "../audio/AudioEngine.js";
import { createStore } from "./store.js";
import { initialState } from "./types.js";
import type { PlayerAction, PlayerCoreState } from "./types.js";
import { playerReducer } from "./reducer.js";

export class PlayerController {
  readonly store = createStore(initialState, playerReducer);
  private engine: AudioEngine;

  constructor(engine: AudioEngine) {
    this.engine = engine;
    this.engine.events.on("started", () => this.store.dispatch({ type: "ENGINE_STARTED" }));
    this.engine.events.on("paused", () => this.store.dispatch({ type: "ENGINE_PAUSED" }));
    this.engine.events.on("resumed", () => this.store.dispatch({ type: "ENGINE_RESUMED" }));
    this.engine.events.on("stopped", () => this.store.dispatch({ type: "ENGINE_STOPPED" }));
    this.engine.events.on("ended", () => this.onEnded());
    this.engine.events.on("position", (p) => this.store.dispatch({ type: "ENGINE_POSITION", positionMs: p.positionMs }));
    this.engine.events.on("error", (error) => this.store.dispatch({ type: "ENGINE_ERROR", error }));
  }

  load(tracks: Track[]) {
    this.store.dispatch({ type: "LOAD_TRACKLIST", tracks });
  }

  setMode(mode: PlayerCoreState["mode"]) {
    this.store.dispatch({ type: "SET_MODE", mode });
  }

  async playIndex(index: number) {
    const s = this.store.getState();
    if (index < 0 || index >= s.tracklist.length) return;
    this.store.dispatch({ type: "PLAY_REQUEST", index });
    const track = this.store.getState().tracklist[index];
    await this.engine.play(track);
  }

  async pause() {
    const s = this.store.getState();
    if (s.status !== "PLAYING") return;
    this.store.dispatch({ type: "PAUSE_REQUEST" });
    await this.engine.pause();
  }

  async resume() {
    const s = this.store.getState();
    if (s.status !== "PAUSED") return;
    this.store.dispatch({ type: "RESUME_REQUEST" });
    await this.engine.resume();
  }

  async stop() {
    this.store.dispatch({ type: "STOP_REQUEST" });
    await this.engine.stop();
  }

  async seek(positionMs: number) {
    const s = this.store.getState();
    if (s.currentIndex === null) return;
    this.store.dispatch({ type: "SEEK_REQUEST", positionMs });
    await this.engine.seek(positionMs);
  }

  async setVolume(volume: number) {
    this.store.dispatch({ type: "SET_VOLUME", volume });
    await this.engine.setVolume(volume);
  }

  async next() {
    const s = this.store.getState();
    if (s.tracklist.length === 0) return;
    const current = s.currentIndex ?? 0;
    const nextIndex = this.chooseNextIndex(s, current);
    this.store.dispatch({ type: "NEXT_REQUEST" });
    await this.playIndex(nextIndex);
  }

  async previous() {
    const s = this.store.getState();
    if (s.tracklist.length === 0) return;
    const current = s.currentIndex ?? 0;
    const prevIndex = Math.max(0, current - 1);
    this.store.dispatch({ type: "PREVIOUS_REQUEST" });
    await this.playIndex(prevIndex);
  }

  private onEnded() {
    const s = this.store.getState();
    this.store.dispatch({ type: "ENGINE_ENDED" });
    if (s.currentIndex === null) return;
    const nextIndex = this.chooseNextIndex(s, s.currentIndex);
    if (nextIndex !== s.currentIndex) this.playIndex(nextIndex);
  }

  private chooseNextIndex(s: PlayerCoreState, currentIndex: number): number {
    if (s.mode === "FOCUS") return currentIndex;
    if (s.mode === "CHILL") {
      if (s.tracklist.length <= 1) return currentIndex;
      let idx = currentIndex;
      let attempts = 0;
      while (idx === currentIndex && attempts < 20) {
        idx = Math.floor(Math.random() * s.tracklist.length);
        attempts++;
      }
      return idx;
    }
    const next = currentIndex + 1;
    return next < s.tracklist.length ? next : currentIndex;
  }
}
