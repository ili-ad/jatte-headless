### TITLE
Remove SaaS calls in utils/

### BODY
Operate only in libs/stream-chat-shim/src/**.  I will chunk this into subfolders specified in the prompt.
For each reference to StreamChat SDK functions (`client.*`, `channel.*`, etc.)
replace the call with `/* TODO backend-wire-up: <method> */` (return dummy
values if async).  
Do NOT add placeholders for missing imports – they’re already gone.  
Do not touch tests or other folders.
