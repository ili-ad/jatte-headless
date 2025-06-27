import React from 'react';
import { render } from '@testing-library/react';
import { PromptDialog } from '../src/components/Dialog/PromptDialog';

test('renders without crashing', () => {
  render(<PromptDialog prompt="confirm?" actions={[]} />);
});
