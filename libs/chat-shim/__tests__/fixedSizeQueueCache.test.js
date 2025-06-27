"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('FixedSizeQueueCache', function () {
    test('evicts oldest items when limit exceeded', function () {
        var dispose = jest.fn();
        var cache = new index_1.FixedSizeQueueCache(2, { dispose: dispose });
        cache.add(1, 'a');
        cache.add(2, 'b');
        cache.add(3, 'c');
        expect(cache.peek(1)).toBeUndefined();
        expect(cache.get(2)).toBe('b');
        expect(cache.get(3)).toBe('c');
        expect(dispose).toHaveBeenCalledWith(1, 'a');
    });
    test('get moves item to front', function () {
        var cache = new index_1.FixedSizeQueueCache(2);
        cache.add('a', 1);
        cache.add('b', 2);
        cache.get('a');
        cache.add('c', 3);
        expect(cache.peek('b')).toBeUndefined();
        expect(cache.peek('a')).toBe(1);
        expect(cache.peek('c')).toBe(3);
    });
});
