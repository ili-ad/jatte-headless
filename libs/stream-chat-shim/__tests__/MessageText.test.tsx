import React from 'react'
import { render } from '@testing-library/react'
import { MessageText } from '../src/MessageText'

test('renders placeholder', () => {
  const { getByTestId } = render(<MessageText />)
  expect(getByTestId('message-text-placeholder')).toBeTruthy()
})
