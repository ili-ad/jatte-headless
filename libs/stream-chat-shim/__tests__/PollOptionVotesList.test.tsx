import React from 'react'
import { render } from '@testing-library/react'
import { PollOptionVotesList } from '../src/PollOptionVotesList'
import type { PollOption } from 'stream-chat'

test('renders placeholder', () => {
  const option: PollOption = { id: '1', poll_id: '1', text: 'Option 1' }
  const { getByTestId } = render(<PollOptionVotesList option={option} />)
  expect(getByTestId('poll-option-votes-list')).toBeTruthy()
})
