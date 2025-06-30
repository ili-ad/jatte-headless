import { queryAnswers } from '../src/chatSDKShim';

describe('queryAnswers', () => {
  it('calls poll.queryAnswers when available', async () => {
    const fn = jest.fn().mockResolvedValue({ next: 'n1', votes: ['a'] });
    const res = await queryAnswers({ id: 'p1', queryAnswers: fn } as any, { limit: 5 });
    expect(fn).toHaveBeenCalledWith({ limit: 5 });
    expect(res).toEqual({ next: 'n1', votes: ['a'] });
  });

  it('fetches answers when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ next: 'n2', votes: ['b'] }) });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await queryAnswers({ id: 'p2' } as any, { next: 'cur' });
    expect(fetchMock).toHaveBeenCalledWith('/api/polls/p2/answers/?next=cur', { credentials: 'same-origin' });
    expect(res).toEqual({ next: 'n2', votes: ['b'] });
  });
});
