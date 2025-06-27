"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var channelSearch_utils_1 = require("../src/channelSearch-utils");
describe('channelSearch-utils', function () {
    test('isChannel detects channel objects', function () {
        var channel = { cid: 'messaging:general' };
        var user = { id: 'alice' };
        expect((0, channelSearch_utils_1.isChannel)(channel)).toBe(true);
        expect((0, channelSearch_utils_1.isChannel)(user)).toBe(false);
    });
});
