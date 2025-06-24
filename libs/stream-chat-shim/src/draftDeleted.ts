import type { Event } from 'stream-chat';

/**
 * Placeholder for Stream's `draftDeleted` mock event builder.
 * When implemented, this should return a `draft.deleted` event object.
 */
export const draftDeleted = (
  _overrides?: Partial<Event>,
): Event => {
  throw new Error('draftDeleted not implemented');
};

export default draftDeleted;
