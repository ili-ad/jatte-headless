### TITLE
Remove SaaS calls in utils/

### BODY
Operate only in libs/stream-chat-shim/src/**.  I will chunk this into subfolders specified in the prompt.
For each reference to StreamChat SDK functions (`client.*`, `channel.*`, etc.)
replace the call with `/* TODO backend-wire-up: <method> */` (return dummy
values if async).  
Do NOT add placeholders for missing imports – they’re already gone.  
Do not touch tests or other folders.



---

Please replace references to StreamChat SDK per instructions in AGENTS.md in the following directory:
libs/stream-chat-shim/src//


  710  components/
  460  ⛔_legacy_ui/
   27  experimental/
   24  i18n/
   18  context/
   11  stories/
    9  utils/
    6  types/
    6  plugins/
    4  constants/
    3  store/


MML
├── MediaRecorder
├── Message
├── MessageActions
├── MessageBounce
├── MessageInput
├── MessageList
├── Modal
├── Notifications
├── Poll
├── Portal
├── ReactFileUtilities
├── Reactions
├── SafeAnchor
├── TextareaComposer
├── Thread
├── Threads
├── Tooltip
├── TypingIndicator
├── UtilityComponents
├── Window