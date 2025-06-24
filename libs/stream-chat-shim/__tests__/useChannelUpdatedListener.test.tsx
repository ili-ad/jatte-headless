import { renderHook } from '@testing-library/react';
import { useChannelUpdatedListener } from '../src/useChannelUpdatedListener';
import type { Channel } from 'stream-chat';

describe('useChannelUpdatedListener', () => {
  test('can be invoked without errors', () => {
    const setChannels = (() => {}) as React.Dispatch<React.SetStateAction<Array<Channel>>>;
    const { result } = renderHook(() => useChannelUpdatedListener(setChannels));
    expect(result.current).toBeUndefined();
  });
});
