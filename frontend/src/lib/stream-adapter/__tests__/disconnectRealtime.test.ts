import { expect, it, vi } from 'vitest';

import { ChatClient } from '../ChatClient';

it('stops every active channel before clearing the collection', () => {
  const client = new ChatClient('u1', null);
  const observations: number[] = [];
  client.activeChannels = {
    first: { stopRealtime: vi.fn(() => observations.push(Object.keys(client.activeChannels).length)) },
    second: { stopRealtime: vi.fn(() => observations.push(Object.keys(client.activeChannels).length)) },
  };

  client.disconnectUser();

  expect(observations).toEqual([2, 2]);
  expect(client.activeChannels).toEqual({});
});
