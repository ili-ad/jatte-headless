"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('formatMessage', function () {
    test('autolinks URLs and replaces emoji codes', function () {
        var input = 'See https://example.com :) :smile:';
        var output = (0, index_1.formatMessage)(input);
        expect(output).toContain('<a href="https://example.com"');
        expect(output).toContain('😄');
    });
});
