import { TauriAudioEngine } from "../core/audio/TauriAudioEngine.js";
class FakeAudio {
    constructor() {
        this.src = "";
        this.preload = "auto";
        this.currentTime = 0;
        this.duration = 10;
        this.paused = true;
        this.volume = 1;
        this.error = null;
        this.listeners = new Map();
    }
    play() {
        this.paused = false;
        this.dispatch("playing");
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
    addEventListener(type, listener) {
        const set = this.listeners.get(type) ?? new Set();
        set.add(listener);
        this.listeners.set(type, set);
    }
    removeEventListener(type, listener) {
        const set = this.listeners.get(type);
        if (!set)
            return;
        set.delete(listener);
    }
    dispatch(type, ev) {
        const set = this.listeners.get(type);
        if (!set)
            return;
        for (const l of set)
            l(ev);
    }
}
class ManualTimer {
    constructor() {
        this.cb = null;
    }
    start(cb) {
        this.cb = cb;
    }
    stop() {
        this.cb = null;
    }
    tick(n) {
        for (let i = 0; i < n; i++)
            this.cb && this.cb();
    }
}
async function bench() {
    const fake = new FakeAudio();
    const timer = new ManualTimer();
    const engine = new TauriAudioEngine({ createAudio: () => fake, timer: timer, positionFps: 60 });
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
