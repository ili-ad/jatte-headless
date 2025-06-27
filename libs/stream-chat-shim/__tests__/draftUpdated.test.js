"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var draftUpdated_1 = require("../src/draftUpdated");
describe('draftUpdated builder', function () {
    it('creates a draft.updated event object', function () {
        var event = (0, draftUpdated_1.draftUpdated)();
        expect(event.type).toBe('draft.updated');
    });
});
