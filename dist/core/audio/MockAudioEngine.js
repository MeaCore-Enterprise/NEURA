import { EventEmitter } from "../utils/EventEmitter.js";
export class MockAudioEngine {
    constructor() {
        this.events = new EventEmitter();
        this.current = null;
        this.positionMs = 0;
        this.volume = 1;
        this.timer = null;
        this.paused = false;
    }
    async play(track) {
        this.clearTimer();
        this.current = track;
        this.positionMs = 0;
        this.paused = false;
        this.events.emit("started", { track });
        this.timer = setInterval(() => {
            if (!this.current)
                return;
            if (this.paused)
                return;
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
    async pause() {
        if (!this.current)
            return;
        this.paused = true;
        this.events.emit("paused", undefined);
    }
    async resume() {
        if (!this.current)
            return;
        this.paused = false;
        this.events.emit("resumed", undefined);
    }
    async stop() {
        this.clearTimer();
        this.current = null;
        this.positionMs = 0;
        this.paused = false;
        this.events.emit("stopped", undefined);
    }
    async seek(positionMs) {
        if (!this.current)
            return;
        const v = Math.max(0, Math.min(positionMs, this.current.durationMs));
        this.positionMs = v;
        this.events.emit("position", { positionMs: this.positionMs });
    }
    async setVolume(volume) {
        const v = Math.max(0, Math.min(volume, 1));
        this.volume = v;
    }
    async next() { }
    async previous() { }
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
