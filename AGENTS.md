Unit-test first (Jest in frontend or libs scope).

Write impl in libs/chat-shim (not in generated file!).

Remove the corresponding type … = any and the value stub from generated.d.ts.

Ensure pnpm --filter frontend test && build pass.

Mark ☐ to ✅ EVEN IF TESTING FAILS!!! If testing fails, simply make note of it in a brief log below the table.

| ID      | Description / public signature                                                                                                                                                                                                  | Est LOC |     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |-----
| **S1**  | `isImageAttachment(a): boolean`, `isVideoAttachment(a): boolean`, `isAudioAttachment(a): boolean` – **JPEG/PNG/GIF / mp4/webm / mp3/wav** sniff by `a.mime_type` or filename suffix.                                            | ≤80     |  ☐  |
| **S2**  | `isFileAttachment`, `isScrapedContent` (fallback “true unless image/video/audio/scraped”)                                                                                                                                       | ≤40     |  ☐  |
| **S3**  | `isVoiceRecordingAttachment` (mime starts with `audio/` **and** `waveform` array present)                                                                                                                                       | ≤40     |  ☐  |
| **S4**  | `localMessageToNewMessagePayload(local: LocalMessage): Message`<br>– Map `local.id → tmp_id`, add `user:{id}`.                                                                                                                  | ≤100    |  ☐  |
| **S5**  | **Attachment helpers (local vs uploaded)**<br>`isLocalAttachment`, `isLocalUploadAttachment`, `isLocalImageAttachment`, … (8 fns). Return true when `attachment.file` is a `File` object or `attachment.state === 'uploading'`. | ≤120    |  ☐  |
| **S6**  | `formatMessage(text:string): string` – naive link-autolink + `:emoji:` → `😃` via [`emoji-dictionary`](https://npm.im/emoji-dictionary).                                                                                        | ≤80     | ✅ |
| **S7**  | `LinkPreviewsManager.fetch(url): Promise<LinkPreview>` – call `fetch('/api/link-preview?url=…')`, cache 100 entries (LRU).                                                                                                      | ≤120    |  ☐  |
| **S8**  | Tiny `FixedSizeQueueCache<T>(limit:number)` util (enqueue, dequeue)                                                                                                                                                             | ≤60     |  ☐  |
| **S9**  | `MessageComposer` state machine:<br>`reset()`, `setText()`, `addAttachment()` – enough for unit tests.                                                                                                                          | ≤120    |  ☐  |
| **S10** | `VotingVisibility` enum & `isVoteAnswer`, `PollVote` type skeleton                                                                                                                                                              | ≤40     |  ☐  |
| **S11** | `getTriggerCharWithToken`, `insertItemWithTrigger`, `replaceWordWithEntity` – simplistic mention/command utilities.                                                                                                             | ≤120    |  ☐  |
| **S12** | `LinkPreviewsManagerState` (TS interface)                                                                                                                                                                                       | ≤20     |  ☐  |
| **S13** | `AttachmentManagerState` (interface)                                                                                                                                                                                            | ≤20     |  ☐  |
| **S14** | `NotificationManagerState` dummy + `Notification` union (toast vs banner)                                                                                                                                                       | ≤40     |  ☐  |
| **S15** | Remove `_Wildcard` emergency catch-all and ensure build passes.                                                                                                                                                                 | ≤10     |  ☐  |
