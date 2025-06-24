import { renderHook } from '@testing-library/react';
import type { LocalMessage } from 'stream-chat';
import { useUserRole } from '../src/useUserRole';

describe('useUserRole', () => {
  test('returns default permissions and detects own message', () => {
    const message = {
      user: { id: 'alice' },
      client: { userID: 'alice' },
    } as unknown as LocalMessage;

    const { result } = renderHook(() => useUserRole(message));
    expect(result.current.isMyMessage).toBe(true);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canDelete).toBe(false);
  });
});
