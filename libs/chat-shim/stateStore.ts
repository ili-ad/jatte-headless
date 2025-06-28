export interface Store<T> {
  /** Stream’s useStateStore() calls this on every render */
  getLatestValue(): T;
  /** subscribe(cb) → unsubscribe() */
  subscribe(cb: () => void): () => void;
  /** mutate helper you’ll use from tests / backend */
  _set(patch: Partial<T>): void;
}

export const createStore = <T extends object>(
  initial: T,
): Store<T> => {
  let state = initial;
  const subs = new Set<() => void>();

  return {
    getLatestValue: () => state,
    subscribe: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    _set: (patch) => {
      state = { ...state, ...patch };
      subs.forEach((s) => s());
    },
  };
};
