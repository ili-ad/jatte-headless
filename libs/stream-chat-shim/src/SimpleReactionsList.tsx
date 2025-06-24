import React from 'react';
import type { ReactionGroupResponse, ReactionResponse } from 'stream-chat';

// Placeholder types for compatibility. Replace with real types once migrated.
export type ReactionOptions = any;
export type MessageContextValue = any;

export type SimpleReactionsListProps = Partial<
  Pick<MessageContextValue, 'handleFetchReactions' | 'handleReaction'>
> & {
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
  /** Override reaction counts (deprecated) */
  reaction_counts?: Record<string, number>;
  /** Summary for each reaction type on a message */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /** Supported reactions on a message */
  reactionOptions?: ReactionOptions;
  /** Reactions to display */
  reactions?: ReactionResponse[];
};

/**
 * Placeholder implementation of the SimpleReactionsList component.
 */
export const SimpleReactionsList: React.FC<SimpleReactionsListProps> = () => (
  <ul className="str-chat__simple-reactions-list">SimpleReactionsList</ul>
);

export default SimpleReactionsList;
