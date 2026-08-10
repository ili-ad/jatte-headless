import { describe, expect, it } from 'vitest';

import { resolveWsBase } from '../endpoints';

describe('resolveWsBase', () => {
  it('uses and normalizes an explicit endpoint', () => {
    expect(resolveWsBase(' wss://socket.example.test/// ', undefined)).toBe(
      'wss://socket.example.test',
    );
  });

  it('derives ws from an HTTP browser location', () => {
    expect(resolveWsBase(' ', { protocol: 'http:', hostname: 'chat.test' } as Location))
      .toBe('ws://chat.test:8000');
  });

  it('derives wss from an HTTPS browser location', () => {
    expect(resolveWsBase(' ', { protocol: 'https:', hostname: 'chat.test' } as Location))
      .toBe('wss://chat.test:8000');
  });

  it('uses the server development fallback', () => {
    expect(resolveWsBase(' ', null)).toBe('ws://127.0.0.1:8000');
  });
});
