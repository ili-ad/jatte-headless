import { onPollVoteChanged } from '../src/chatSDKShim';

describe('onPollVoteChanged', () => {
  test('delegates to client.on', () => {
    const unsub = jest.fn();
    const client = {
      on: jest.fn(() => ({ unsubscribe: unsub })),
    };
    const handler = jest.fn();
    const result = onPollVoteChanged(client, handler);
    expect(client.on).toHaveBeenCalledWith('poll.vote_changed', handler);
    expect(result?.unsubscribe).toBe(unsub);
  });
});
