import { renderHook } from '@testing-library/react';
import { useScrollLocationLogic } from '../src/components/MessageList/hooks/MessageList';

test('hook initializes without crashing', () => {
  const div = document.createElement('div');
  const { result } = renderHook(() =>
    useScrollLocationLogic({
      hasMoreNewer: false,
      listElement: div,
      loadMoreScrollThreshold: 20,
      suppressAutoscroll: false,
      messages: [],
    })
  );
  expect(result.current).toBeTruthy();
});
