import { defaultReactionOptions } from '../src/components/Reactions/reactionOptions';

describe('reactionOptions', () => {
  test('includes like reaction', () => {
    expect(defaultReactionOptions.some((o) => o.type === 'like')).toBe(true);
  });
});
