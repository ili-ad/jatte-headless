"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Attachment_1 = require("../src/Attachment");
describe('Attachment shim', function () {
    it('throws when used', function () {
        expect(function () { return (0, Attachment_1.Attachment)({ attachments: [] }); }).toThrow('Attachment shim not implemented');
    });
});
