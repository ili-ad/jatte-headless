import { isVoteAnswer, VotingVisibility } from '../index';

describe('poll vote helpers', () => {
  test('isVoteAnswer detects answers', () => {
    const ans = {
      id: 'v1',
      poll_id: 'p1',
      created_at: '',
      updated_at: '',
      answer_text: 'yes',
      is_answer: true,
    };
    expect(isVoteAnswer(ans)).toBe(true);
  });

  test('isVoteAnswer rejects option votes', () => {
    const vote = {
      id: 'v2',
      poll_id: 'p1',
      created_at: '',
      updated_at: '',
      option_id: 'o1',
    };
    expect(isVoteAnswer(vote)).toBe(false);
  });

  test('VotingVisibility enum', () => {
    expect(VotingVisibility.anonymous).toBe('anonymous');
    expect(VotingVisibility.public).toBe('public');
  });
});
