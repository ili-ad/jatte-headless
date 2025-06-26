import React from 'react';
import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';

// Placeholder type definitions mirroring Stream's UI library
export type ReactionOptions = Array<{
  Component: React.ComponentType;
  type: string;
  name?: string;
}>;

export type ReactionDetailsComparator = (
  a: ReactionResponse,
  b: ReactionResponse,
) => number;
export type ReactionsComparator = (a: any, b: any) => number;
export type ReactionType = ReactionResponse['type'];
export type MessageContextValue = {
  handleFetchReactions?: () => void;
  reactionDetailsSort?: ReactionDetailsComparator;
};

export type ReactionsListProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'reactionDetailsSort'>
> & {
  own_reactions?: ReactionResponse[];
  reaction_counts?: Record<string, number>;
  reaction_groups?: Record<string, ReactionGroupResponse>;
  reactionOptions?: ReactionOptions;
  reactions?: ReactionResponse[];
  reverse?: boolean;
  sortReactionDetails?: ReactionDetailsComparator;
  sortReactions?: ReactionsComparator;
};

/** Minimal placeholder for Stream's ReactionsList component. */
export const ReactionsList = (_props: ReactionsListProps) => (
  <div data-testid="reactions-list">ReactionsList placeholder</div>
);

export default ReactionsList;
