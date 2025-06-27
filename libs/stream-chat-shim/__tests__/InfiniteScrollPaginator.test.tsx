import React from 'react';
import { render } from '@testing-library/react';
import { InfiniteScroll } from '../src/components/InfiniteScrollPaginator/InfiniteScroll';

test('renders without crashing', () => {
  render(<InfiniteScroll />);
});
