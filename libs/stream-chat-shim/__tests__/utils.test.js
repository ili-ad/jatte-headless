"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../src/components/Attachment/utils");
describe('components/Attachment/utils', function () {
    it('formats time', function () {
        expect((0, utils_1.displayDuration)(70)).toBe('01:10');
    });
});
