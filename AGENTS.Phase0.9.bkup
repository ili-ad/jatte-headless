### TITLE  
Port COMPONEN​T_NAME from stream-chat-react (Scissors)

### BODY  
We are forking Stream-Chat-React under MIT.
Goal: copy the upstream component **verbatim** from  
`libs/stream-ui/src/<RELATIVE_PATH>` to  
`libs/stream-chat-shim/src/<RELATIVE_PATH>`  
(keep the *same* sub-directory layout).
Your job: copy the upstream implementation **verbatim**, then surgically remove
direct calls to the Stream SaaS SDK.

Root reminder: take everything that comes after libs/stream-ui/src/ and paste it under libs/stream-chat-shim/src/ unchanged.
Example — upstream components/MessageList/MessageList.tsx ⟶ libs/stream-chat-shim/src/components/MessageList/MessageList.tsx

#### Steps  
#### Steps
1. **Create the target directory if it doesn’t exist.**
   * Copy everything that sits under libs/stream-ui/src/ into the same
     sub-directory under libs/stream-chat-shim/src/. Preserve the whole
     path – components/…, context/…, utils/…, experimental/…, whatever.
   * Keep the identical relative path. Example:
   ```ts
    libs/stream-chat-shim/src/<everything after ‘components/…’>
   ```
   * So ```components/Attachment/Audio.tsx```-> ``` libs/stream-chat-shim/src/components/Attachment/Audio.tsx```

2. Paste the entire file.
3. Import swap:
   *  Most internal imports look like ```import { Something } from '../../context/ChatContext';``` 
   * Those stay untouched.
   * Only the very few lines that import from 'stream-chat' or 'stream-chat-react' get replaced by a /* TODO backend-wire-up */ stub.
   * If an imported symbol is missing because that file hasn’t been ported yet
    1. Comment out the import line and add a 1-line fallback right below it:

       // import { useFoo } from './hooks/useFoo';  // TODO backend-wire-up
       const useFoo = () => ({} as any);           // temporary shim

    2. Use the same identifier everywhere else in the file.
    3. Leave a TODO so we can delete the shim once hooks/useFoo.ts arrives.


4. **SDK amputations**
   * Delete any `import … from 'stream-chat'` or `'stream-chat-react'`.
   * For each call to SaaS methods (`client.setUser`, `channel.sendFile`, …)  
     replace with:
     ```ts
     /* TODO backend-wire-up: setUser */     // keep original arg list
     return Promise.resolve(undefined);      // if it was async
     ```
   * Result should look like:
   ```ts
    - import { useChatContext } from '../../context/ChatContext';
    - import { StreamChat } from 'stream-chat';
    + import { useChatContext } from '../../context/ChatContext';
    + /* TODO backend-wire-up: StreamChat import excised */
   ```
   * If the component needs SearchController, ChannelSearchSource, etc.,
  `import { SearchController … } from 'chat-shim'` – do **NOT** redeclare
  them locally.

   * Remove helper types/vars if they end up unused after amputations (tsc --noEmit
     fails on unused locals in our strict config).
   * If you still need the types (e.g. LocalMessage) replace
     import … from 'stream-chat' with
     import … from 'chat-shim' or declare type LocalMessage = any;
     This keeps tsc happy without pulling the SaaS SDK.
     
5. Ensure all *relative* imports continue to work.  
   Do **not** add imports from our `stream-adapter` – backend glue lives higher up.
6. Add a sanity test at  
   `libs/stream-chat-shim/__tests__/<FILE_NAME>.test.tsx`  
   ```ts
   import { render } from '@testing-library/react';
   import { <ComponentName> } from '../<RELATIVE_PATH>';
   test('renders without crashing', () => {
     render(<ComponentName />);
   });
7. DO NOT modify barrel file – we’ll regenerate later.  
8. Do NOT modify any existing file.
If a file already exists, stop and pick another task (prevents merge
conflicts).
Note: Legacy placeholder components were moved under
libs/chat-shim/⛔️_legacy_ui/**.
If you see an identically named file there, ignore it – treat the target path under libs/stream-chat-shim/src/** as new.
9. Commit only the new file + its test.
10. Don’t forget to copy any sibling index.ts re-export files referenced by the component (e.g. hooks/index.ts). They’re usually only a handful of export * from './useX'; lines, so include them in the same PR.
11. If an internal dependency is still missing, DO NOT create a separate placeholder file.
Simply keep the import as‐is and add // TODO backend-wire-up—our next agent will copy that file.

#### Success criteria  
* `pnpm build && pnpm -F frontend tsc --noEmit` passes.  
* The placeholder `<div data-testid="COMPONENT_NAME">…</div>` output is gone
  when the demo page loads.

#### Notes  
* 💡  If the component needs features our backend audit marked ❌, leave a
  `// TODO(feature-name)` comment – that’s fine for now.  
* Keep styles as in upstream (it’s all CSS classes, no SaaS call).

