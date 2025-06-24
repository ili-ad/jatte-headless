import React from 'react';

export type AttachmentActionsProps = {
  actions: { name?: string; style?: string; text?: string; value?: string }[];
  id: string;
  text: string;
  actionHandler?: (
    name?: string,
    value?: string,
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
};

export const AttachmentActions = ({ actions, id, text, actionHandler }: AttachmentActionsProps) => {
  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    name?: string,
    value?: string
  ) => actionHandler?.(name, value, event);

  return (
    <div className="str-chat__message-attachment-actions">
      <div className="str-chat__message-attachment-actions-form">
        <span>{text}</span>
        {actions.map((action) => (
          <button
            className={`str-chat__message-attachment-actions-button str-chat__message-attachment-actions-button--${action.style}`}
            data-testid={`${action.name}`}
            data-value={action.value}
            key={`${id}-${action.value}`}
            onClick={(event) => handleActionClick(event, action.name, action.value)}
          >
            {action.text ?? null}
          </button>
        ))}
      </div>
    </div>
  );
};
