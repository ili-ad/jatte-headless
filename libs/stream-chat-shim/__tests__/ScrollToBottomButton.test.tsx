import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ScrollToBottomButton } from '../src/ScrollToBottomButton';

describe('ScrollToBottomButton', () => {
  it('does not render when list is scrolled to bottom', () => {
    const { queryByTestId } = render(
      <ScrollToBottomButton isMessageListScrolledToBottom onClick={() => {}} />
    );
    expect(queryByTestId('message-notification')).toBeNull();
  });

  it('calls onClick when clicked', () => {
    const handler = jest.fn();
    const { getByTestId } = render(
      <ScrollToBottomButton onClick={handler} />
    );
    fireEvent.click(getByTestId('message-notification'));
    expect(handler).toHaveBeenCalled();
  });
});
