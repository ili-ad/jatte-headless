import { renderHook } from '@testing-library/react';
import { useMessageListElements } from '../src/useMessageListElements';

describe('useMessageListElements', () => {
  test('calls renderMessages with provided messages', () => {
    const renderMessages = jest.fn().mockReturnValue(['ok']);
    const props = {
      enrichedMessages: [{ id: '1' }],
      internalMessageProps: { foo: 'bar' },
      messageGroupStyles: {},
      renderMessages,
      returnAllReadData: false,
      threadList: false,
    } as any;

    const { result } = renderHook(() => useMessageListElements(props));

    expect(renderMessages).toHaveBeenCalledWith({
      messages: props.enrichedMessages,
      sharedMessageProps: { ...props.internalMessageProps, threadList: false },
    });
    expect(result.current).toEqual(['ok']);
  });
});
