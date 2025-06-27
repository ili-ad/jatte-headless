import type { DraftResponse, StreamChat } from 'chat-shim';

/** Parameters for the `draftUpdated` mock event builder. */
export interface DraftUpdatedParams {
  /** Draft object returned from Stream Chat */
  draft?: DraftResponse;
  /** Client instance associated with the event */
  client?: StreamChat;
}

/**
 * Minimal placeholder for Stream's `draftUpdated` mock builder.
 * Returns a basic event-like object mirroring the `draft.updated` event.
 */
export const draftUpdated = (
  params: DraftUpdatedParams = {},
): Record<string, unknown> => {
  const { draft, client } = params;
  return {
    type: 'draft.updated',
    draft,
    user: client?.user,
  };
};

export default draftUpdated;
