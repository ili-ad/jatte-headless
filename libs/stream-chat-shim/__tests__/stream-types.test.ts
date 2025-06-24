import type {
  DefaultStreamChatGenerics,
  UnknownType,
  UserResponse,
  StreamMessage,
  Channel,
} from '../src/stream-types';

describe('stream-types', () => {
  test('allows basic typed usage', () => {
    const generics: DefaultStreamChatGenerics = {};
    const user: UserResponse = { id: 'u1' };
    const msg: StreamMessage = { id: 'm1', text: 'hi', user };
    const channel: Channel<UnknownType> = { id: 'c1', type: 'messaging' };

    expect(user.id).toBe('u1');
    expect(msg.text).toBe('hi');
    expect(channel.type).toBe('messaging');
    expect(generics).toBeDefined();
  });
});
