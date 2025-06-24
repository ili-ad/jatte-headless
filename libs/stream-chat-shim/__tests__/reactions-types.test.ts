import type {
  ReactionSummary,
  ReactionType,
  ReactionDetailsComparator,
  ReactionsComparator,
} from '../src/reactions-types';

describe('reactions-types', () => {
  test('allows creating and using basic typed objects', () => {
    const summary: ReactionSummary = {
      EmojiComponent: null,
      firstReactionAt: null,
      isOwnReaction: false,
      lastReactionAt: null,
      latestReactedUserNames: [],
      reactionCount: 0,
      reactionType: 'like',
      unlistedReactedUserCount: 0,
    };
    const cmp: ReactionsComparator = (a, b) => a.reactionCount - b.reactionCount;
    const detailsCmp: ReactionDetailsComparator = () => 0;
    const type: ReactionType = 'love' as ReactionType;

    expect(summary.reactionType).toBe('like');
    expect(cmp(summary, summary)).toBe(0);
    expect(detailsCmp({} as any, {} as any)).toBe(0);
    expect(typeof type).toBe('string');
  });
});
