/* src/lib/stream-adapter/types.ts */

/** DTO returned by `GET /api/rooms/` */
export interface Room {
  uuid: string;
  name?: string;
}

/** Minimal message shape our adapter works with */
export interface Message {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
}

/** Internal event-bus payloads used by CustomChannel */
export type Events =
  | { type: 'message.new';  message: Message }
  | { type: 'typing.start'; user_id: string }
  | { type: 'typing.stop';  user_id: string };
