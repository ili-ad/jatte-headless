import React from 'react';

export type SuggestionTrigger = '/' | ':' | '@' | string;

export type SuggestionListItemComponentProps = {
  entity: unknown;
  focused: boolean;
};

export type SuggestionListProps = Partial<{
  suggestionItemComponents: Record<
    SuggestionTrigger,
    React.ComponentType<SuggestionListItemComponentProps>
  >;
  className?: string;
  closeOnClickOutside?: boolean;
  containerClassName?: string;
  focusedItemIndex: number;
  setFocusedItemIndex: (index: number) => void;
}>;

export const defaultComponents: Record<
  SuggestionTrigger,
  React.ComponentType<SuggestionListItemComponentProps>
> = {
  '/': () => null,
  ':': () => null,
  '@': () => null,
} as const;

/**
 * Placeholder SuggestionList component used while porting from stream-chat-react.
 * It simply renders a container div and does not implement suggestion logic yet.
 */
export const SuggestionList = (
  props: SuggestionListProps,
) => {
  const { containerClassName } = props;
  return <div className={containerClassName} data-testid="suggestion-list" />;
};

export default SuggestionList;
