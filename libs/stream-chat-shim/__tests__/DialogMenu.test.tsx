import React from 'react';
import { render } from '@testing-library/react';
import { DialogMenuButton } from '../src/components/Dialog/DialogMenu';

test('renders without crashing', () => {
  render(<DialogMenuButton>Test</DialogMenuButton>);
});
