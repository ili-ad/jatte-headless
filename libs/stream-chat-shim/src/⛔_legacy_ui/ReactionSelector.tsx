// libs/stream-chat-shim/src/ReactionSelector.tsx
import React from 'react';
import type { ReactionGroupResponse, ReactionResponse } from 'chat-shim';
import type { AvatarProps } from './Avatar';

export type ReactionOptions = Array<{
  Component: React.ComponentType;
  type: string;
  name?: string;
}>;

export type ReactionSelectorProps = {
  /** Custom UI component to display user avatar, defaults to and accepts same props as: Avatar */
  Avatar?: React.ElementType<AvatarProps>;
  /** If true, shows the user's avatar with the reaction */
  detailedView?: boolean;
  /** Function that adds/removes a reaction on a message (overrides the function stored in MessageContext) */
  handleReaction?: (
    reactionType: string,
    event: React.BaseSyntheticEvent,
  ) => Promise<void>;
  /** An array of the reaction objects to display in the list */
  latest_reactions?: ReactionResponse[];
  /** An array of the own reaction objects to distinguish own reactions visually */
  own_reactions?: ReactionResponse[];
  /**
   * An object that keeps track of the count of each type of reaction on a message
   * @deprecated This override value is no longer taken into account. Use `reaction_groups` to override reaction counts instead.
   */
  reaction_counts?: Record<string, number>;
  /** An object containing summary for each reaction type on a message */
  reaction_groups?: Record<string, ReactionGroupResponse>;
  /**
   * @deprecated
   * A list of the currently supported reactions on a message
   */
  reactionOptions?: ReactionOptions;
  /** If true, adds a CSS class that reverses the horizontal positioning of the selector */
  reverse?: boolean;
};

/** Minimal placeholder implementation of the ReactionSelector component. */
export const ReactionSelector = (_props: ReactionSelectorProps) => {
  return <div data-testid="reaction-selector-placeholder" />;
};

export default ReactionSelector;
