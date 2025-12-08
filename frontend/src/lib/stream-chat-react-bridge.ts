// Thin bridge around the vendored Stream UI (`libs/stream-chat-shim`).
// This is the public entrypoint for Stream chat React components within the frontend app.
// App code should import Stream UI only from here, not directly from `libs/`.
// /* ------------------------------------------------------------------ *
//  *  Fallback for missing textComposer (MessageInput → TextareaComposer)
//  * ------------------------------------------------------------------ */

// import * as React from 'react';
// import * as scr from 'stream-chat-react';

// // locate the original export once
// const OrigTextarea: any =
//   (scr as any).TextareaComposer ??
//   (scr as any).components?.TextareaComposer;

// if (OrigTextarea && !(OrigTextarea as any).__patched) {
//   (OrigTextarea as any).__patched = true;

//   // very small, inert implementation
//   const dummyComposer = {
//     state: { text: '', attachments: [] as any[] },
//     setText: () => {},
//     addAttachment: () => {},
//     submit: () => {},
//     linkPreviewsManager: {
//       state: {
//         getLatestValue: () => ({ previews: new Map() }),
//         subscribe: (cb: () => void) => { cb(); return () => {}; },
//       },
//     },
//   };

//   // wrap the original component
//   (scr as any).TextareaComposer = function PatchedTextareaComposer(
//     props: any,
//   ) {
//     if (!props?.textComposer) {
//       props = { ...props, textComposer: dummyComposer };
//     }
//     return React.createElement(OrigTextarea, props);
//   };
// }
