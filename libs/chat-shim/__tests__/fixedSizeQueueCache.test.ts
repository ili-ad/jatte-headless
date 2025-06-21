import { FixedSizeQueueCache } from '../index';

describe('FixedSizeQueueCache', () => {
  test('enforces limit and FIFO order', () => {
    const cache = new FixedSizeQueueCache<number>(2);
    cache.enqueue(1);
    cache.enqueue(2);
    cache.enqueue(3);
    expect(cache.toArray()).toEqual([2, 3]);
  });

  test('dequeue returns the oldest item', () => {
    const cache = new FixedSizeQueueCache<number>(2);
    cache.enqueue(1);
    cache.enqueue(2);
    expect(cache.dequeue()).toBe(1);
    expect(cache.toArray()).toEqual([2]);
  });
});
