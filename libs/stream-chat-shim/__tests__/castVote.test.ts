import { StateStore } from 'chat-shim';
import type { PollVote } from 'chat-shim';

import { castVote } from '../src/chatSDKShim';

const createPollFixture = () => {
  const options = [
    { id: 'opt1', poll_id: 'poll1', text: 'First option', vote_count: 0 },
    { id: 'opt2', poll_id: 'poll1', text: 'Second option', vote_count: 0 },
  ];
  const state = new StateStore({
    options,
    latest_votes_by_option: {} as Record<string, PollVote[]>,
    vote_counts_by_option: {} as Record<string, number>,
    ownVotesByOptionId: {} as Record<string, PollVote>,
    maxVotedOptionIds: [] as string[],
    vote_count: 0,
  });

  const poll = {
    id: 'poll1',
    name: 'Sample poll',
    options,
    state,
    latest_votes_by_option: {} as Record<string, PollVote[]>,
    vote_counts_by_option: {} as Record<string, number>,
    ownVotesByOptionId: {} as Record<string, PollVote>,
    maxVotedOptionIds: [] as string[],
    vote_count: 0,
  };

  return { poll: poll as any, state };
};

describe('castVote shim', () => {
  it('casts a vote and updates poll state', async () => {
    const { poll, state } = createPollFixture();

    const result = await castVote({
      poll,
      optionId: 'opt1',
      messageId: 'msg1',
      userId: 'user1',
      user: { id: 'user1', name: 'Tester' },
    });

    expect(result.vote.option_id).toBe('opt1');
    expect(result.poll.vote_counts_by_option.opt1).toBe(1);
    expect(poll.vote_counts_by_option.opt1).toBe(1);
    expect(state.getLatestValue().vote_counts_by_option.opt1).toBe(1);
    expect(poll.maxVotedOptionIds).toEqual(['opt1']);
    expect(poll.options.find((opt: any) => opt.id === 'opt1')?.vote_count).toBe(1);
  });

  it('prevents duplicate votes for the same option', async () => {
    const { poll } = createPollFixture();

    await castVote({
      poll,
      optionId: 'opt1',
      messageId: 'msg1',
      userId: 'user1',
      user: { id: 'user1' },
    });

    await expect(
      castVote({
        poll,
        optionId: 'opt1',
        messageId: 'msg1',
        userId: 'user1',
        user: { id: 'user1' },
      }),
    ).rejects.toThrow(/already voted/i);
  });

  it('throws when option is missing', async () => {
    const { poll } = createPollFixture();

    await expect(
      castVote({
        poll,
        optionId: 'missing',
        messageId: 'msg1',
        userId: 'user1',
      }),
    ).rejects.toThrow(/not found/i);
  });

  it('rolls back optimistic updates when request fails', async () => {
    const { poll, state } = createPollFixture();

    await expect(
      castVote({
        poll,
        optionId: 'opt1',
        messageId: 'msg1',
        userId: 'user1',
        request: () => Promise.reject(new Error('network failure')),
      }),
    ).rejects.toThrow('network failure');

    expect(state.getLatestValue().vote_counts_by_option.opt1).toBeUndefined();
    expect(poll.vote_counts_by_option.opt1).toBeUndefined();
    expect(poll.maxVotedOptionIds).toEqual([]);
    expect(poll.options.find((opt: any) => opt.id === 'opt1')?.vote_count).toBe(0);
  });
});
