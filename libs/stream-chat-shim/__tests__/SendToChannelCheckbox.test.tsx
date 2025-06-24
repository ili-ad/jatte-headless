import React from 'react'
import { render } from '@testing-library/react'
import { SendToChannelCheckbox } from '../src/SendToChannelCheckbox'

test('renders placeholder', () => {
  const { getByTestId } = render(<SendToChannelCheckbox />)
  expect(getByTestId('send-to-channel-checkbox-placeholder')).toBeTruthy()
})
