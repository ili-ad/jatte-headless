'use client'
import React from 'react'
import type { PollOption } from 'stream-chat'

export type PollOptionVotesListingProps = {
  option: PollOption
}

/** Placeholder implementation for PollOptionVotesList. */
export const PollOptionVotesList = (_props: PollOptionVotesListingProps) => {
  return (
    <div data-testid="poll-option-votes-list">PollOptionVotesList placeholder</div>
  )
}

export default PollOptionVotesList
