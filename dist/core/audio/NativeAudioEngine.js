import { EventEmitter } from "../utils/EventEmitter.js";
function getTauri() {
    const w = globalThis;
    const core = w.__TAURI__?.core;
    const event = w.__TAURI__?.event;
    if (!core || !event)
        throw new Error("TAURI_NOT_AVAILABLE");
    return { invoke: core.invoke, listen: event.listen };
}
export class NativeAudioEngine {
    constructor(opts) {
        this.events = new EventEmitter();
        this.unsubs = [];
        this.fps = 60;
        const t = opts?.invoke && opts?.listen ? { invoke: opts.invoke, listen: opts.listen } : getTauri();
        this.invoke = t.invoke;
        this.listen = t.listen;
        this.fps = Math.min(60, Math.max(1, opts?.fps ?? 60));
        this.bootstrapEvents();
    }
    async bootstrapEvents() {
        const s1 = await this.listen("neura://audio/started", (p) => {
            const track = (p?.payload?.track) ?? undefined;
            if (track)
                this.events.emit("started", { track });
        });
        const s2 = await this.listen("neura://audio/position", (p) => {
            const ms = p?.payload?.position_ms;
            if (typeof ms === "number")
                this.events.emit("position", { positionMs: ms });
        });
        const s3 = await this.listen("neura://audio/ended", (p) => {
            const track = (p?.payload?.track) ?? undefined;
            if (track)
                this.events.emit("ended", { track });
        });
        const s4 = await this.listen("neura://audio/error", (p) => {
            const err = p?.payload;
            if (err)
                this.events.emit("error", { code: String(err.code ?? "UNKNOWN"), message: String(err.message ?? "Error") });
        });
        this.unsubs.push(s1.unlisten, s2.unlisten, s3.unlisten, s4.unlisten);
        await this.invoke("plugin:neura_audio|configure_position_fps", { fps: this.fps });
    }
    async play(track) {
        await this.invoke("plugin:neura_audio|load", { url: track.uri, id: track.id, title: track.title });
        await this.invoke("plugin:neura_audio|play");
    }
    async pause() { await this.invoke("plugin:neura_audio|pause"); this.events.emit("paused", undefined); }
    async resume() { await this.invoke("plugin:neura_audio|resume"); this.events.emit("resumed", undefined); }
    async stop() { await this.invoke("plugin:neura_audio|stop"); this.events.emit("stopped", undefined); }
    async seek(positionMs) {
        await this.invoke("plugin:neura_audio|seek", { position_ms: positionMs });
    }
    async setVolume(volume) {
        await this.invoke("plugin:neura_audio|set_volume", { volume });
    }
    async next() { }
    async previous() { }
}
