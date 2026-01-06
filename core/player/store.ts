import type { PlayerCoreState, PlayerAction } from "./types.js";

type Listener = (state: PlayerCoreState) => void;

export function createStore(
  initial: PlayerCoreState,
  reducer: (state: PlayerCoreState, action: PlayerAction) => PlayerCoreState
) {
  let state = initial;
  const listeners = new Set<Listener>();

  function getState() {
    return state;
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function dispatch(action: PlayerAction) {
    const next = reducer(state, action);
    if (next !== state) {
      state = next;
      for (const l of listeners) l(state);
    }
  }

  return { getState, subscribe, dispatch };
}
