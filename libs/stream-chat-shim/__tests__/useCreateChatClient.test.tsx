import { renderHook, act } from '@testing-library/react';
import { useCreateChatClient } from '../src/useCreateChatClient';

it('creates and connects a chat client', async () => {
  const { result } = renderHook(() =>
    useCreateChatClient({
      apiKey: 'test',
      tokenOrProvider: 'token',
      userData: { id: 'u1' },
    })
  );
  await act(async () => {
    await Promise.resolve();
  });
  expect(result.current).not.toBeNull();
});
