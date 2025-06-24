import React from 'react';
import { renderHook } from '@testing-library/react';
import ChannelActionContext, { useChannelActionContext } from '../src/ChannelActionContext';

it('provides default empty context', () => {
  const { result } = renderHook(() => useChannelActionContext());
  expect(result.current).toEqual({});
});
