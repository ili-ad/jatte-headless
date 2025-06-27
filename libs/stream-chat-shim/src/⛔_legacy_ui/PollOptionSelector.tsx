import React from 'react';
import type { PollOption } from 'chat-shim';

export type AmountBarProps = {
  amount: number;
  className?: string;
};

/** Placeholder component mimicking the real AmountBar. */
export const AmountBar = ({ amount, className }: AmountBarProps) => (
  <div
    className={className}
    data-testid="amount-bar"
    role="progressbar"
    style={{ width: `${amount}%` }}
  />
);

export type CheckmarkProps = { checked?: boolean };

/** Placeholder component mimicking the real Checkmark. */
export const Checkmark = ({ checked }: CheckmarkProps) => (
  <div data-testid="checkmark" className={checked ? 'checked' : undefined} />
);

export type PollOptionSelectorProps = {
  option: PollOption;
  displayAvatarCount?: number;
  voteCountVerbose?: boolean;
};

/** Placeholder implementation of Stream's `PollOptionSelector` component. */
export const PollOptionSelector = (_props: PollOptionSelectorProps) => (
  <div data-testid="poll-option-selector-placeholder" />
);

export default PollOptionSelector;
