/* Compile-time placeholder: treat everything from @iliad/stream-ui as `any`. */
declare module '@iliad/stream-ui' {

  export const Chat: any;
  export const Channel: any;
  export const Window: any;
  export const MessageList: any;
  export const MessageInput: any;

  const ui: any;
  export = ui;
}
