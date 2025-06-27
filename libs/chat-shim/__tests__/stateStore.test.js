"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('StateStore', function () {
    test('dispatch merges state and notifies subscribers', function () {
        var store = new index_1.StateStore({ count: 0 });
        var values = [];
        var unsub = store.subscribe(function () { return values.push(store.getState().count); });
        store.dispatch({ count: 1 });
        store.dispatch({ count: 2 });
        unsub();
        store.dispatch({ count: 3 });
        expect(values).toEqual([1, 2]);
    });
    test('subscribeWithSelector fires only on slice change', function () {
        var store = new index_1.StateStore({ a: 1, b: 1 });
        var fired = 0;
        store.subscribeWithSelector(function (s) { return s.a; }, function () { return fired++; });
        store.dispatch({ b: 2 });
        store.dispatch({ a: 2 });
        expect(fired).toBe(1);
    });
});
