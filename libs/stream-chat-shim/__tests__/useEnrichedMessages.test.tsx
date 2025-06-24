import { renderHook } from '@testing-library/react';
import { useEnrichedMessages } from '../src/useEnrichedMessages';

describe('useEnrichedMessages', () => {
  test('returns messages unchanged and empty group styles', () => {
    const messages = [{ id: '1' } as any, { id: '2' } as any];
    const { result } = renderHook(() =>
      useEnrichedMessages({
        channel: {} as any,
        disableDateSeparator: false,
        hideDeletedMessages: false,
        hideNewMessageSeparator: false,
        messages,
        noGroupByUser: false,
      })
    );
    expect(result.current.messages).toBe(messages);
    expect(result.current.messageGroupStyles).toEqual({});
  });
});
