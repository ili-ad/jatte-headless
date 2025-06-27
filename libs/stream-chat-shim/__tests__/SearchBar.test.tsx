import React from 'react';
import { render } from '@testing-library/react';
import { SearchBar } from '../src/components/ChannelSearch/SearchBar';

test('renders search bar', () => {
  const props = {
    activateSearch: jest.fn(),
    exitSearch: jest.fn(),
    inputIsFocused: false,
    searchBarRef: { current: null } as React.RefObject<HTMLDivElement>,
    clearState: jest.fn(),
    inputRef: { current: null } as React.RefObject<HTMLInputElement>,
    onSearch: jest.fn(),
    query: '',
  };
  const { getByTestId } = render(<SearchBar {...props} />);
  expect(getByTestId('search-bar')).toBeTruthy();
});
