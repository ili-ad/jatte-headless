"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('reactions-types', function () {
    test('allows creating and using basic typed objects', function () {
        var summary = {
            EmojiComponent: null,
            firstReactionAt: null,
            isOwnReaction: false,
            lastReactionAt: null,
            latestReactedUserNames: [],
            reactionCount: 0,
            reactionType: 'like',
            unlistedReactedUserCount: 0,
        };
        var cmp = function (a, b) { return a.reactionCount - b.reactionCount; };
        var detailsCmp = function () { return 0; };
        var type = 'love';
        expect(summary.reactionType).toBe('like');
        expect(cmp(summary, summary)).toBe(0);
        expect(detailsCmp({}, {})).toBe(0);
        expect(typeof type).toBe('string');
    });
});
