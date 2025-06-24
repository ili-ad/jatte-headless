import React from 'react'
import { render } from '@testing-library/react'
import { SearchSourceResultListFooter } from '../src/SearchSourceResultListFooter'

test('renders placeholder', () => {
  const { getByTestId } = render(<SearchSourceResultListFooter />)
  expect(
    getByTestId('search-source-result-list-footer-placeholder'),
  ).toBeTruthy()
})
