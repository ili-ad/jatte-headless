import { renderHook } from '@testing-library/react';
import { useShouldForceScrollToBottom } from '../src/useShouldForceScrollToBottom';

describe('useShouldForceScrollToBottom', () => {
  test('returns function that detects new own message', () => {
    const messages = [
      { id: '1', user: { id: 'me' } },
    ] as any;
    const { result } = renderHook(() =>
      useShouldForceScrollToBottom(messages, 'me'),
    );
    expect(result.current()).toBe(true);
  });
});
