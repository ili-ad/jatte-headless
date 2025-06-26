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

#### Steps  
#### Steps
1. **Create the target directory if it doesn’t exist.**
   * Keep the identical relative path:
   ```ts
    libs/stream-chat-shim/src/<everything after ‘components/…’>
   ```
   * So ```components/Attachment/Audio.tsx```-> 
2. Paste the entire file.
3. Import swap:
   *  Most internal imports look like ```import { Something } from '../../context/ChatContext';``` 
   * Those stay untouched.
   * Only the very few lines that import from 'stream-chat' or 'stream-chat-react' get replaced by a /* TODO backend-wire-up */ stub.

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
9. Commit only the new file + its test.

#### Success criteria  
* `pnpm build && pnpm -F frontend tsc --noEmit` passes.  
* The placeholder `<div data-testid="COMPONENT_NAME">…</div>` output is gone
  when the demo page loads.

#### Notes  
* 💡  If the component needs features our backend audit marked ❌, leave a
  `// TODO(feature-name)` comment – that’s fine for now.  
* Keep styles as in upstream (it’s all CSS classes, no SaaS call).

