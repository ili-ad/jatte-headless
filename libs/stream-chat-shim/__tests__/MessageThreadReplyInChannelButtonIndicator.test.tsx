import React from 'react';
import { render } from '@testing-library/react';
import { MessageThreadReplyInChannelButtonIndicator } from '../src/MessageThreadReplyInChannelButtonIndicator';

describe('MessageThreadReplyInChannelButtonIndicator', () => {
  it('renders placeholder', () => {
    const { getByTestId } = render(<MessageThreadReplyInChannelButtonIndicator />);
    expect(
      getByTestId('message-thread-reply-in-channel-button-indicator-placeholder')
    ).toBeTruthy();
  });
});
