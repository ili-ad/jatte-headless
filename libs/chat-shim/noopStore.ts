// libs/chat-shim/noopStore.ts
export type NoopStateStore<T = any> = {
  /** Pretend we always have a value (even if it’s undefined) */
  getLatestValue: () => T | undefined;
  /** Return an unsubscribe fn that does nothing */
  subscribe: (_listener: (v: T) => void) => () => void;
};

/** one shared instance is enough for all the shims */
export const noopStore: NoopStateStore = {
  getLatestValue: () => undefined,
  subscribe: () => () => {},   // <-- matches the signature useStateStore needs
};
