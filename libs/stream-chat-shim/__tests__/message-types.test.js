"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('message-types', function () {
    test('allows creating basic typed objects', function () {
        var handler = function () { };
        var msgProps = { message: {} };
        var indicator = {};
        expect(typeof handler).toBe('function');
        expect(msgProps).toHaveProperty('message');
        expect(indicator).toEqual({});
    });
});
