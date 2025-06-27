import React from 'react';
import { render } from '@testing-library/react';
import { Thread } from '../src/components/Thread/Thread';

test('renders without crashing', () => {
  render(<Thread />);
});
