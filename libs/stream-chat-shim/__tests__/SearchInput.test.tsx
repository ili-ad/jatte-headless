import React from 'react';
import { render } from '@testing-library/react';
import { SearchInput } from '../src/ChannelSearch/SearchInput';

test('renders search input', () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const { getByTestId } = render(
    <SearchInput
      clearState={() => {}}
      inputRef={inputRef}
      onSearch={() => {}}
      query=""
    />
  );
  expect(getByTestId('search-input')).toBeTruthy();
});
