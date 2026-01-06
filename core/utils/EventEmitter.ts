export class EventEmitter<T extends object> {
  private listeners: Partial<{ [K in keyof T]: Set<(payload: T[K]) => void> }> = {};

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): () => void {
    const set = (this.listeners[event] ?? new Set<(payload: T[K]) => void>()) as Set<(payload: T[K]) => void>;
    set.add(handler);
    this.listeners[event] = set;
    return () => {
      const s = this.listeners[event];
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) delete this.listeners[event];
    };
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    const set = this.listeners[event];
    if (!set) return;
    for (const h of set) h(payload);
  }
}
