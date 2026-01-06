import { TauriAudioEngine } from "../core/audio/TauriAudioEngine.js";

class FakeAudio {
  src = "";
  preload = "auto";
  currentTime = 0;
  duration = 10;
  paused = true;
  volume = 1;
  error: { code: number; message?: string } | null = null;
  private listeners = new Map<string, Set<(ev?: any) => void>>();
  play(): Promise<void> {
    this.paused = false;
    this.dispatch("playing");
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  addEventListener(type: string, listener: (ev?: any) => void): void {
    const set = this.listeners.get(type) ?? new Set<(ev?: any) => void>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: (ev?: any) => void): void {
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
  tick(n: number) {
    for (let i = 0; i < n; i++) this.cb && this.cb();
  }
}

async function bench() {
  const fake = new FakeAudio();
  const timer = new ManualTimer();
  const engine = new TauriAudioEngine({ createAudio: () => fake as any, timer: timer as any, positionFps: 60 });
  let count = 0;
  engine.events.on("position", () => count++);
  const start = Date.now();
  await engine.play({ id: "t", uri: "file:///x.mp3", title: "X", durationMs: 60000 });
  timer.tick(10000);
  const elapsed = Date.now() - start;
  console.log(JSON.stringify({ ticks: 10000, events: count, ms: elapsed }));
}

bench().catch((e) => {
  console.error(e);
});
