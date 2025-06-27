import React from 'react';
import { render } from '@testing-library/react';
import { LoadMoreButton } from '../src/components/LoadMore/LoadMoreButton';

test('renders without crashing', () => {
  render(<LoadMoreButton onClick={() => {}} />);
});
