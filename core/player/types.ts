import type { Track, ContextMode, PlayerState } from "../audio/AudioEngine.js";

export interface ErrorInfo {
  code: string;
  message: string;
  cause?: unknown;
}

export interface PlayerCoreState {
  status: PlayerState;
  mode: ContextMode;
  tracklist: Track[];
  currentIndex: number | null;
  positionMs: number;
  volume: number;
  error?: ErrorInfo;
}

export type PlayerAction =
  | { type: "SET_MODE"; mode: ContextMode }
  | { type: "LOAD_TRACKLIST"; tracks: Track[] }
  | { type: "PLAY_REQUEST"; index: number }
  | { type: "PAUSE_REQUEST" }
  | { type: "RESUME_REQUEST" }
  | { type: "STOP_REQUEST" }
  | { type: "SEEK_REQUEST"; positionMs: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "NEXT_REQUEST" }
  | { type: "PREVIOUS_REQUEST" }
  | { type: "ENGINE_STARTED" }
  | { type: "ENGINE_PAUSED" }
  | { type: "ENGINE_RESUMED" }
  | { type: "ENGINE_STOPPED" }
  | { type: "ENGINE_ENDED" }
  | { type: "ENGINE_POSITION"; positionMs: number }
  | { type: "ENGINE_ERROR"; error: ErrorInfo };

export const initialState: PlayerCoreState = {
  status: "IDLE",
  mode: "ACTIVE",
  tracklist: [],
  currentIndex: null,
  positionMs: 0,
  volume: 1,
};
