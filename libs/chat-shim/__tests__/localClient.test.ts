/// <reference types="jest" />
import WS from 'jest-websocket-mock';
import { LocalChatClient } from '../index';

describe('LocalChatClient', () => {
  let server: WS;
  beforeEach(() => {
    server = new WS('ws://localhost:8000/ws/chat/?token=jwt', { jsonProtocol: true });
    (global as any).location = { hostname: 'localhost' };
  });

  afterEach(() => {
    WS.clean();
  });

  test('connect, send, echo', async () => {
    const client = new LocalChatClient();
    await client.connectUser({ id: 'u1' }, 'jwt');
    const channel = client.channel('messaging', 'general');
    await channel.watch();

    const received: any[] = [];
    channel.on('message.new', (m) => received.push(m));

    channel.sendMessage({ text: 'ping' });
    await expect(server).toReceiveMessage({ type: 'message.new', cid: 'messaging:general', text: 'ping' });

    server.send({ type: 'message.new', cid: 'messaging:general', text: 'pong' });
    await new Promise((r) => setTimeout(r, 0));

    expect(received).toEqual([{ type: 'message.new', cid: 'messaging:general', text: 'pong' }]);
  });

  test('getUserAgent and setUserAgent', () => {
    const client = new LocalChatClient();
    expect(client.getUserAgent()).toBe('local-chat-client/0.0.1 stream-chat-react-adapter');
    client.setUserAgent('my-agent/1.0');
    expect(client.getUserAgent()).toBe('my-agent/1.0');
  });

  test('has threads register/unregister stubs', () => {
    const client = new LocalChatClient();
    expect(typeof client.threads.registerSubscriptions).toBe('function');
    expect(typeof client.threads.unregisterSubscriptions).toBe('function');
  });

  test('has polls store and register/unregister stubs', () => {
    const client = new LocalChatClient();
    expect(Array.isArray(client.polls.store.getState().polls)).toBe(true);
    expect(typeof client.polls.registerSubscriptions).toBe('function');
    expect(typeof client.polls.unregisterSubscriptions).toBe('function');
  });

  test('has reminders store and scheduler stubs', () => {
    const client = new LocalChatClient();
    expect(Array.isArray(client.reminders.store.getState().reminders)).toBe(true);
    expect(typeof client.reminders.registerSubscriptions).toBe('function');
    expect(typeof client.reminders.unregisterSubscriptions).toBe('function');
    expect(typeof client.reminders.initTimers).toBe('function');
    expect(typeof client.reminders.clearTimers).toBe('function');
  });
});
