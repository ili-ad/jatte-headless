import React from 'react';
import { render } from '@testing-library/react';
import { InfiniteScroll } from '../src/InfiniteScroll';

test('renders placeholder wrapper', () => {
  const { getByTestId } = render(
    <InfiniteScroll loadNextPage={() => {}}>
      <div>child</div>
    </InfiniteScroll>
  );
  expect(getByTestId('infinite-scroll-placeholder')).toBeTruthy();
});
