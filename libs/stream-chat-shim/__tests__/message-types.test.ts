import type { MessageProps, PinIndicatorProps, ReactEventHandler } from '../src/message-types';

describe('message-types', () => {
  test('allows creating basic typed objects', () => {
    const handler: ReactEventHandler = () => {};
    const msgProps: MessageProps = { message: {} as any };
    const indicator: PinIndicatorProps = {};
    expect(typeof handler).toBe('function');
    expect(msgProps).toHaveProperty('message');
    expect(indicator).toEqual({});
  });
});
