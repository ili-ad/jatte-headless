import React from 'react';
import { render } from '@testing-library/react';
import { MessageBouncePrompt } from '../src/components/MessageBounce/MessageBouncePrompt';

test('renders without crashing', () => {
  render(<MessageBouncePrompt />);
});
