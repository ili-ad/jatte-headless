"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var reminder_1 = require("../src/reminder");
describe('reminder shim', function () {
    it('throws when called', function () {
        expect(function () { return (0, reminder_1.reminder)(); }).toThrow('reminder shim not implemented');
    });
});
