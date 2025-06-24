import { renderHook } from '@testing-library/react';
import { useChannelHiddenListener } from '../src/useChannelHiddenListener';

it('renders without crashing', () => {
  const setChannels = jest.fn();
  const { result } = renderHook(() =>
    useChannelHiddenListener(setChannels)
  );
  expect(result.error).toBeUndefined();
});
