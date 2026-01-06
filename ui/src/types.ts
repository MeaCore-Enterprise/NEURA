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
