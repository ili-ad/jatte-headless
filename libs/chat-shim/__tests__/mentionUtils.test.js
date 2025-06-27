"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('mention utilities', function () {
    test('getTriggerCharWithToken finds last token', function () {
        expect((0, index_1.getTriggerCharWithToken)('hello @bar')).toBe('@bar');
        expect((0, index_1.getTriggerCharWithToken)('/giphy fun')).toBe('/giphy');
        expect((0, index_1.getTriggerCharWithToken)('nothing here')).toBe('');
    });
    test('insertItemWithTrigger replaces token', function () {
        expect((0, index_1.insertItemWithTrigger)('hello @ba', 'bar')).toBe('hello @bar ');
    });
    test('replaceWordWithEntity swaps word', function () {
        expect((0, index_1.replaceWordWithEntity)('hello @bar', '@bar', '<@bar>')).toBe('hello <@bar>');
    });
});
