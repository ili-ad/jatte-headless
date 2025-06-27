import React from 'react';
import { render } from '@testing-library/react';

import { InfiniteScrollPaginator } from '../src/components/InfiniteScrollPaginator/InfiniteScrollPaginator';

test('renders without crashing', () => {
  render(<InfiniteScrollPaginator />);

});
