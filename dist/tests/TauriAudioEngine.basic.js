import { TauriAudioEngine } from "../core/audio/TauriAudioEngine.js";
import { EventEmitter } from "../core/utils/EventEmitter.js";
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
    tick(times) {
        for (let i = 0; i < times; i++)
            this.cb && this.cb();
    }
}
function assert(cond, msg) {
    if (!cond)
        throw new Error(msg);
}
async function run() {
    const fake = new FakeAudio();
    const timer = new ManualTimer();
    const engine = new TauriAudioEngine({ createAudio: () => fake, timer: timer, positionFps: 60 });
    const events = [];
    let lastPos = 0;
    engine.events.on("started", () => events.push("started"));
    engine.events.on("paused", () => events.push("paused"));
    engine.events.on("resumed", () => events.push("resumed"));
    engine.events.on("stopped", () => events.push("stopped"));
    engine.events.on("ended", () => events.push("ended"));
    engine.events.on("position", ({ positionMs }) => {
        lastPos = positionMs;
    });
    const t = { id: "t1", uri: "file:///a.mp3", title: "A", durationMs: 10000 };
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
