import { renderHook } from '@testing-library/react';
import { useMessageListScrollManager } from '../src/useMessageListScrollManager';

describe('useMessageListScrollManager', () => {
  test('returns a callback', () => {
    const { result } = renderHook(() =>
      useMessageListScrollManager({
        loadMoreScrollThreshold: 100,
        messages: [],
        onScrollBy: jest.fn(),
        scrollContainerMeasures: () => ({ offsetHeight: 0, scrollHeight: 0 }),
        scrolledUpThreshold: 50,
        scrollToBottom: jest.fn(),
        showNewMessages: jest.fn(),
      }),
    );
    expect(typeof result.current).toBe('function');
  });
});
