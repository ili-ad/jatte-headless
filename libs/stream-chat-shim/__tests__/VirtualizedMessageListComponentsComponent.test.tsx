import React from 'react';
import { render } from '@testing-library/react';
import { Item } from '../src/components/MessageList/VirtualizedMessageListComponents';

test('renders without crashing', () => {
  render(<Item data-item-index={0} />);
});
