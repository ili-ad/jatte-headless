# Stream-Chat Shim Migration – task template
Every task implements **one public symbol** that our frontend imports from
`stream-chat-react`.  Symbols live in the package `libs/@ourorg/stream-chat-shim`.

### How to work a row

1. **Find the row below specified in the prompt by it's public symbol** if that one is complete
    already pick any row with “ ✅”.
   _If all rows are ✅, add a new one for the symbol you just noticed is
   missing._

2.  **Create/extend file**  
    `libs/stream-chat-shim/src/<symbolName>.{ts,tsx}` exporting a drop-in
    replacement.  
    • If we don’t need real behaviour yet, return a `<Placeholder>` or a
      minimal class that throws *“not implemented”* when called.  
    • Keep the public interface (props, methods) identical.
    *Import nothing from `stream-chat-react` inside the shim!*    

3.  **Add re-export**  
    ⛔️ Don’t touch libs/chat-shim/index.ts while feature branches are open.
    We’ll generate the barrel file once, after everything lands, to avoid merge
    conflicts.

4.  ⛔️ Leave existing runtime patches in place for now.
    We’ll strip them out in one deterministic pass once all feature branches have merged.
    • DO please: append a line with the file path at libs/chat-shim/RUNTIME_PATCHES.todo (create if missing)

5.  **Unit-test** (optional but recommended):  
    `libs/stream-chat-shim/__tests__/<symbolName>.test.tsx`

6.  **Run** `pnpm build && pnpm -F frontend tsc --noEmit` – must compile
    with no new errors.

## Parallel-work guidelines
* Each agent **creates or edits only its own file** – merge conflicts
  stay trivial.
* Never modify `node_modules` or the original `stream-chat-react`.





## Stream-Chat Shim Migration – task board
Each row represents **one public symbol** we must provide in
`libs/stream-chat-shim`.  Add more rows as new gaps are discovered.


    Mark the row ✅ (even if tests fail).
    If tests fail or you hit a blocker, add a brief note in “Notes /
    mini-log” so the next agent can pick up quickly.

    Commit / PR – one symbol per PR keeps merge conflicts trivial.

Locating the original reference

    Search the manifest (below) for the filename that contains the
    original implementation.

    Open it to copy prop types or behaviour, but do not import from it.




