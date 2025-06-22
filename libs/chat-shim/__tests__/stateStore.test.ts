import { StateStore } from '../index';

describe('StateStore', () => {
  test('dispatch merges state and notifies subscribers', () => {
    const store = new StateStore({ count: 0 });
    const values: number[] = [];
    const unsub = store.subscribe(() => values.push(store.getState().count));
    store.dispatch({ count: 1 });
    store.dispatch({ count: 2 });
    unsub();
    store.dispatch({ count: 3 });
    expect(values).toEqual([1, 2]);
  });

  test('subscribeWithSelector fires only on slice change', () => {
    const store = new StateStore({ a: 1, b: 1 });
    let fired = 0;
    store.subscribeWithSelector(s => s.a, () => fired++);
    store.dispatch({ b: 2 });
    store.dispatch({ a: 2 });
    expect(fired).toBe(1);
  });
});
