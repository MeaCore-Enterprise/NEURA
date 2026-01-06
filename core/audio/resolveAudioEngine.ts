import type { AudioEngine } from "./AudioEngine.js";
import { NativeAudioEngine } from "./NativeAudioEngine.js";
import { TauriAudioEngine } from "./TauriAudioEngine.js";
import { MockAudioEngine } from "./MockAudioEngine.js";

function hasTauri() {
  const w = globalThis as any;
  return !!w.__TAURI__?.core && !!w.__TAURI__?.event;
}

async function canUseNative(): Promise<boolean> {
  if (!hasTauri()) return false;
  const w = globalThis as any;
  try {
    await w.__TAURI__.core.invoke("plugin:neura_audio|configure_position_fps", { fps: 60 });
    return true;
  } catch {
    return false;
  }
}

function deviceSupportsWebAudio(): boolean {
  const w = globalThis as any;
  return typeof w.Audio === "function";
}

export async function resolveAudioEngine(): Promise<AudioEngine> {
  if (await canUseNative()) return new NativeAudioEngine({ fps: 60 });
  if (deviceSupportsWebAudio()) return new TauriAudioEngine({ positionFps: 60 });
  return new MockAudioEngine();
}
