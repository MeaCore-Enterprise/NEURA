import type { AudioEngine, AudioEngineEvents, Track } from "./AudioEngine.js";
import { EventEmitter } from "../utils/EventEmitter.js";

type AudioLike = {
  src: string;
  preload: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  volume: number;
  play(): Promise<void> | void;
  pause(): void;
  addEventListener(type: string, listener: (ev: any) => void): void;
  removeEventListener(type: string, listener: (ev: any) => void): void;
  error?: { code: number; message?: string } | null;
};

type FrameTimer = {
  start(cb: () => void): void;
  stop(): void;
};

class RafTimer implements FrameTimer {
  private id: number | null = null;
  start(cb: () => void): void {
    const loop = () => {
      this.id = (globalThis as any).requestAnimationFrame(loop);
      cb();
    };
    this.id = (globalThis as any).requestAnimationFrame(loop);
  }
  stop(): void {
    if (this.id !== null) {
      (globalThis as any).cancelAnimationFrame(this.id);
      this.id = null;
    }
  }
}

export class TauriAudioEngine implements AudioEngine {
  events: EventEmitter<AudioEngineEvents> = new EventEmitter<AudioEngineEvents>();
  private audio: AudioLike;
  private timer: FrameTimer;
  private positionFps: number;
  private lastEmit = 0;
  private currentTrack: Track | null = null;

  constructor(options?: { createAudio?: () => AudioLike; timer?: FrameTimer; positionFps?: number }) {
    const createDefault = () => new (globalThis as any).Audio() as AudioLike;
    this.audio = (options?.createAudio ?? createDefault)();
    this.audio.preload = "auto";
    this.timer = options?.timer ?? new RafTimer();
    const fps = options?.positionFps ?? 60;
    this.positionFps = Math.min(60, Math.max(1, fps));
    this.bindEvents();
  }

  private bindEvents() {
    const onPlaying = () => {
      if (this.currentTrack) this.events.emit("started", { track: this.currentTrack });
      this.startPositionLoop();
    };
    const onEnded = () => {
      const t = this.currentTrack;
      this.stopPositionLoop();
      if (t) this.events.emit("ended", { track: t });
      this.currentTrack = null;
    };
    const onError = () => {
      const e = this.audio.error;
      const err = e ? { code: String(e.code), message: e.message ?? "Audio error" } : { code: "UNKNOWN", message: "Audio error" };
      this.events.emit("error", err);
    };
    this.audio.addEventListener("playing", onPlaying);
    this.audio.addEventListener("ended", onEnded);
    this.audio.addEventListener("error", onError);
  }

  private startPositionLoop() {
    this.lastEmit = 0;
    this.timer.start(() => {
      const now = Date.now();
      const interval = 1000 / this.positionFps;
      if (now - this.lastEmit >= interval) {
        this.lastEmit = now;
        this.events.emit("position", { positionMs: Math.floor(this.audio.currentTime * 1000) });
      }
    });
  }

  private stopPositionLoop() {
    this.timer.stop();
  }

  play(): void;
  play(track: Track): Promise<void>;
  play(track?: Track): Promise<void> | void {
    if (track) {
      this.currentTrack = track;
      return (async () => {
        await this.load(track.uri);
        await this.playInternal();
      })();
    }
    this.playInternal();
  }

  async pause(): Promise<void> {
    if (this.audio.paused) return;
    this.audio.pause();
    this.events.emit("paused", undefined);
    this.stopPositionLoop();
  }

  async resume(): Promise<void> {
    await this.playInternal();
    this.events.emit("resumed", undefined);
  }

  async stop(): Promise<void> {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.events.emit("stopped", undefined);
    this.stopPositionLoop();
  }

  async seek(positionMs: number): Promise<void> {
    const v = Math.max(0, positionMs);
    this.audio.currentTime = v / 1000;
    this.events.emit("position", { positionMs: Math.floor(this.audio.currentTime * 1000) });
  }

  async setVolume(volume: number): Promise<void> {
    const v = Math.max(0, Math.min(volume, 1));
    this.audio.volume = v;
  }

  async next(): Promise<void> {}

  async previous(): Promise<void> {}

  async load(url: string): Promise<void> {
    const u = this.normalizeUrl(url);
    this.audio.src = u;
    if (!this.currentTrack) {
      this.currentTrack = { id: url, uri: url, title: url, durationMs: 0 };
    }
  }

  

  pauseSync(): void {
    this.audio.pause();
    this.events.emit("paused", undefined);
    this.stopPositionLoop();
  }

  stopSync(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.events.emit("stopped", undefined);
    this.stopPositionLoop();
  }

  seekSync(position: number): void {
    const v = Math.max(0, position);
    this.audio.currentTime = v / 1000;
    this.events.emit("position", { positionMs: Math.floor(this.audio.currentTime * 1000) });
  }

  volume(level: number): void {
    const v = Math.max(0, Math.min(level, 1));
    this.audio.volume = v;
  }

  destroy(): void {
    this.stopPositionLoop();
    this.audio.src = "";
    this.currentTrack = null;
  }

  private async playInternal(): Promise<void> {
    const r = this.audio.play();
    if (r && typeof (r as Promise<void>).then === "function") await r;
  }
  private normalizeUrl(u: string): string {
    if (u.startsWith("app://assets/")) {
      const rel = u.replace("app://assets/", "");
      const origin = (globalThis as any).location?.origin ?? "";
      const base = origin || "";
      const path = "/assets/" + rel;
      return base ? base + path : path;
    }
    return u;
  }
}
