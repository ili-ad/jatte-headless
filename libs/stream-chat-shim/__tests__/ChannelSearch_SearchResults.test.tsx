import React from 'react';
import { render } from '@testing-library/react';
import { SearchResults } from '../src/components/ChannelSearch/SearchResults';

test('renders without crashing', () => {
  render(
    <SearchResults results={[]} searching={false} selectResult={() => undefined} />,
  );
});
