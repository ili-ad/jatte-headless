import { getTestClient, mockClient } from '../src/mock-index';
import { StreamChat } from 'stream-chat';

describe('mock-index shim', () => {
  it('creates a StreamChat instance', () => {
    const client = getTestClient();
    expect(client).toBeInstanceOf(StreamChat);
  });

  it('returns same client from mockClient', () => {
    const original = new StreamChat('test');
    const wrapped = mockClient(original);
    expect(wrapped).toBe(original);
  });
});
