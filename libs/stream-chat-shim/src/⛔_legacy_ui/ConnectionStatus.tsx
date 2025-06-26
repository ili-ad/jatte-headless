import React from 'react';

/** Placeholder generic defaults matching the Stream Chat generics. */
export interface DefaultStreamChatGenerics {}

/**
 * Minimal placeholder for the ConnectionStatus component.
 *
 * @returns JSX element indicating a placeholder.
 */
export const ConnectionStatus = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  return (
    <div data-testid="connection-status-placeholder">ConnectionStatus</div>
  );
};

export default ConnectionStatus;

