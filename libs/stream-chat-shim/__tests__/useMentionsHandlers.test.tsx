import { renderHook, act } from '@testing-library/react';
import { useMentionsHandlers } from '../src/useMentionsHandlers';

const event = (type: string, targetText: string) => {
  const target = document.createElement('span');
  target.innerHTML = targetText;
  return { type, target } as any;
};

describe('useMentionsHandlers', () => {
  test('calls hover and click handlers', () => {
    const hover = jest.fn();
    const click = jest.fn();
    const { result } = renderHook(() => useMentionsHandlers(hover, click));
    act(() => {
      result.current(event('mouseover', '@bob'), [{ id: 'bob', name: 'Bob' }]);
      result.current(event('click', '@bob'), [{ id: 'bob', name: 'Bob' }]);
    });
    expect(hover).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});

