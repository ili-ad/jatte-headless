import WS from 'jest-websocket-mock';
import { LocalChatClient } from '../index';

/** Ensure LocalChannel exposes a stateStore compatible with StateStore */
describe('LocalChannel', () => {
  let server: WS;
  beforeEach(() => {
    server = new WS('ws://localhost/ws/messaging:general/?token=jwt', { jsonProtocol: true });
    (global as any).location = { host: 'localhost' };
  });
  afterEach(() => {
    WS.clean();
  });

  test('channel has stateStore with basic api', async () => {
    const client = new LocalChatClient();
    await client.connectUser({ id: 'u1' }, 'jwt');
    const channel = client.channel('messaging', 'general');
    await channel.watch();
    expect(channel.stateStore).toBeDefined();
    expect(typeof channel.stateStore.getState).toBe('function');
    expect(channel.stateStore.getState().messages).toEqual([]);
  });

  test('muteStatus reflects client state', async () => {
    const client = new LocalChatClient();
    await client.connectUser({ id: 'u1' }, 'jwt');
    const channel = client.channel('messaging', 'general');
    await channel.watch();
    expect(channel.muteStatus().muted).toBe(false);
    (client as any).mutedChannels.push(channel.cid);
    expect(channel.muteStatus().muted).toBe(true);
  });
});
