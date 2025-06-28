import { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { StateStore } from 'chat-shim';

// ---------------------------------------------------------------------------
//  useStateStore
//  A thin wrapper around StateStore that survives “not-yet-wired” stores.
// ---------------------------------------------------------------------------

const noop = () => {};

export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>
>(store: StateStore<T>, selector: (v: T) => O): O;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>
>(store: StateStore<T> | undefined, selector: (v: T) => O): O | undefined;
export function useStateStore<
  T extends Record<string, unknown>,
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>
>(store: StateStore<T> | undefined, selector: (v: T) => O) {
  /* ─── early-exit guard ─── */
  if (!store?.getLatestValue) {
    // Always return an *object* so callers can safely destructure.
    return {} as unknown as O;
  }

  /* ---------- subscription ---------- */
  const wrappedSubscription = useCallback(
    (onStoreChange: () => void) => {
    const unsub = (store as any)?.subscribeWithSelector?.(selector, onStoreChange);
    return unsub ?? noop;
    },
    [store, selector],
  );

  /* ---------- snapshot ---------- */
  const wrappedSnapshot = useMemo(() => {
    let cachedTuple: [T, O];

    return () => {
      const currentValue = store.getLatestValue();
      if (!currentValue) return undefined;

      // fast-path: same ref as last time
      if (cachedTuple && cachedTuple[0] === currentValue) return cachedTuple[1];

      const newlySelected = selector(currentValue);

      // shallow compare selected keys
      if (cachedTuple) {
        let equal = true;
        for (const key in cachedTuple[1]) {
          if (cachedTuple[1][key] !== newlySelected[key]) {
            equal = false;
            break;
          }
        }
        if (equal) return cachedTuple[1];
      }

      cachedTuple = [currentValue, newlySelected];
      return cachedTuple[1];
    };
  }, [store, selector]);

  /* ---------- react 18 external-store ---------- */
  const state = useSyncExternalStore(wrappedSubscription, wrappedSnapshot);

  // never hand undefined to the caller
  return (state ?? ({} as unknown as O));
}
