import React from 'react';
import { render } from '@testing-library/react';
import { MessageOptions } from '../src/components/Message/MessageOptions';

test('renders without crashing', () => {
  render(<MessageOptions />);
});
