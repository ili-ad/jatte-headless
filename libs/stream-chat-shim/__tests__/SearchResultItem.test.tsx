import React from 'react'
import { render } from '@testing-library/react'
import { SearchResultItem } from '../src/SearchResultItem'

test('renders placeholder', () => {
  const { getByTestId } = render(<SearchResultItem />)
  expect(getByTestId('search-result-item-placeholder')).toBeTruthy()
})
