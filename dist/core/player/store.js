export function createStore(initial, reducer) {
    let state = initial;
    const listeners = new Set();
    function getState() {
        return state;
    }
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    function dispatch(action) {
        const next = reducer(state, action);
        if (next !== state) {
            state = next;
            for (const l of listeners)
                l(state);
        }
    }
    return { getState, subscribe, dispatch };
}
