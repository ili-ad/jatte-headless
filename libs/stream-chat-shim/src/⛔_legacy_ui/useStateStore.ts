import { useSyncExternalStore } from 'react';
import type { StateStore } from 'chat-shim';

/**
 * React hook that subscribes to a StateStore and returns a selected value.
 *
 * This is a lightweight implementation mirroring the behaviour of
 * Stream Chat's `useStateStore` helper.
 *
 * @param store - State store or compatible object providing `subscribe` and
 *   `getLatestValue` or `getSnapshot`.
 * @param selector - Function used to select a slice of the state.
 * @returns Selected value from the store or undefined when the store is missing.
 */
export function useStateStore<T, O = T>(
  store:
    | StateStore<T>
    | {
        subscribe?: (cb: () => void) => () => void;
        getLatestValue?: () => T;
        getSnapshot?: () => T;
      }
    | undefined,
  selector: (v: T) => O = (v) => v as unknown as O,
): O | undefined {
  if (!store || typeof (store as any).subscribe !== 'function') return undefined;
  const getter =
    (store as any).getLatestValue ?? (store as any).getSnapshot ?? (() => undefined);
  return useSyncExternalStore(
    (store as any).subscribe.bind(store),
    () => selector(getter()),
    () => selector(getter()),
  );
}

export default useStateStore;
