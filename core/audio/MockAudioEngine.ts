import type { AudioEngine, AudioEngineEvents, Track } from "./AudioEngine.js";
import { EventEmitter } from "../utils/EventEmitter.js";

export class MockAudioEngine implements AudioEngine {
  events: EventEmitter<AudioEngineEvents> = new EventEmitter<AudioEngineEvents>();
  private current: Track | null = null;
  private positionMs = 0;
  private volume = 1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;

  async play(track: Track): Promise<void> {
    this.clearTimer();
    this.current = track;
    this.positionMs = 0;
    this.paused = false;
    this.events.emit("started", { track });
    this.timer = setInterval(() => {
      if (!this.current) return;
      if (this.paused) return;
      this.positionMs += 200;
      this.events.emit("position", { positionMs: this.positionMs });
      if (this.positionMs >= this.current.durationMs) {
        const endedTrack = this.current;
        this.clearTimer();
        this.current = null;
        this.events.emit("ended", { track: endedTrack });
      }
    }, 200);
  }

  async pause(): Promise<void> {
    if (!this.current) return;
    this.paused = true;
    this.events.emit("paused", undefined);
  }

  async resume(): Promise<void> {
    if (!this.current) return;
    this.paused = false;
    this.events.emit("resumed", undefined);
  }

  async stop(): Promise<void> {
    this.clearTimer();
    this.current = null;
    this.positionMs = 0;
    this.paused = false;
    this.events.emit("stopped", undefined);
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.current) return;
    const v = Math.max(0, Math.min(positionMs, this.current.durationMs));
    this.positionMs = v;
    this.events.emit("position", { positionMs: this.positionMs });
  }

  async setVolume(volume: number): Promise<void> {
    const v = Math.max(0, Math.min(volume, 1));
    this.volume = v;
  }

  async next(): Promise<void> {}

  async previous(): Promise<void> {}

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
