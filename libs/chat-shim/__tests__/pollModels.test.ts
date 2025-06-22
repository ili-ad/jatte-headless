import { Poll, PollOption, PollState } from '../index';

describe('poll model types', () => {
  test('basic shapes', () => {
    const poll: Poll = { id: 'p1', question: 'q', user_id: 'u1', created_at: '' };
    const opt: PollOption = { id: 'o1', poll_id: 'p1', text: 'hi', user_id: 'u1', created_at: '' };
    const state: PollState = { poll, options: [opt] };
    expect(state.poll.id).toBe('p1');
    expect(state.options[0].text).toBe('hi');
  });
});
