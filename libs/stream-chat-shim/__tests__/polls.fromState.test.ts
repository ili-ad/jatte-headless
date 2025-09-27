import { StateStore } from 'chat-shim';

import { chatAPI } from '../src/api/chatAPI';

describe('chatAPI.polls_fromState', () => {
  it('returns poll when found in client store', () => {
    const pollState = new StateStore({
      options: [],
      latest_votes_by_option: {},
      vote_counts_by_option: {},
      ownVotesByOptionId: {},
      maxVotedOptionIds: [],
    });
    const poll = { id: 'p1', state: pollState } as any;
    const store = new StateStore<{ polls: any[] }>({ polls: [poll] });
    const client = { polls: { store } } as any;

    const result = chatAPI.polls_fromState({ client, pollId: 'p1' });

    expect(result).toBe(poll);
    expect(result?.state).toBe(pollState);
  });

  it('returns undefined when poll is not in store and no sources provided', () => {
    const store = new StateStore<{ polls: any[] }>({ polls: [] });
    const client = { polls: { store } } as any;

    expect(chatAPI.polls_fromState({ client, pollId: 'p1' })).toBeUndefined();
  });

  it('derives poll details from provided sources', () => {
    const store = new StateStore<{ polls: any[] }>({ polls: [] });
    const client = { polls: { store } } as any;

    const vote = {
      id: 'vote-1',
      poll_id: 'poll-42',
      option_id: 'opt-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const message = {
      poll_id: 'poll-42',
      poll: {
        id: 'poll-42',
        name: 'Favorite letter',
        options: [{ id: 'opt-1', poll_id: 'poll-42', text: 'A' }],
        latest_votes_by_option: { 'opt-1': [vote] },
        vote_counts_by_option: { 'opt-1': 1 },
        ownVotesByOptionId: { 'opt-1': vote },
        maxVotedOptionIds: ['opt-1'],
        vote_count: 1,
      },
    };

    const result = chatAPI.polls_fromState({
      client,
      pollId: 'poll-42',
      sources: [message],
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('poll-42');
    expect(result?.options).toHaveLength(1);
    expect(result?.options?.[0]?.text).toBe('A');
    expect(result?.vote_counts_by_option?.['opt-1']).toBe(1);
    expect(result?.state).toBeInstanceOf(StateStore);
    expect(result?.state.getLatestValue().options).toHaveLength(1);
  });
});
