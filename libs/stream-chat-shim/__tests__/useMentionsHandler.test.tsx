import { renderHook, act } from '@testing-library/react';
import { useMentionsHandler } from '../src/useMentionsHandler';

describe('useMentionsHandler', () => {
  test('calls hover and click handlers with mentioned users', () => {
    const hover = jest.fn();
    const click = jest.fn();
    const message = { mentioned_users: [{ id: 'bob', name: 'Bob' }] } as any;
    const { result } = renderHook(() =>
      useMentionsHandler(message, {
        onMentionsHover: hover,
        onMentionsClick: click,
      })
    );

    act(() => {
      result.current.onMentionsHover({} as any);
      result.current.onMentionsClick({} as any);
    });

    expect(hover).toHaveBeenCalledWith({}, message.mentioned_users);
    expect(click).toHaveBeenCalledWith({}, message.mentioned_users);
  });
});
