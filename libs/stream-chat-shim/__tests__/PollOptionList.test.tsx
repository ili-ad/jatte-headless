import React from 'react'
import { render } from '@testing-library/react'
import { PollOptionList } from '../src/PollOptionList'

test('renders placeholder', () => {
  const { getByTestId } = render(<PollOptionList />)
  expect(getByTestId('poll-option-list')).toBeTruthy()
})
