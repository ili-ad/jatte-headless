import React from 'react'

export type CustomMessageActionsListProps = {
  message: any
  customMessageActions?: Record<string, (message: any, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void>
}

/** Placeholder implementation mimicking the Stream Chat component. */
export const CustomMessageActionsList = (props: CustomMessageActionsListProps) => {
  const { customMessageActions, message } = props
  if (!customMessageActions) return null

  const customActionsArray = Object.keys(customMessageActions)

  return (
    <>
      {customActionsArray.map((customAction) => {
        const customHandler = customMessageActions[customAction]
        return (
          <button
            aria-selected="false"
            className="str-chat__message-actions-list-item str-chat__message-actions-list-item-button"
            key={customAction}
            onClick={(event) => customHandler(message, event)}
            role="option"
          >
            {customAction}
          </button>
        )
      })}
    </>
  )
}

export default CustomMessageActionsList
