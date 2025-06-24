// libs/stream-chat-shim/src/SuggestionListItem.tsx
import React from 'react'

export type DefaultSuggestionListItemEntity = any

export type SuggestionListItemComponentProps = {
  entity: DefaultSuggestionListItemEntity | unknown
  focused: boolean
}

export type SuggestionItemProps = {
  component: React.ComponentType<SuggestionListItemComponentProps>
  item: any
  focused: boolean
  className?: string
  onMouseEnter?: () => void
}

/**
 * Placeholder implementation of SuggestionListItem.
 */
export const SuggestionListItem = React.forwardRef<HTMLButtonElement, SuggestionItemProps>(
  function SuggestionListItem(
    { className, component: Component, focused, item, onMouseEnter }: SuggestionItemProps,
    ref,
  ) {
    return (
      <li className={className} onMouseEnter={onMouseEnter}>
        <button ref={ref} type="button">
          <Component entity={item} focused={focused} />
        </button>
      </li>
    )
  },
)
