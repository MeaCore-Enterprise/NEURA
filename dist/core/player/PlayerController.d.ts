export declare class PlayerController {
  constructor(engine: any);
  store: { subscribe: (listener: (s: any) => void) => () => void };
  load(tracks: any[]): void;
  playIndex(index: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setMode(mode: "FOCUS" | "CHILL" | "ACTIVE"): void;
}
