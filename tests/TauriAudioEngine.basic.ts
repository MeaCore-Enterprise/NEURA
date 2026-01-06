import { TauriAudioEngine } from "../core/audio/TauriAudioEngine.js";
import { EventEmitter } from "../core/utils/EventEmitter.js";
import type { Track } from "../core/audio/AudioEngine.js";

type Listener = (ev?: any) => void;

class FakeAudio {
  src = "";
  preload = "auto";
  currentTime = 0;
  duration = 10;
  paused = true;
  volume = 1;
  error: { code: number; message?: string } | null = null;
  private listeners = new Map<string, Set<Listener>>();
  play(): Promise<void> {
    this.paused = false;
    this.dispatch("playing");
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  addEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(listener);
  }
  dispatch(type: string, ev?: any): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const l of set) l(ev);
  }
}

class ManualTimer {
  private cb: (() => void) | null = null;
  start(cb: () => void) {
    this.cb = cb;
  }
  stop() {
    this.cb = null;
  }
  tick(times: number) {
    for (let i = 0; i < times; i++) this.cb && this.cb();
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function run() {
  const fake = new FakeAudio();
  const timer = new ManualTimer();
  const engine = new TauriAudioEngine({ createAudio: () => fake as any, timer: timer as any, positionFps: 60 });
  const events: string[] = [];
  let lastPos = 0;
  engine.events.on("started", () => events.push("started"));
  engine.events.on("paused", () => events.push("paused"));
  engine.events.on("resumed", () => events.push("resumed"));
  engine.events.on("stopped", () => events.push("stopped"));
  engine.events.on("ended", () => events.push("ended"));
  engine.events.on("position", ({ positionMs }) => {
    lastPos = positionMs;
  });

  const t: Track = { id: "t1", uri: "file:///a.mp3", title: "A", durationMs: 10000 };
  await engine.play(t);
  timer.tick(5);
  assert(events.includes("started"), "started not emitted");
  assert(lastPos >= 0, "position not emitted");

  await engine.pause();
  assert(events.includes("paused"), "paused not emitted");

  await engine.resume();
  assert(events.includes("resumed"), "resumed not emitted");

  await engine.seek(500);
  assert(lastPos >= 500, "seek did not update position");

  fake.dispatch("ended");
  assert(events.includes("ended"), "ended not emitted");

  await engine.stop();
  assert(events.includes("stopped"), "stopped not emitted");

  console.log("OK");
}

run().catch((e) => {
  console.error(e);
});
