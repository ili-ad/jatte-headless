//frontend/src/lib/stream-adapter/index.ts
export * from './types';          // re-export Room / Message / Events
export { ChatClient } from './ChatClient';
export { API, EVENTS } from './constants';
export { CUSTOM_MESSAGE_TYPE, makeIntroMessage, isIntroMessage } from './intro';
