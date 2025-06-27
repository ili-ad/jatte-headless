import React from 'react';
import { render } from '@testing-library/react';
import { SearchInput } from '../src/components/ChannelSearch/SearchInput';

test('renders without crashing', () => {
  const inputRef = React.createRef<HTMLInputElement>();
  render(
    <SearchInput
      clearState={() => {}}
      inputRef={inputRef}
      onSearch={() => {}}
      query=""
    />
  );
});
