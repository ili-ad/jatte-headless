"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('stream-types', function () {
    test('allows basic typed usage', function () {
        var generics = {};
        var user = { id: 'u1' };
        var msg = { id: 'm1', text: 'hi', user: user };
        var channel = { id: 'c1', type: 'messaging' };
        expect(user.id).toBe('u1');
        expect(msg.text).toBe('hi');
        expect(channel.type).toBe('messaging');
        expect(generics).toBeDefined();
    });
});
