# Channel audit: generic messaging vs agent behavior

## Overview
`frontend/src/lib/stream-adapter/Channel.ts` implements a Stream Chat–style channel that the shim-based UI components talk to. It wraps HTTP calls and websocket events from the backend, keeps local message/read/typing state in `stateStore`, exposes a `messageComposer` MiniStore for the message input, and layers in optional agent behavior (agent room auto-reply, agent typing indicators, bot naming).【F:frontend/src/lib/stream-adapter/Channel.ts†L1-L204】【F:frontend/src/lib/stream-adapter/Channel.ts†L803-L929】

## Generic messaging responsibilities
These methods represent vendor-core chat behavior with no agent assumptions. They handle message flows, read state, moderation, and related channel state.

- **Fetch & lifecycle**
  - `query`, `watch`, `getConfig`, `getConfigState`: fetch channel data/history, hydrate members/typing/read maps, and return composer/config flags. `getConfig` simply returns the latest config snapshot for Stream UI while `getConfigState` refreshes config via the backend.【F:frontend/src/lib/stream-adapter/Channel.ts†L803-L842】【F:frontend/src/lib/stream-adapter/Channel.ts†L1649-L1818】
- **Read state**
  - `read`, `markRead`, `markUnread`, `countUnread`, `lastRead`, `handleMessageReadEvent`: pull current read receipts from `/read/`, throttle backend `mark_read` updates, clear unread counts locally, and apply websocket read events into `stateStore`.【F:frontend/src/lib/stream-adapter/Channel.ts†L842-L953】
- **Typing (human users)**
  - `keystroke`, `stopTyping`, `simulateTypingStart`, `simulateTypingStop`, `applyTypingEvent`: emit local typing events, auto-stop after timeouts, and reconcile incoming typing events into the typing map in `stateStore`. These do not require agents; they are general typing indicator plumbing.【F:frontend/src/lib/stream-adapter/Channel.ts†L953-L1120】【F:frontend/src/lib/stream-adapter/Channel.ts†L1237-L1337】
- **Message operations**
  - `sendMessage`, `deleteMessage`, `updateMessage`, `editedMessage`, `restore`: create, soft-delete, edit, and restore messages via the backend, reconciling optimistic echoes against server payloads and updating `messages`/`latestMessages`.【F:frontend/src/lib/stream-adapter/Channel.ts†L1338-L1533】【F:frontend/src/lib/stream-adapter/Channel.ts†L1819-L2070】
- **Reactions & threads**
  - `sendReaction`, `deleteReaction`, `queryReactions`, `getReplies`: call backend endpoints to add/remove reactions and fetch reaction pages or thread replies, updating local message state accordingly.【F:frontend/src/lib/stream-adapter/Channel.ts†L2071-L2327】
- **Moderation & channel state**
  - `flagMessage`, `pin`, `unpin`, `pinnedMessages`, `archive`, `unarchive`, `hide`, `show`, `truncate`, `cooldown`: manage moderation flags, pinned message lists, archival/visibility, truncation, and cooldown metadata using REST endpoints and local state updates. These operations are independent of agent flows.【F:frontend/src/lib/stream-adapter/Channel.ts†L2328-L2719】

## Composer & config responsibilities
`Channel` exposes a `messageComposer` MiniStore that mirrors Stream’s `MessageInput` contract. It tracks input state and provides send hooks.

