import { renderHook, act } from '@testing-library/react';
import { useMessageSetKey } from '../src/useMessageSetKey';

describe('useMessageSetKey', () => {
  it('updates messageSetKey when first message changes', () => {
    const { result, rerender } = renderHook(
      ({ msgs }) => useMessageSetKey({ messages: msgs }),
      { initialProps: { msgs: [{ id: 'a' }] as any[] } },
    );
    const firstKey = result.current.messageSetKey;
    act(() => {
      rerender({ msgs: [{ id: 'b' }] as any[] });
    });
    expect(result.current.messageSetKey).not.toBe(firstKey);
  });

  it('keeps messageSetKey when first message remains', () => {
    const { result, rerender } = renderHook(
      ({ msgs }) => useMessageSetKey({ messages: msgs }),
      { initialProps: { msgs: [{ id: 'a' }, { id: 'b' }] as any[] } },
    );
    const key1 = result.current.messageSetKey;
    act(() => {
      rerender({ msgs: [{ id: 'a' }, { id: 'c' }] as any[] });
    });
    expect(result.current.messageSetKey).toBe(key1);
  });
});
