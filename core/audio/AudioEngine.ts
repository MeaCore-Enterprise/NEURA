import { EventEmitter } from "../utils/EventEmitter.js";

export type PlayerState = "IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "STOPPED" | "ERROR";
export type ContextMode = "FOCUS" | "CHILL" | "ACTIVE";

export interface Track {
  id: string;
  uri: string;
  title: string;
  artist?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface AudioEngineEvents {
  started: { track: Track };
  paused: undefined;
  resumed: undefined;
  stopped: undefined;
  ended: { track: Track };
  position: { positionMs: number };
  error: { code: string; message: string; cause?: unknown };
}

export interface AudioEngine {
  events: EventEmitter<AudioEngineEvents>;
  play(track: Track): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
}