- **MiniStore responsibilities**
  - Tracks composer state: text + selection, quoted message, thread id, reply-in-channel flag, attachments via `buildAttachmentManager`, link previews, poll drafts, and arbitrary custom data. Local drafts persist to `localStorage` and can sync to backend draft endpoints.【F:frontend/src/lib/stream-adapter/Channel.ts†L32-L803】
  - Provides editing audit timestamps and a `sendEditingAuditState` helper that posts audit metadata to the backend, plus `logDraftUpdateTimestamp`/`logStateUpdateTimestamp` timestamps to mirror Stream behavior.【F:frontend/src/lib/stream-adapter/Channel.ts†L52-L269】
  - Supplies text composer methods (`setText`, `handleChange`, `submit`, `compose`) that create optimistic messages with `client_generated_id`, emit local `MESSAGE_NEW` events, and delegate to `Channel.sendMessage` for the actual network call.【F:frontend/src/lib/stream-adapter/Channel.ts†L248-L489】【F:frontend/src/lib/stream-adapter/Channel.ts†L1338-L1432】
  - Exposes helper methods required by `MessageInput`: `hasSendableData`, `registerSubscriptions`, `createDraft`/`discardDraft`, `getDraft`, quoted-message setters, thread id setters, and `initState`/`clear` to reset composer state.【F:frontend/src/lib/stream-adapter/Channel.ts†L489-L803】
- **Config state**
  - `messageComposer.getConfigState` (called through `Channel.getConfigState`) hits `/rooms/<uuid>/config-state/` with the user’s JWT, merges backend composer flags (max length, uploads, cooldowns) into the local config store, and caches the promise to avoid duplicate fetches.【F:frontend/src/lib/stream-adapter/Channel.ts†L1649-L1766】

**Vendor-friendly portions:** the composer’s text/attachment/poll/custom data tracking, draft persistence, and config flags for message limits/uploads/cooldown are generic messaging concerns suitable for a vendor-core channel.

**Agent-leaking portions:** config-state also carries `ai_assistant` and agent persona flags (parsed via `extractRoomAgentConfig`), and the composer stores these alongside generic config; these fields are specific to agent-enabled rooms and would need isolation in a future split.【F:frontend/src/lib/stream-adapter/Channel.ts†L1669-L1766】

## Agent-specific responsibilities
These behaviors are tied to the agent lab flow and should not be assumed in generic deployments.

- **Auto-reply trigger**
  - `triggerAgentReplyIfEnabled` watches for new messages in the `agent-lab` room (`uuid === 'agent-lab'`/`cid === 'messaging:agent-lab'`). It checks `ChatClient.getAIState` to avoid overlapping replies, loads bot config via `extractRoomAgentConfig`, skips messages authored by the bot, starts bot typing, calls `invokeAgent` to fetch agent responses, integrates returned messages, and stops typing when complete.【F:frontend/src/lib/stream-adapter/Channel.ts†L1121-L1337】
- **AI typing simulation**
  - `startAgentTyping`/`stopAgentTyping` and `simulateTypingStart/Stop` set typing timers for the agent user, updating the `typing` map so the UI shows bot typing while agent replies are pending.【F:frontend/src/lib/stream-adapter/Channel.ts†L953-L1120】
- **Bot identity & naming**
  - `getBotUserId` reads bot identity from cached agent config or config-state, and `resolveDisplayName` normalizes names so the bot appears as “AI assistant” while the current user is rendered as “You”.【F:frontend/src/lib/stream-adapter/Channel.ts†L271-L328】【F:frontend/src/lib/stream-adapter/Channel.ts†L1802-L1848】
- **Agent config in composer/config**
  - `getConfigState` merges agent persona fields (`ai_assistant`, `has_ai_assistant`) into the composer config store alongside generic flags, enabling agent-aware UI hints.【F:frontend/src/lib/stream-adapter/Channel.ts†L1669-L1766】

These are agent-only extensions layered atop the generic channel plumbing and should be optional or isolated in any vendor-core split.

## Future work
A future refactor could separate `Channel` into:

- **ChannelCore:** message queries, message send/edit/delete/restore, reactions/threads, read state, moderation & visibility operations, cooldown handling, and the composer plus generic config-state (text/attachments/cooldowns/uploads/polls/custom data, drafts, audit timestamps).
- **AgentExtensions:** agent-lab auto-replies, bot typing simulation, bot identity/name normalization, agent persona/config hydration, and any AI state linkage to `ChatClient` events.

This ticket is documentation-only; no code changes were made beyond adding these notes.
