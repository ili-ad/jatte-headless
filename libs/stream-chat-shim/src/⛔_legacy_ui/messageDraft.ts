import type { DraftResponse } from 'chat-shim';

// simple nanoid substitute – avoids extra deps
const nanoid = () => Math.random().toString(36).slice(2);

/** Minimal message object generator used by `generateMessageDraft`. */
const generateMessage = (options: Partial<any> = {}) => {
  const data = {
    __html: '<p>regular</p>',
    attachments: [] as any[],
    created_at: new Date(),
    html: '<p>regular</p>',
    id: nanoid(),
    mentioned_users: [] as any[],
    pinned_at: null,
    status: 'received',
    text: nanoid(),
    type: 'regular',
    updated_at: new Date(),
    user: null,
    ...options,
  } as any;
  if (data.reminder) {
    (data.reminder as any).message_id = data.id;
  }
  return data;
};

/**
 * Generates a `DraftResponse` object for testing purposes.
 */
export const generateMessageDraft = ({
  channel_cid,
  ...customMsgDraft
}: Partial<DraftResponse>): DraftResponse =>
  ({
    channel_cid,
    created_at: new Date().toISOString(),
    message: generateMessage(),
    ...customMsgDraft,
  }) as DraftResponse;
