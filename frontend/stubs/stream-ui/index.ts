// Ultra-minimal stub for MVP build
// Provide tiny React components so the demo compiles without the real package
import React from 'react';

export const Chat = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
export const Channel = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
export const Window = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
export const MessageList = () => null;
export const MessageInput = () => null;
export default {};
export * from 'stream-chat-react';