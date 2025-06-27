import clsx from 'clsx';
import type { Ref } from 'react';
import React, { useCallback, useLayoutEffect, useRef } from 'react';
import type { TextComposerSuggestion } from 'stream-chat';
const useMessageComposer = () => ({ textComposer: { handleSelect: (_: any) => {} } }); // temporary shim
export type TextComposerSuggestion = any;
export type UserItemProps = any;
import type { CommandItemProps } from './CommandItem';
export type EmoticonItemProps = any;

export type DefaultSuggestionListItemEntity =
  | UserItemProps['entity']
  | CommandItemProps['entity']
  | EmoticonItemProps['entity'];

export type SuggestionListItemComponentProps = {
  entity: DefaultSuggestionListItemEntity | unknown;
  focused: boolean;
};

export type SuggestionItemProps = {
  component: React.ComponentType<SuggestionListItemComponentProps>;
  item: TextComposerSuggestion;
  focused: boolean;
  className?: string;
  onMouseEnter?: () => void;
};

export const SuggestionListItem = React.forwardRef<
  HTMLButtonElement,
  SuggestionItemProps
>(function SuggestionListItem(
  { className, component: Component, focused, item, onMouseEnter }: SuggestionItemProps,
  innerRef: Ref<HTMLButtonElement>,
) {
  const { textComposer } = useMessageComposer();
  const containerRef = useRef<HTMLLIElement>(null);

  const handleSelect = useCallback(() => {
    textComposer.handleSelect(item);
  }, [item, textComposer]);

  useLayoutEffect(() => {
    if (!focused) return;
    containerRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [focused, containerRef]);

  return (
    <li
      className={clsx('str-chat__suggestion-list-item', className, {
        'str-chat__suggestion-item--selected': focused,
      })}
      onMouseEnter={onMouseEnter}
      ref={containerRef}
    >
      <button
        onClick={handleSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleSelect();
          }
        }}
        ref={innerRef}
      >
        <Component entity={item} focused={focused} />
      </button>
    </li>
  );
});
