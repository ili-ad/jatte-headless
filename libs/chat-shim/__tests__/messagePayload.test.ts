import { localMessageToNewMessagePayload } from '../index';

describe('localMessageToNewMessagePayload', () => {
  test('maps id and user_id', () => {
    const local = { id: 'temp1', text: 'hi', user_id: 'u1', extra: 42 };
    const msg = localMessageToNewMessagePayload(local);
    expect(msg).toEqual({ tmp_id: 'temp1', text: 'hi', extra: 42, user: { id: 'u1' } });
  });
});
