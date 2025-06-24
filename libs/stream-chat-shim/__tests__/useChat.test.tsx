import { renderHook, act } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';
import { useChat } from '../src/useChat';

describe('useChat', () => {
  test('sets active channel', () => {
    const client = {} as StreamChat;
    const { result } = renderHook(() => useChat({ client }));
    expect(result.current.channel).toBeUndefined();
    act(() => {
      result.current.setActiveChannel({ id: 'test' } as any);
    });
    expect(result.current.channel).toEqual({ id: 'test' });
  });

  test('toggles mobile nav', () => {
    const client = {} as StreamChat;
    const { result } = renderHook(() => useChat({ client, initialNavOpen: false }));
    act(() => {
      result.current.openMobileNav();
    });
    expect(result.current.navOpen).toBe(true);
    act(() => {
      result.current.closeMobileNav();
    });
    expect(result.current.navOpen).toBe(false);
  });
});
