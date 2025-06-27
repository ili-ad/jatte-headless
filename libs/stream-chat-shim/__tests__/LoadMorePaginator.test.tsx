import React from 'react';
import { render } from '@testing-library/react';
import { LoadMorePaginator } from '../src/components/LoadMore/LoadMorePaginator';

test('renders without crashing', () => {
  render(<LoadMorePaginator />);
});
