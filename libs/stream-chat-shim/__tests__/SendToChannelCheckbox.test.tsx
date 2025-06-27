import React from 'react'
import { render } from '@testing-library/react'
import { SendToChannelCheckbox } from '../src/components/MessageInput/SendToChannelCheckbox'

test('renders without crashing', () => {
  render(<SendToChannelCheckbox />)
})
