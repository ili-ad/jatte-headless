"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('notifications types', function () {
    test('toast and banner', function () {
        var toast = { type: 'toast', text: 'hello' };
        var banner = { type: 'banner', text: 'hi' };
        var state = { notifications: [toast, banner] };
        expect(state.notifications[0].type).toBe('toast');
        expect(state.notifications[1].type).toBe('banner');
    });
});
