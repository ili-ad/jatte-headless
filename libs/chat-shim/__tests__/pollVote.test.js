"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
describe('poll vote helpers', function () {
    test('isVoteAnswer detects answers', function () {
        var ans = {
            id: 'v1',
            poll_id: 'p1',
            created_at: '',
            updated_at: '',
            answer_text: 'yes',
            is_answer: true,
        };
        expect((0, index_1.isVoteAnswer)(ans)).toBe(true);
    });
    test('isVoteAnswer rejects option votes', function () {
        var vote = {
            id: 'v2',
            poll_id: 'p1',
            created_at: '',
            updated_at: '',
            option_id: 'o1',
        };
        expect((0, index_1.isVoteAnswer)(vote)).toBe(false);
    });
    test('VotingVisibility enum', function () {
        expect(index_1.VotingVisibility.anonymous).toBe('anonymous');
        expect(index_1.VotingVisibility.public).toBe('public');
    });
});
