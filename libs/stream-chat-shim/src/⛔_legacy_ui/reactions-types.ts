import type { ComponentType } from 'react';
import type { ReactionResponse } from 'stream-chat';

/** Summary information about a specific reaction type. */
export interface ReactionSummary {
  EmojiComponent: ComponentType | null;
  firstReactionAt: Date | null;
  isOwnReaction: boolean;
  lastReactionAt: Date | null;
  latestReactedUserNames: string[];
  reactionCount: number;
  reactionType: string;
  unlistedReactedUserCount: number;
}

/** Comparator used to sort reaction summaries. */
export type ReactionsComparator = (
  a: ReactionSummary,
  b: ReactionSummary
) => number;

/** Comparator used to sort detailed reaction objects. */
export type ReactionDetailsComparator = (
  a: ReactionResponse,
  b: ReactionResponse
) => number;

/** Convenience alias for the reaction type string. */
export type ReactionType = ReactionResponse['type'];
