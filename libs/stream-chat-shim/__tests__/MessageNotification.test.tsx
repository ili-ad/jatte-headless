import React from 'react';
import { render } from '@testing-library/react';
import { MessageNotification } from '../src/components/MessageList/MessageNotification';

test('renders without crashing', () => {
  render(<MessageNotification onClick={() => {}} />);
});
