import type { Channel, UserResponse } from 'chat-shim';

export type ChannelOrUserResponse = Channel | UserResponse;

export const isChannel = (output: ChannelOrUserResponse): output is Channel =>
  (output as Channel).cid != null;
