import { FixedSizeQueueCache } from '../index';

describe('FixedSizeQueueCache', () => {
  test('evicts oldest items when limit exceeded', () => {
    const dispose = jest.fn();
    const cache = new FixedSizeQueueCache<number, string>(2, { dispose });
    cache.add(1, 'a');
    cache.add(2, 'b');
    cache.add(3, 'c');
    expect(cache.peek(1)).toBeUndefined();
    expect(cache.get(2)).toBe('b');
    expect(cache.get(3)).toBe('c');
    expect(dispose).toHaveBeenCalledWith(1, 'a');
  });

  test('get moves item to front', () => {
    const cache = new FixedSizeQueueCache<string, number>(2);
    cache.add('a', 1);
    cache.add('b', 2);
    cache.get('a');
    cache.add('c', 3);
    expect(cache.peek('b')).toBeUndefined();
    expect(cache.peek('a')).toBe(1);
    expect(cache.peek('c')).toBe(3);
  });
});
