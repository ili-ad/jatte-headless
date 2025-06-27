import React from 'react';
import { render } from '@testing-library/react';
import { ScrollToBottomButton } from '../src/components/MessageList/ScrollToBottomButton';

test('renders without crashing', () => {
  render(<ScrollToBottomButton />);
});
