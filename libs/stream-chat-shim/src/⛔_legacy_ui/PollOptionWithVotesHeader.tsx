import React from 'react'
import type { PollOption } from 'stream-chat'

export type PollResultOptionVoteCounterProps = {
  optionId: string
}

/** Placeholder vote counter for poll options. */
export const PollResultOptionVoteCounter = (
  { optionId }: PollResultOptionVoteCounterProps,
) => {
  return (
    <span data-testid="poll-result-option-vote-counter" />
  )
}

export type PollOptionWithVotesHeaderProps = {
  option: PollOption
}

/** Minimal placeholder for Stream's PollOptionWithVotesHeader component. */
export const PollOptionWithVotesHeader = ({ option }: PollOptionWithVotesHeaderProps) => (
  <div className='str-chat__poll-option__header' data-testid='poll-option-with-votes-header'>
    <div className='str-chat__poll-option__option-text'>{option.text}</div>
    <PollResultOptionVoteCounter optionId={option.id} />
  </div>
)

export default PollOptionWithVotesHeader
