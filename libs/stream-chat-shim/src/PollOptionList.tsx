'use client'
import React from 'react'

export type PollOptionListProps = {
  /** Number of options to display, if undefined shows all */
  optionsDisplayCount?: number
}

/** Placeholder implementation of the PollOptionList component. */
export const PollOptionList = (_props: PollOptionListProps) => {
  return <div data-testid="poll-option-list">PollOptionList placeholder</div>
}

export default PollOptionList
