export function playerReducer(state, action) {
    switch (action.type) {
        case "SET_MODE": {
            return { ...state, mode: action.mode };
        }
        case "LOAD_TRACKLIST": {
            return { ...state, tracklist: action.tracks, currentIndex: null, positionMs: 0, status: "IDLE", error: undefined };
        }
        case "PLAY_REQUEST": {
            if (action.index < 0 || action.index >= state.tracklist.length)
                return state;
            return { ...state, status: "LOADING", currentIndex: action.index, positionMs: 0, error: undefined };
        }
        case "PAUSE_REQUEST": {
            if (state.status !== "PLAYING")
                return state;
            return { ...state, status: "PAUSED" };
        }
        case "RESUME_REQUEST": {
            if (state.status !== "PAUSED")
                return state;
            return { ...state, status: "PLAYING" };
        }
        case "STOP_REQUEST": {
            return { ...state, status: "STOPPED", positionMs: 0 };
        }
        case "SEEK_REQUEST": {
            if (state.currentIndex === null)
                return state;
            return { ...state, positionMs: action.positionMs };
        }
        case "SET_VOLUME": {
            return { ...state, volume: action.volume };
        }
        case "NEXT_REQUEST": {
            if (state.tracklist.length === 0)
                return state;
            const index = state.currentIndex ?? 0;
            const nextIndex = index + 1 < state.tracklist.length ? index + 1 : index;
            return { ...state, status: "LOADING", currentIndex: nextIndex, positionMs: 0, error: undefined };
        }
        case "PREVIOUS_REQUEST": {
            if (state.tracklist.length === 0)
                return state;
            const index = state.currentIndex ?? 0;
            const prevIndex = index - 1 >= 0 ? index - 1 : index;
            return { ...state, status: "LOADING", currentIndex: prevIndex, positionMs: 0, error: undefined };
        }
        case "ENGINE_STARTED": {
            return { ...state, status: "PLAYING" };
        }
        case "ENGINE_PAUSED": {
            return { ...state, status: "PAUSED" };
        }
        case "ENGINE_RESUMED": {
            return { ...state, status: "PLAYING" };
        }
        case "ENGINE_STOPPED": {
            return { ...state, status: "STOPPED" };
        }
        case "ENGINE_ENDED": {
            return { ...state, status: "STOPPED" };
        }
        case "ENGINE_POSITION": {
            return { ...state, positionMs: action.positionMs };
        }
        case "ENGINE_ERROR": {
            return { ...state, status: "ERROR", error: action.error };
        }
        default:
            return state;
    }
}
