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

/** Settings returned by `getAppSettings` */
export interface AppSettings {
  file_uploads: boolean;
}

export interface User {
  id: number;
  username: string;
}

/** Internal event-bus payloads used by CustomChannel */
// export type Events =
//   | { type: 'message.new';  message: Message }
//   | { type: 'typing.start'; user_id: string }
//   | { type: 'typing.stop';  user_id: string };

export type ChatEvents = {
  'message.new': { type: 'message.new'; message: Message };
  'typing.start': { type: 'typing.start'; user_id: string };
  'typing.stop': { type: 'typing.stop'; user_id: string };
  'settings.updated': AppSettings;
};