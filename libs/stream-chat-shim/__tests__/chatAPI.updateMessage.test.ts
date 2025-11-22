import { chatAPI } from '../src/api/chatAPI';

describe('chatAPI.updateMessage', () => {
  it('sends text as body payload', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'm1' }),
    });
    // @ts-ignore
    global.fetch = fetchMock;

    const result = await chatAPI.updateMessage({
      cid: 'room1',
      message_id: 'm1',
      text: 'updated body',
    });

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ body: 'updated body' });
    expect(init.method).toBe('PATCH');

    expect(result).toEqual({ id: 'm1' });
  });
});