| ID  | Symbol                               | Path (create / adapt)                                                                                               | Status | Notes |
|-----|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------|--------|-------|
| 001 | stream-chat-custom-data              | libs/stream-ui/src/@types/stream-chat-custom-data.d.ts                                                               | ✅ | |
| 002 | AIStateIndicator                     | libs/stream-ui/src/components/AIStateIndicator/AIStateIndicator.tsx                                                  | ☐ | |
| 003 | useAIState                           | libs/stream-ui/src/components/AIStateIndicator/hooks/useAIState.ts                                                   | ☐ | |
| 004 | Attachment                           | libs/stream-ui/src/components/Attachment/Attachment.tsx                                                              | ☐ | |
| 005 | AttachmentActions                    | libs/stream-ui/src/components/Attachment/AttachmentActions.tsx                                                       | ☐ | |
| 006 | AttachmentContainer                  | libs/stream-ui/src/components/Attachment/AttachmentContainer.tsx                                                     | ☐ | |
| 007 | Audio                                | libs/stream-ui/src/components/Attachment/Audio.tsx                                                                   | ☐ | |
| 008 | Card                                 | libs/stream-ui/src/components/Attachment/Card.tsx                                                                    | ☐ | |
| 009 | FileAttachment                       | libs/stream-ui/src/components/Attachment/FileAttachment.tsx                                                          | ☐ | |
| 010 | UnsupportedAttachment                | libs/stream-ui/src/components/Attachment/UnsupportedAttachment.tsx                                                   | ☐ | |
| 011 | VoiceRecording                       | libs/stream-ui/src/components/Attachment/VoiceRecording.tsx                                                          | ☐ | |
| 012 | attachment-sizing                    | libs/stream-ui/src/components/Attachment/attachment-sizing.tsx                                                       | ☐ | |
| 013 | attachment-utils                     | libs/stream-ui/src/components/Attachment/utils.tsx                                                                   | ☐ | |
| 014 | Avatar                               | libs/stream-ui/src/components/Avatar/Avatar.tsx                                                                      | ☐ | |
| 015 | Channel                              | libs/stream-ui/src/components/Channel/Channel.tsx                                                                    | ☐ | |
| 016 | Channel.test                         | libs/stream-ui/src/components/Channel/__tests__/Channel.test.js                                                      | ☐ | |
| 017 | channelState                         | libs/stream-ui/src/components/Channel/channelState.ts                                                                | ☐ | |
| 018 | useEditMessageHandler                | libs/stream-ui/src/components/Channel/hooks/useEditMessageHandler.ts                                                 | ☐ | |
| 019 | useMentionsHandlers                  | libs/stream-ui/src/components/Channel/hooks/useMentionsHandlers.ts                                                   | ☐ | |
| 020 | channel-utils                        | libs/stream-ui/src/components/Channel/utils.ts                                                                       | ☐ | |
| 021 | ChannelHeader                        | libs/stream-ui/src/components/ChannelHeader/ChannelHeader.tsx                                                        | ☐ | |
| 022 | ChannelList                          | libs/stream-ui/src/components/ChannelList/ChannelList.tsx                                                            | ✅ | |
| 023 | ChannelListMessenger                 | libs/stream-ui/src/components/ChannelList/ChannelListMessenger.tsx                                                   | ☐ | |
| 024 | ChannelList.test                     | libs/stream-ui/src/components/ChannelList/__tests__/ChannelList.test.js                                              | ☐ | |
| 025 | useChannelDeletedListener            | libs/stream-ui/src/components/ChannelList/hooks/useChannelDeletedListener.ts                                         | ☐ | |
| 026 | useChannelHiddenListener             | libs/stream-ui/src/components/ChannelList/hooks/useChannelHiddenListener.ts                                          | ☐ | |
| 027 | useChannelListShape                  | libs/stream-ui/src/components/ChannelList/hooks/useChannelListShape.ts                                               | ☐ | |
| 028 | useChannelMembershipState            | libs/stream-ui/src/components/ChannelList/hooks/useChannelMembershipState.ts                                         | ☐ | |
| 029 | useChannelTruncatedListener          | libs/stream-ui/src/components/ChannelList/hooks/useChannelTruncatedListener.ts                                       | ☐ | |
| 030 | useChannelUpdatedListener            | libs/stream-ui/src/components/ChannelList/hooks/useChannelUpdatedListener.ts                                         | ☐ | |
| 031 | useChannelVisibleListener            | libs/stream-ui/src/components/ChannelList/hooks/useChannelVisibleListener.ts                                         | ☐ | |
| 032 | useMessageNewListener                | libs/stream-ui/src/components/ChannelList/hooks/useMessageNewListener.ts                                             | ☐ | |
| 033 | useNotificationAddedToChannelListener | libs/stream-ui/src/components/ChannelList/hooks/useNotificationAddedToChannelListener.ts                            | ☐ | |
| 034 | useNotificationMessageNewListener    | libs/stream-ui/src/components/ChannelList/hooks/useNotificationMessageNewListener.ts                                 | ☐ | |
| 035 | useNotificationRemovedFromChannelListener | libs/stream-ui/src/components/ChannelList/hooks/useNotificationRemovedFromChannelListener.ts                     | ☐ | |
| 036 | usePaginatedChannels                 | libs/stream-ui/src/components/ChannelList/hooks/usePaginatedChannels.ts                                              | ☐ | |
| 037 | useSelectedChannelState              | libs/stream-ui/src/components/ChannelList/hooks/useSelectedChannelState.ts                                           | ☐ | |
| 038 | useUserPresenceChangedListener       | libs/stream-ui/src/components/ChannelList/hooks/useUserPresenceChangedListener.ts                                    | ☐ | |
| 039 | channelList-utils                    | libs/stream-ui/src/components/ChannelList/utils.ts                                                                   | ☐ | |
| 040 | ChannelPreview                       | libs/stream-ui/src/components/ChannelPreview/ChannelPreview.tsx                                                      | ☐ | |
| 041 | ChannelPreviewActionButtons          | libs/stream-ui/src/components/ChannelPreview/ChannelPreviewActionButtons.tsx                                         | ☐ | |
| 042 | useChannelPreviewInfo                | libs/stream-ui/src/components/ChannelPreview/hooks/useChannelPreviewInfo.ts                                          | ☐ | |
| 043 | useIsChannelMuted                    | libs/stream-ui/src/components/ChannelPreview/hooks/useIsChannelMuted.ts                                              | ☐ | |
| 044 | useMessageDeliveryStatus             | libs/stream-ui/src/components/ChannelPreview/hooks/useMessageDeliveryStatus.ts                                       | ☐ | |
| 045 | channelPreview-utils                 | libs/stream-ui/src/components/ChannelPreview/utils.tsx                                                               | ☐ | |
| 046 | SearchResults                        | libs/stream-ui/src/components/ChannelSearch/SearchResults.tsx                                                        | ☐ | |
| 047 | useChannelSearch                     | libs/stream-ui/src/components/ChannelSearch/hooks/useChannelSearch.ts                                                | ☐ | |
| 048 | channelSearch-utils                  | libs/stream-ui/src/components/ChannelSearch/utils.ts                                                                 | ☐ | |
| 049 | Chat                                 | libs/stream-ui/src/components/Chat/Chat.tsx                                                                          | ☐ | |
| 050 | Chat.test                            | libs/stream-ui/src/components/Chat/__tests__/Chat.test.js                                                            | ☐ | |
| 051 | useChannelsQueryState                | libs/stream-ui/src/components/Chat/hooks/useChannelsQueryState.ts                                                    | ☐ | |
| 052 | useChat                              | libs/stream-ui/src/components/Chat/hooks/useChat.ts                                                                  | ☐ | |
| 053 | useCreateChatClient                  | libs/stream-ui/src/components/Chat/hooks/useCreateChatClient.ts                                                      | ☐ | |
| 054 | ChatView                             | libs/stream-ui/src/components/ChatView/ChatView.tsx                                                                  | ☐ | |
| 055 | DialogManager                        | libs/stream-ui/src/components/Dialog/DialogManager.ts                                                                | ☐ | |
| 056 | EventComponent                       | libs/stream-ui/src/components/EventComponent/EventComponent.tsx                                                      | ☐ | |
| 057 | Gallery                              | libs/stream-ui/src/components/Gallery/Gallery.tsx                                                                    | ☐ | |
| 058 | GalleryImage                         | libs/stream-ui/src/components/Gallery/Image.tsx                                                                      | ☐ | |
| 059 | ModalGallery                         | libs/stream-ui/src/components/Gallery/ModalGallery.tsx                                                               | ☐ | |
| 060 | InfiniteScroll                       | libs/stream-ui/src/components/InfiniteScrollPaginator/InfiniteScroll.tsx                                             | ☐ | |
| 061 | useCursorPaginator                   | libs/stream-ui/src/components/InfiniteScrollPaginator/hooks/useCursorPaginator.ts                                    | ☐ | |
| 062 | LoadMoreButton                       | libs/stream-ui/src/components/LoadMore/LoadMoreButton.tsx                                                            | ☐ | |
| 063 | MediaRecorderController              | libs/stream-ui/src/components/MediaRecorder/classes/MediaRecorderController.ts                                       | ☐ | |
| 064 | useMediaRecorder                     | libs/stream-ui/src/components/MediaRecorder/hooks/useMediaRecorder.ts                                                | ☐ | |
| 065 | FixedHeightMessage                   | libs/stream-ui/src/components/Message/FixedHeightMessage.tsx                                                         | ☐ | |
| 066 | MessageDeleted                       | libs/stream-ui/src/components/Message/MessageDeleted.tsx                                                             | ☐ | |
| 067 | MessageErrorText                     | libs/stream-ui/src/components/Message/MessageErrorText.tsx                                                           | ☐ | |
| 068 | MessageText                          | libs/stream-ui/src/components/Message/MessageText.tsx                                                                | ☐ | |
| 069 | MessageThreadReplyInChannelButtonIndicator | libs/stream-ui/src/components/Message/MessageThreadReplyInChannelButtonIndicator.tsx                           | ☐ | |
| 070 | MessageTimestamp                     | libs/stream-ui/src/components/Message/MessageTimestamp.tsx                                                           | ☐ | |
| 071 | QuotedMessage                        | libs/stream-ui/src/components/Message/QuotedMessage.tsx                                                              | ☐ | |
| 072 | ReminderNotification                 | libs/stream-ui/src/components/Message/ReminderNotification.tsx                                                       | ☐ | |
| 073 | ReminderNotification.test            | libs/stream-ui/src/components/Message/__tests__/ReminderNotification.test.js                                         | ☐ | |
| 074 | useActionHandler                     | libs/stream-ui/src/components/Message/hooks/useActionHandler.ts                                                      | ☐ | |
| 075 | useDeleteHandler                     | libs/stream-ui/src/components/Message/hooks/useDeleteHandler.ts                                                      | ☐ | |
| 076 | useFlagHandler                       | libs/stream-ui/src/components/Message/hooks/useFlagHandler.ts                                                        | ☐ | |
| 077 | useMarkUnreadHandler                 | libs/stream-ui/src/components/Message/hooks/useMarkUnreadHandler.ts                                                  | ☐ | |
| 078 | useMentionsHandler                   | libs/stream-ui/src/components/Message/hooks/useMentionsHandler.ts                                                    | ☐ | |
| 079 | useMessageReminder                   | libs/stream-ui/src/components/Message/hooks/useMessageReminder.ts                                                    | ☐ | |
| 080 | useMuteHandler                       | libs/stream-ui/src/components/Message/hooks/useMuteHandler.ts                                                        | ☐ | |
| 081 | useOpenThreadHandler                 | libs/stream-ui/src/components/Message/hooks/useOpenThreadHandler.ts                                                  | ☐ | |
| 082 | usePinHandler                        | libs/stream-ui/src/components/Message/hooks/usePinHandler.ts                                                         | ☐ | |
| 083 | useReactionHandler                   | libs/stream-ui/src/components/Message/hooks/useReactionHandler.ts                                                    | ☐ | |
| 084 | useReactionsFetcher                  | libs/stream-ui/src/components/Message/hooks/useReactionsFetcher.ts                                                   | ☐ | |
| 085 | useUserHandler                       | libs/stream-ui/src/components/Message/hooks/useUserHandler.ts                                                        | ☐ | |
| 086 | useUserRole                          | libs/stream-ui/src/components/Message/hooks/useUserRole.ts                                                           | ☐ | |
| 087 | Mention                              | libs/stream-ui/src/components/Message/renderText/componentRenderers/Mention.tsx                                      | ☐ | |
| 088 | mentionsMarkdownPlugin               | libs/stream-ui/src/components/Message/renderText/rehypePlugins/mentionsMarkdownPlugin.ts                             | ☐ | |
| 089 | renderText                           | libs/stream-ui/src/components/Message/renderText/renderText.tsx                                                      | ☐ | |
| 090 | message-types                        | libs/stream-ui/src/components/Message/types.ts                                                                       | ☐ | |
| 091 | message-utils                        | libs/stream-ui/src/components/Message/utils.tsx                                                                      | ☐ | |
| 092 | CustomMessageActionsList             | libs/stream-ui/src/components/MessageActions/CustomMessageActionsList.tsx                                            | ☐ | |
| 093 | AttachmentPreviewList                | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/AttachmentPreviewList.tsx                           | ☐ | |
| 094 | FileAttachmentPreview                | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/FileAttachmentPreview.tsx                          | ☐ | |
| 095 | ImageAttachmentPreview               | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/ImageAttachmentPreview.tsx                         | ☐ | |
| 096 | UnsupportedAttachmentPreview         | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/UnsupportedAttachmentPreview.tsx                    | ☐ | |
| 097 | VoiceRecordingPreview                | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/VoiceRecordingPreview.tsx                           | ☐ | |
| 098 | attachmentPreview-types              | libs/stream-ui/src/components/MessageInput/AttachmentPreviewList/types.ts                                            | ☐ | |
| 099 | LinkPreviewList                      | libs/stream-ui/src/components/MessageInput/LinkPreviewList.tsx                                                       | ☐ | |
| 100 | MessageInput                         | libs/stream-ui/src/components/MessageInput/MessageInput.tsx                                                          | ☐ | |
| 101 | QuotedMessagePreview                 | libs/stream-ui/src/components/MessageInput/QuotedMessagePreview.tsx                                                  | ☐ | |
| 102 | SendButton                           | libs/stream-ui/src/components/MessageInput/SendButton.tsx                                                            | ☐ | |
| 103 | SendToChannelCheckbox                | libs/stream-ui/src/components/MessageInput/SendToChannelCheckbox.tsx                                                 | ☐ | |
| 104 | WithDragAndDropUpload                | libs/stream-ui/src/components/MessageInput/WithDragAndDropUpload.tsx                                                 | ☐ | |
| 105 | EditMessageForm.test                 | libs/stream-ui/src/components/MessageInput/__tests__/EditMessageForm.test.js                                         | ☐ | |
| 106 | LinkPreviewList.test                 | libs/stream-ui/src/components/MessageInput/__tests__/LinkPreviewList.test.js                                         | ☐ | |
| 107 | MessageInput.test                    | libs/stream-ui/src/components/MessageInput/__tests__/MessageInput.test.js                                            | ☐ | |
| 108 | ThreadMessageInput.test              | libs/stream-ui/src/components/MessageInput/__tests__/ThreadMessageInput.test.js                                      | ☐ | |
| 109 | useAttachmentManagerState            | libs/stream-ui/src/components/MessageInput/hooks/useAttachmentManagerState.ts                                        | ☐ | |
| 110 | useCooldownTimer                     | libs/stream-ui/src/components/MessageInput/hooks/useCooldownTimer.tsx                                                | ☐ | |
| 111 | useMessageComposer                   | libs/stream-ui/src/components/MessageInput/hooks/useMessageComposer.ts                                               | ☐ | |
| 112 | useMessageComposerHasSendableData    | libs/stream-ui/src/components/MessageInput/hooks/useMessageComposerHasSendableData.ts                                | ☐ | |
| 113 | useMessageInputControls              | libs/stream-ui/src/components/MessageInput/hooks/useMessageInputControls.ts                                          | ☐ | |
| 114 | useSubmitHandler                     | libs/stream-ui/src/components/MessageInput/hooks/useSubmitHandler.ts                                                 | ☐ | |
| 115 | ConnectionStatus                     | libs/stream-ui/src/components/MessageList/ConnectionStatus.tsx                                                       | ☐ | |
| 116 | GiphyPreviewMessage                  | libs/stream-ui/src/components/MessageList/GiphyPreviewMessage.tsx                                                    | ☐ | |
| 117 | MessageList                          | libs/stream-ui/src/components/MessageList/MessageList.tsx                                                            | ☐ | |
| 118 | MessageNotification                  | libs/stream-ui/src/components/MessageList/MessageNotification.tsx                                                    | ☐ | |
| 119 | ScrollToBottomButton                 | libs/stream-ui/src/components/MessageList/ScrollToBottomButton.tsx                                                   | ☐ | |
| 120 | VirtualizedMessageList               | libs/stream-ui/src/components/MessageList/VirtualizedMessageList.tsx                                                 | ☐ | |
| 121 | VirtualizedMessageListComponents     | libs/stream-ui/src/components/MessageList/VirtualizedMessageListComponents.tsx                                       | ☐ | |
| 122 | useEnrichedMessages                  | libs/stream-ui/src/components/MessageList/hooks/MessageList/useEnrichedMessages.ts                                   | ☐ | |
| 123 | useMessageListElements               | libs/stream-ui/src/components/MessageList/hooks/MessageList/useMessageListElements.tsx                               | ☐ | |
| 124 | useMessageListScrollManager          | libs/stream-ui/src/components/MessageList/hooks/MessageList/useMessageListScrollManager.ts                           | ☐ | |
| 125 | useScrollLocationLogic               | libs/stream-ui/src/components/MessageList/hooks/MessageList/useScrollLocationLogic.tsx                               | ☐ | |
| 126 | useGiphyPreview                      | libs/stream-ui/src/components/MessageList/hooks/VirtualizedMessageList/useGiphyPreview.ts                            | ☐ | |
| 127 | useMessageSetKey                     | libs/stream-ui/src/components/MessageList/hooks/VirtualizedMessageList/useMessageSetKey.ts                           | ☐ | |
| 128 | useNewMessageNotification            | libs/stream-ui/src/components/MessageList/hooks/VirtualizedMessageList/useNewMessageNotification.ts                  | ☐ | |
| 129 | useShouldForceScrollToBottom         | libs/stream-ui/src/components/MessageList/hooks/VirtualizedMessageList/useShouldForceScrollToBottom.ts               | ☐ | |
| 130 | useUnreadMessagesNotificationVirtualized | libs/stream-ui/src/components/MessageList/hooks/VirtualizedMessageList/useUnreadMessagesNotificationVirtualized.ts | ☐ | |
| 131 | useLastReadData                      | libs/stream-ui/src/components/MessageList/hooks/useLastReadData.ts                                                   | ☐ | |
| 132 | useMarkRead                          | libs/stream-ui/src/components/MessageList/hooks/useMarkRead.ts                                                       | ☐ | |
| 133 | renderMessages                       | libs/stream-ui/src/components/MessageList/renderMessages.tsx                                                         | ☐ | |
| 134 | messageList-utils                    | libs/stream-ui/src/components/MessageList/utils.ts                                                                   | ☐ | |
| 135 | useNotifications                     | libs/stream-ui/src/components/Notifications/hooks/useNotifications.ts                                                | ☐ | |
| 136 | Poll                                 | libs/stream-ui/src/components/Poll/Poll.tsx                                                                          | ☐ | |
| 137 | AddCommentForm                       | libs/stream-ui/src/components/Poll/PollActions/AddCommentForm.tsx                                                    | ☐ | |
| 138 | PollActions                          | libs/stream-ui/src/components/Poll/PollActions/PollActions.tsx                                                       | ☐ | |
| 139 | PollAnswerList                       | libs/stream-ui/src/components/Poll/PollActions/PollAnswerList.tsx                                                   | ☐ | |
| 140 | PollOptionsFullList                  | libs/stream-ui/src/components/Poll/PollActions/PollOptionsFullList.tsx                                              | ☐ | |
| 141 | PollOptionVotesList                  | libs/stream-ui/src/components/Poll/PollActions/PollResults/PollOptionVotesList.tsx                                    | ☐ | |
| 142 | PollOptionWithLatestVotes            | libs/stream-ui/src/components/Poll/PollActions/PollResults/PollOptionWithLatestVotes.tsx                             | ☐ | |
| 143 | PollOptionWithVotesHeader            | libs/stream-ui/src/components/Poll/PollActions/PollResults/PollOptionWithVotesHeader.tsx                             | ☐ | |
| 144 | PollResults                          | libs/stream-ui/src/components/Poll/PollActions/PollResults/PollResults.tsx                                           | ☐ | |
| 145 | SuggestPollOptionForm                | libs/stream-ui/src/components/Poll/PollActions/SuggestPollOptionForm.tsx                                             | ☐ | |
| 146 | PollContent                          | libs/stream-ui/src/components/Poll/PollContent.tsx                                                                   | ☐ | |
| 147 | MultipleAnswersField                 | libs/stream-ui/src/components/Poll/PollCreationDialog/MultipleAnswersField.tsx                                       | ☐ | |
| 148 | NameField                            | libs/stream-ui/src/components/Poll/PollCreationDialog/NameField.tsx                                                  | ☐ | |
| 149 | OptionFieldSet                       | libs/stream-ui/src/components/Poll/PollCreationDialog/OptionFieldSet.tsx                                             | ☐ | |
| 150 | PollCreationDialog                   | libs/stream-ui/src/components/Poll/PollCreationDialog/PollCreationDialog.tsx                                         | ☐ | |
| 151 | PollHeader                           | libs/stream-ui/src/components/Poll/PollHeader.tsx                                                                    | ☐ | |
| 152 | PollOptionList                       | libs/stream-ui/src/components/Poll/PollOptionList.tsx                                                                | ☐ | |
| 153 | PollOptionSelector                   | libs/stream-ui/src/components/Poll/PollOptionSelector.tsx                                                            | ☐ | |
| 154 | PollVote                             | libs/stream-ui/src/components/Poll/PollVote.tsx                                                                      | ☐ | |
| 155 | QuotedPoll                           | libs/stream-ui/src/components/Poll/QuotedPoll.tsx                                                                    | ☐ | |
| 156 | AddCommentForm.test                  | libs/stream-ui/src/components/Poll/__tests__/AddCommentForm.test.js                                                  | ☐ | |
| 157 | Poll.test                            | libs/stream-ui/src/components/Poll/__tests__/Poll.test.js                                                            | ☐ | |
| 158 | PollActions.test                     | libs/stream-ui/src/components/Poll/__tests__/PollActions.test.js                                                     | ☐ | |
| 159 | PollHeader.test                      | libs/stream-ui/src/components/Poll/__tests__/PollHeader.test.js                                                      | ☐ | |
| 160 | PollOptionList.test                  | libs/stream-ui/src/components/Poll/__tests__/PollOptionList.test.js                                                  | ☐ | |
| 161 | SuggestPollOptionForm.test           | libs/stream-ui/src/components/Poll/__tests__/SuggestPollOptionForm.test.js                                           | ☐ | |
| 162 | useManagePollVotesRealtime           | libs/stream-ui/src/components/Poll/hooks/useManagePollVotesRealtime.ts                                               | ☐ | |
| 163 | usePollAnswerPagination              | libs/stream-ui/src/components/Poll/hooks/usePollAnswerPagination.ts                                                  | ☐ | |
| 164 | usePollOptionVotesPagination         | libs/stream-ui/src/components/Poll/hooks/usePollOptionVotesPagination.ts                                             | ☐ | |
| 165 | UploadButton                         | libs/stream-ui/src/components/ReactFileUtilities/UploadButton.tsx                                                    | ☐ | |
| 166 | ReactionSelector                     | libs/stream-ui/src/components/Reactions/ReactionSelector.tsx                                                         | ☐ | |
| 167 | ReactionsList                        | libs/stream-ui/src/components/Reactions/ReactionsList.tsx                                                            | ☐ | |
| 168 | ReactionsListModal                   | libs/stream-ui/src/components/Reactions/ReactionsListModal.tsx                                                       | ☐ | |
| 169 | SimpleReactionsList                  | libs/stream-ui/src/components/Reactions/SimpleReactionsList.tsx                                                      | ☐ | |
| 170 | useFetchReactions                    | libs/stream-ui/src/components/Reactions/hooks/useFetchReactions.ts                                                   | ☐ | |
| 171 | reactions-types                      | libs/stream-ui/src/components/Reactions/types.ts                                                                     | ☐ | |
| 172 | CommandItem                          | libs/stream-ui/src/components/TextareaComposer/SuggestionList/CommandItem.tsx                                        | ☐ | |
| 173 | SuggestionList                       | libs/stream-ui/src/components/TextareaComposer/SuggestionList/SuggestionList.tsx                                     | ☐ | |
| 174 | SuggestionListItem                   | libs/stream-ui/src/components/TextareaComposer/SuggestionList/SuggestionListItem.tsx                                 | ☐ | |
| 175 | UserItem                             | libs/stream-ui/src/components/TextareaComposer/SuggestionList/UserItem.tsx                                           | ☐ | |
| 176 | TextareaComposer                     | libs/stream-ui/src/components/TextareaComposer/TextareaComposer.tsx                                                  | ☐ | |
| 177 | LegacyThreadContext                  | libs/stream-ui/src/components/Thread/LegacyThreadContext.ts                                                          | ☐ | |
| 178 | Thread                               | libs/stream-ui/src/components/Thread/Thread.tsx                                                                      | ☐ | |
| 179 | ThreadHeader                         | libs/stream-ui/src/components/Thread/ThreadHeader.tsx                                                                | ☐ | |
| 180 | ThreadContext                        | libs/stream-ui/src/components/Threads/ThreadContext.tsx                                                              | ☐ | |
| 181 | ThreadList                           | libs/stream-ui/src/components/Threads/ThreadList/ThreadList.tsx                                                      | ☐ | |
| 182 | ThreadListItem                       | libs/stream-ui/src/components/Threads/ThreadList/ThreadListItem.tsx                                                  | ☐ | |
| 183 | ThreadListItemUI                     | libs/stream-ui/src/components/Threads/ThreadList/ThreadListItemUI.tsx                                                | ☐ | |
| 184 | ThreadListLoadingIndicator           | libs/stream-ui/src/components/Threads/ThreadList/ThreadListLoadingIndicator.tsx                                      | ☐ | |
| 185 | ThreadListUnseenThreadsBanner        | libs/stream-ui/src/components/Threads/ThreadList/ThreadListUnseenThreadsBanner.tsx                                   | ☐ | |
| 186 | useThreadManagerState                | libs/stream-ui/src/components/Threads/hooks/useThreadManagerState.ts                                                 | ☐ | |
| 187 | useThreadState                       | libs/stream-ui/src/components/Threads/hooks/useThreadState.ts                                                        | ☐ | |
| 188 | Window                               | libs/stream-ui/src/components/Window/Window.tsx                                                                      | ☐ | |
| 189 | ChannelActionContext                 | libs/stream-ui/src/context/ChannelActionContext.tsx                                                                  | ☐ | |
| 190 | ChannelListContext                   | libs/stream-ui/src/context/ChannelListContext.tsx                                                                    | ☐ | |
| 191 | ChannelStateContext                  | libs/stream-ui/src/context/ChannelStateContext.tsx                                                                   | ☐ | |
| 192 | ChatContext                          | libs/stream-ui/src/context/ChatContext.tsx                                                                           | ☐ | |
| 193 | ComponentContext                     | libs/stream-ui/src/context/ComponentContext.tsx                                                                      | ☐ | |
| 194 | MessageBounceContext                 | libs/stream-ui/src/context/MessageBounceContext.tsx                                                                  | ☐ | |
| 195 | MessageContext                       | libs/stream-ui/src/context/MessageContext.tsx                                                                        | ☐ | |
| 196 | PollContext                          | libs/stream-ui/src/context/PollContext.tsx                                                                           | ☐ | |
| 197 | TranslationContext                   | libs/stream-ui/src/context/TranslationContext.tsx                                                                    | ☐ | |
| 198 | TypingContext                        | libs/stream-ui/src/context/TypingContext.tsx                                                                         | ☐ | |
| 199 | MessageActions                       | libs/stream-ui/src/experimental/MessageActions/MessageActions.tsx                                                    | ☐ | |
| 200 | Search                               | libs/stream-ui/src/experimental/Search/Search.tsx                                                                    | ☐ | |
| 201 | SearchBar                            | libs/stream-ui/src/experimental/Search/SearchBar/SearchBar.tsx                                                       | ☐ | |
| 202 | SearchContext                        | libs/stream-ui/src/experimental/Search/SearchContext.tsx                                                             | ☐ | |
| 203 | SearchResultItem                     | libs/stream-ui/src/experimental/Search/SearchResults/SearchResultItem.tsx                                            | ☐ | |
| 204 | SearchResults                        | libs/stream-ui/src/experimental/Search/SearchResults/SearchResults.tsx                                               | ☐ | |
| 205 | SearchResultsHeader                  | libs/stream-ui/src/experimental/Search/SearchResults/SearchResultsHeader.tsx                                         | ☐ | |
| 206 | SearchResultsPresearch               | libs/stream-ui/src/experimental/Search/SearchResults/SearchResultsPresearch.tsx                                      | ☐ | |
| 207 | SearchSourceResultList               | libs/stream-ui/src/experimental/Search/SearchResults/SearchSourceResultList.tsx                                      | ☐ | |
| 208 | SearchSourceResultListFooter         | libs/stream-ui/src/experimental/Search/SearchResults/SearchSourceResultListFooter.tsx                                | ☐ | |
| 209 | SearchSourceResults                  | libs/stream-ui/src/experimental/Search/SearchResults/SearchSourceResults.tsx                                         | ☐ | |
| 210 | SearchSourceResultsContext           | libs/stream-ui/src/experimental/Search/SearchSourceResultsContext.tsx                                                | ☐ | |
| 211 | SearchResultItem.test                | libs/stream-ui/src/experimental/Search/__tests__/SearchResultItem.test.js                                            | ☐ | |
| 212 | useSearchFocusedMessage              | libs/stream-ui/src/experimental/Search/hooks/useSearchFocusedMessage.ts                                              | ☐ | |
| 213 | useSearchQueriesInProgress           | libs/stream-ui/src/experimental/Search/hooks/useSearchQueriesInProgress.ts                                           | ☐ | |
| 214 | Streami18n                           | libs/stream-ui/src/i18n/Streami18n.ts                                                                                | ☐ | |
| 215 | NotificationTranslationTopic         | libs/stream-ui/src/i18n/TranslationBuilder/notifications/NotificationTranslationTopic.ts                              | ☐ | |
| 216 | notification-types                   | libs/stream-ui/src/i18n/TranslationBuilder/notifications/types.ts                                                    | ☐ | |
| 217 | draftDeleted                         | libs/stream-ui/src/mock-builders/event/draftDeleted.ts                                                               | ☐ | |
| 218 | draftUpdated                         | libs/stream-ui/src/mock-builders/event/draftUpdated.ts                                                               | ☐ | |
| 219 | messageDraft                         | libs/stream-ui/src/mock-builders/generator/messageDraft.ts                                                           | ☐ | |
| 220 | reminder                             | libs/stream-ui/src/mock-builders/generator/reminder.ts                                                               | ☐ | |
| 221 | mock-index                           | libs/stream-ui/src/mock-builders/index.js                                                                            | ☐ | |
| 222 | textComposerEmojiMiddleware          | libs/stream-ui/src/plugins/Emojis/middleware/textComposerEmojiMiddleware.ts                                          | ☐ | |
| 223 | useStateStore                        | libs/stream-ui/src/store/hooks/useStateStore.ts                                                                      | ☐ | |
| 224 | add-message.stories                  | libs/stream-ui/src/stories/add-message.stories.tsx                                                                   | ☐ | |
| 225 | attachment-sizing.stories            | libs/stream-ui/src/stories/attachment-sizing.stories.tsx                                                             | ☐ | |
| 226 | edit-message.stories                 | libs/stream-ui/src/stories/edit-message.stories.tsx                                                                  | ☐ | |
| 227 | hello.stories                        | libs/stream-ui/src/stories/hello.stories.tsx                                                                         | ☐ | |
| 228 | mark-read.stories                    | libs/stream-ui/src/stories/mark-read.stories.tsx                                                                     | ☐ | |
| 229 | message-status-readby-tooltip.stories | libs/stream-ui/src/stories/message-status-readby-tooltip.stories.tsx                                                 | ☐ | |
| 230 | navigate-long-message-lists.stories  | libs/stream-ui/src/stories/navigate-long-message-lists.stories.tsx                                                   | ☐ | |
| 231 | stories-utils                        | libs/stream-ui/src/stories/utils.tsx                                                                                 | ☐ | |
| 232 | stream-types                         | libs/stream-ui/src/types/types.ts                                                                                    | ☐ | |
| 233 | getChannel                           | libs/stream-ui/src/utils/getChannel.ts                                                                               | ☐ | |
