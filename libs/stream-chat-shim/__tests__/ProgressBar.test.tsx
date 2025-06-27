import React from 'react';
import { render } from '@testing-library/react';
import { ProgressBar } from '../src/components/Attachment/components/ProgressBar';

test('renders without crashing', () => {
  render(<ProgressBar progress={50} />);
});
