"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('poll model types', function () {
    test('basic shapes', function () {
        var poll = { id: 'p1', question: 'q', user_id: 'u1', created_at: '' };
        var opt = { id: 'o1', poll_id: 'p1', text: 'hi', user_id: 'u1', created_at: '' };
        var state = { poll: poll, options: [opt] };
        expect(state.poll.id).toBe('p1');
        expect(state.options[0].text).toBe('hi');
    });
});
