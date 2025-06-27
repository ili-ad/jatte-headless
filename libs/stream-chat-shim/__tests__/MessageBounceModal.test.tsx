import React from 'react';
import { render } from '@testing-library/react';
import { MessageBounceModal } from '../src/components/MessageBounce/MessageBounceModal';

test('renders without crashing', () => {
  render(<MessageBounceModal MessageBouncePrompt={() => null} />);
});
