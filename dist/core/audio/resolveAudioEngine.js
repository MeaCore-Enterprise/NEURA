import { NativeAudioEngine } from "./NativeAudioEngine.js";
import { TauriAudioEngine } from "./TauriAudioEngine.js";
import { MockAudioEngine } from "./MockAudioEngine.js";
function hasTauri() {
    const w = globalThis;
    return !!w.__TAURI__?.core && !!w.__TAURI__?.event;
}
async function canUseNative() {
    if (!hasTauri())
        return false;
    const w = globalThis;
    try {
        await w.__TAURI__.core.invoke("plugin:neura_audio|configure_position_fps", { fps: 60 });
        return true;
    }
    catch {
        return false;
    }
}
function deviceSupportsWebAudio() {
    const w = globalThis;
    return typeof w.Audio === "function";
}
export async function resolveAudioEngine() {
    if (await canUseNative())
        return new NativeAudioEngine({ fps: 60 });
    if (deviceSupportsWebAudio())
        return new TauriAudioEngine({ positionFps: 60 });
    return new MockAudioEngine();
}
