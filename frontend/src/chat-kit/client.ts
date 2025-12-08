// Public entrypoint for chat adapter consumers
// Keep exports limited to the adapter surface we support for downstream apps.

// Classes
export { ChatClient, Channel } from '../lib/stream-adapter';

// Domain types
export type { AppSettings, ChatEvents, Message, Room, User } from '../lib/stream-adapter';
