//frontend/src/lib/stream-adapter/MiniStore.ts

/* ------------------------------------------------------------------ */
/* Really tiny drop-in for Stream’s StateStore                         */
/* ------------------------------------------------------------------ */
export class MiniStore<T> {
    private _state: T;
    private listeners = new Set<() => void>();

    constructor(initial: T) {
        this._state = initial;
    }

    /* ---- APIs the React useSyncExternalStore hook relies on ---- */
    getSnapshot = () => this._state;
    getServerSnapshot = () => this._state;
    /** Stream-UI sometimes calls this alias directly */
    getLatestValue = () => this._state;

    /* ---- subscribe helpers ---- */
    subscribe = (cb: () => void) => {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    };

    /**
     * Stream-UI’s preferred helper: it lets the caller supply a selector
     * so the callback fires *only* when that slice changes.
     */
    subscribeWithSelector = <O>(selector: (v: T) => O, cb: () => void) => {
        let prev = selector(this._state);

        return this.subscribe(() => {
            const next = selector(this._state);
            if (next !== prev) {
                prev = next;
                cb();
            }
        });
    };

    /* ---- internal setter ---- */
    _set = (patch: Partial<T>) => {
        this._state = { ...this._state, ...patch };
        this.listeners.forEach(l => l());
    };

    /** Stream-UI expects dispatch(partial) */
    dispatch = (patch: Partial<T>) => this._set(patch);

  /** RxJS-compat – Stream-UI calls store.next(partial) */
  next = this._set;          // ← 🆕 one-liner
}
