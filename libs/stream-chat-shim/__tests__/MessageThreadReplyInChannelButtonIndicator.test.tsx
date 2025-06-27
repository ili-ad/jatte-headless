import React from 'react';
import { render } from '@testing-library/react';
import { MessageThreadReplyInChannelButtonIndicator } from '../src/components/Message/MessageThreadReplyInChannelButtonIndicator';

describe('MessageThreadReplyInChannelButtonIndicator', () => {
  test('renders without crashing', () => {
    render(<MessageThreadReplyInChannelButtonIndicator />);
  });
});
