import React from 'react'
import { render } from '@testing-library/react'
import { SearchResults } from '../src/SearchResults'

test('renders placeholder', () => {
  const { getByTestId } = render(<SearchResults />)
  expect(getByTestId('search-results-placeholder')).toBeTruthy()
})
