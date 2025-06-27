"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('reminder models', function () {
    test('basic shapes', function () {
        var rem = { id: 'r1', text: 'hi', remind_at: '' };
        var rs = { reminder: rem };
        var manager = new index_1.ReminderManager();
        manager.store.dispatch({ reminders: [rs] });
        var state = manager.store.getState();
        expect(state.reminders[0].reminder.id).toBe('r1');
    });
});
