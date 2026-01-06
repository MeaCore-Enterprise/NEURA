export class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(event, handler) {
        const set = (this.listeners[event] ?? new Set());
        set.add(handler);
        this.listeners[event] = set;
        return () => {
            const s = this.listeners[event];
            if (!s)
                return;
            s.delete(handler);
            if (s.size === 0)
                delete this.listeners[event];
        };
    }
    emit(event, payload) {
        const set = this.listeners[event];
        if (!set)
            return;
        for (const h of set)
            h(payload);
    }
}
