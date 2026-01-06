import { EventEmitter } from "../utils/EventEmitter.js";
class RafTimer {
    constructor() {
        this.id = null;
    }
    start(cb) {
        const loop = () => {
            this.id = globalThis.requestAnimationFrame(loop);
            cb();
        };
        this.id = globalThis.requestAnimationFrame(loop);
    }
    stop() {
        if (this.id !== null) {
            globalThis.cancelAnimationFrame(this.id);
            this.id = null;
        }
    }
}
export class TauriAudioEngine {
    constructor(options) {
        this.events = new EventEmitter();
        this.lastEmit = 0;
        this.currentTrack = null;
        const createDefault = () => new globalThis.Audio();
        this.audio = (options?.createAudio ?? createDefault)();
        this.audio.preload = "auto";
        this.timer = options?.timer ?? new RafTimer();
        const fps = options?.positionFps ?? 60;
        this.positionFps = Math.min(60, Math.max(1, fps));
        this.bindEvents();
    }
    bindEvents() {
        const onPlaying = () => {
            if (this.currentTrack)
                this.events.emit("started", { track: this.currentTrack });
            this.startPositionLoop();
        };
        const onEnded = () => {
            const t = this.currentTrack;
            this.stopPositionLoop();
            if (t)
                this.events.emit("ended", { track: t });
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
    startPositionLoop() {
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
    stopPositionLoop() {
        this.timer.stop();
    }
    play(track) {
        if (track) {
            this.currentTrack = track;
            return (async () => {
                await this.load(track.uri);
                await this.playInternal();
            })();
        }
        this.playInternal();
    }
    async pause() {
        if (this.audio.paused)
            return;
        this.audio.pause();
        this.events.emit("paused", undefined);
        this.stopPositionLoop();
    }
    async resume() {
        await this.playInternal();
        this.events.emit("resumed", undefined);
    }
    async stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.events.emit("stopped", undefined);
        this.stopPositionLoop();
    }
    async seek(positionMs) {
        const v = Math.max(0, positionMs);
        this.audio.currentTime = v / 1000;
        this.events.emit("position", { positionMs: Math.floor(this.audio.currentTime * 1000) });
    }
    async setVolume(volume) {
        const v = Math.max(0, Math.min(volume, 1));
        this.audio.volume = v;
    }
    async next() { }
    async previous() { }
    async load(url) {
        const u = this.normalizeUrl(url);
        this.audio.src = u;
        if (!this.currentTrack) {
            this.currentTrack = { id: url, uri: url, title: url, durationMs: 0 };
        }
    }
    pauseSync() {
        this.audio.pause();
        this.events.emit("paused", undefined);
        this.stopPositionLoop();
    }
    stopSync() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.events.emit("stopped", undefined);
        this.stopPositionLoop();
    }
    seekSync(position) {
        const v = Math.max(0, position);
        this.audio.currentTime = v / 1000;
        this.events.emit("position", { positionMs: Math.floor(this.audio.currentTime * 1000) });
    }
    volume(level) {
        const v = Math.max(0, Math.min(level, 1));
        this.audio.volume = v;
    }
    destroy() {
        this.stopPositionLoop();
        this.audio.src = "";
        this.currentTrack = null;
    }
    async playInternal() {
        const r = this.audio.play();
        if (r && typeof r.then === "function")
            await r;
    }
    normalizeUrl(u) {
        if (u.startsWith("app://assets/")) {
            const rel = u.replace("app://assets/", "");
            const origin = globalThis.location?.origin ?? "";
            const base = origin || "";
            const path = "/assets/" + rel;
            return base ? base + path : path;
        }
        return u;
    }
}
