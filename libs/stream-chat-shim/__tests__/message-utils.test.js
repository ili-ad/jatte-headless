"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../src/components/Message/utils");
describe('message-utils', function () {
    test('isUserMuted detects muted user', function () {
        var message = { user: { id: 'u1' } };
        var mutes = [{ target: { id: 'u1' } }];
        expect((0, utils_1.isUserMuted)(message, mutes)).toBe(true);
    });
    test('isOnlyEmojis works', function () {
        expect((0, utils_1.isOnlyEmojis)('😀')).toBe(true);
        expect((0, utils_1.isOnlyEmojis)('hi')).toBe(false);
    });
});
