// make sure shim methods/state exist
import 'chat-shim/polyfills';

export { Chat, Channel, MessageInput, MessageList, TypingIndicator, Window } from './components';
export { AIStateIndicator } from './components/AIStateIndicator';
export { AIStates, useAIState } from './components/AIStateIndicator/hooks/useAIState';
export { MessageSimple } from './components/Message/MessageSimple';
export type { MessageProps } from './components/Message/types';
export { StopAIGenerationButton } from './components/MessageInput/StopAIGenerationButton';
export { WS_BASE } from './config/env';
export { configureApiBase, setAuthToken } from './api/chatAPI';
export { configureWebsocketBase } from './client';

export * from './components';
export * from './context';
export * from './i18n';
export * from './store';
export * from './types';
export * from './utils';
export * from './chatSDKShim';
export * from './config/env';
