import React from 'react'
import { render } from '@testing-library/react'
import { SearchInput } from '../src/SearchInput'

test('renders input', () => {
  const controller = {
    clearState: () => {},
    inputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
    onSearch: () => {},
    query: '',
  }
  const { getByTestId } = render(<SearchInput {...controller} />)
  expect(getByTestId('search-input')).toBeTruthy()
})
