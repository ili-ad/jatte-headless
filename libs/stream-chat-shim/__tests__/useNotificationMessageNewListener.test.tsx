import { renderHook } from '@testing-library/react';
import { useNotificationMessageNewListener } from '../src/useNotificationMessageNewListener';

describe('useNotificationMessageNewListener', () => {
  it('initialises without crashing', () => {
    const setChannels = jest.fn();
    const { result } = renderHook(() =>
      useNotificationMessageNewListener(setChannels)
    );
    expect(result.current).toBeUndefined();
  });
});
