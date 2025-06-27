import React from 'react';
import { render } from '@testing-library/react';
import { MessageRepliesCountButton } from '../src/components/Message/MessageRepliesCountButton';

test('renders without crashing', () => {
  render(<MessageRepliesCountButton reply_count={1} />);
});
