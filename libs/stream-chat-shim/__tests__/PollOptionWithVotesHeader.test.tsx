import React from 'react'
import { render } from '@testing-library/react'
import { PollOptionWithVotesHeader } from '../src/components/Poll/PollActions/PollResults/PollOptionWithVotesHeader'

test('renders without crashing', () => {
  const { getByTestId } = render(
    <PollOptionWithVotesHeader option={{ id: '1', text: 'Opt' } as any} />
  )
  expect(getByTestId('poll-option-with-votes-header')).toBeTruthy()
})
