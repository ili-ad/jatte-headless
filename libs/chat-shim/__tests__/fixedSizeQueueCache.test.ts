import { FixedSizeQueueCache } from '../index';

describe('FixedSizeQueueCache', () => {
  test('maintains a fixed number of items', () => {
    const q = new FixedSizeQueueCache<number>(2);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.size).toBe(2);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
    expect(q.dequeue()).toBeUndefined();
  });
});
