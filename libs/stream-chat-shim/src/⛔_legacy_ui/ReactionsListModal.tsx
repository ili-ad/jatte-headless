import React from 'react';
import type { ReactionResponse, ReactionSort } from 'stream-chat';

export interface ReactionSummary {
  EmojiComponent: React.ComponentType | null;
  firstReactionAt: Date | null;
  isOwnReaction: boolean;
  lastReactionAt: Date | null;
  latestReactedUserNames: string[];
  reactionCount: number;
  reactionType: string;
  unlistedReactedUserCount: number;
}

export type ReactionDetailsComparator = (
  a: ReactionResponse,
  b: ReactionResponse,
) => number;

export type ReactionType = ReactionResponse['type'];

export interface ModalProps {
  open: boolean;
  className?: string;
  onClose?: (
    event: React.KeyboardEvent | React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => void;
}

export interface ReactionsListModalProps extends ModalProps {
  handleFetchReactions?: (
    reactionType?: ReactionType,
    sort?: ReactionSort,
  ) => Promise<Array<ReactionResponse>>;
  reactionDetailsSort?: ReactionSort;
  reactions: ReactionSummary[];
  selectedReactionType: ReactionType;
  onSelectedReactionTypeChange?: (reactionType: ReactionType) => void;
  sort?: ReactionSort;
  /** @deprecated use `sort` instead */
  sortReactionDetails?: ReactionDetailsComparator;
}

/**
 * Placeholder implementation of ReactionsListModal.
 */
export const ReactionsListModal = (
  _props: ReactionsListModalProps,
) => {
  return (
    <div data-testid="reactions-list-modal-placeholder">
      ReactionsListModal placeholder
    </div>
  );
};

export default ReactionsListModal;
