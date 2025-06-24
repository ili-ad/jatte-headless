import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { CustomMessageActionsList } from '../src/CustomMessageActionsList'

test('renders custom actions and handles click', () => {
  const handler = jest.fn()
  const { getByText } = render(
    <CustomMessageActionsList message={{}} customMessageActions={{ Test: handler }} />
  )
  const button = getByText('Test')
  fireEvent.click(button)
  expect(handler).toHaveBeenCalled()
})
