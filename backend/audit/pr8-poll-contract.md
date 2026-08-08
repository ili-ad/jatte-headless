# PR8 poll contract and room-authorization design

## Production route inventory

`jatte.urls` includes `stream_server_django.chat.urls` before
`stream_server_django.polls.urls`, but the families do not collide because the
former is under `/api/polls/` and the latter is under `/polls/`.

| Route | Methods | Production view | Model after PR8 | Successful shape | Caller / status |
| --- | --- | --- | --- | --- | --- |
| `/polls/` | GET, POST | `polls.PollListCreateView` | `polls.Poll` | GET `{results, next}`; POST `{poll}` | Direct frontend composer and canonical API |
| `/polls/<poll_id>/` | DELETE | `polls.PollDetailView` | `polls.Poll` | empty 204 | Direct frontend composer; canonical delete |
| `/polls/<poll_id>/options/` | POST | `polls.PollOptionCreateView` | `polls.PollOption` | `{option}` | Canonical API |
| `/polls/<poll_id>/answers/` | POST | `polls.PollAnswerCreateView` | `polls.PollAnswer` | `{answer}` | Poll answer contract |
| `/polls/<poll_id>/options/<option_id>/votes/` | GET, POST, DELETE | `polls.PollVoteView` | `polls.PollVote` | GET `{results, count, next}`; mutations preserve the existing vote payload | Stream-compatible vote contract |
| `/api/polls/` | GET, POST | `chat.PollListCreateView` compatibility adapter | `polls.Poll` | legacy GET list and POST `{poll}` | `apiFetch(API.POLLS)` frontend path |
| `/api/polls/<poll_id>/` | DELETE | `chat.PollDetailView` compatibility adapter | `polls.Poll` | empty 204 | channel poll composer |
| `/api/polls/<poll_id>/options/` | POST | `chat.PollOptionCreateView` compatibility adapter | `polls.PollOption` | `{poll_option}` | `createPollOption` shims |
| `/api/polls/<poll_id>/options/<option_id>/votes/` | GET | `chat.PollOptionVotesListView` compatibility adapter | `polls.PollVote` | `{results, count, next?, prev?}` | `queryOptionVotes` shim |

Trailing-slash redirects may be provided by Django's `APPEND_SLASH`; the
effective views after redirect are the same room-authorized views above.
There is no production `/api/polls/<id>/answers/` route. The shim's local
answer fallback does not make an HTTP call unless a poll object supplies one.

## Active contract decision

The richer `stream_server_django.polls` implementation is canonical. Both
route families are currently reachable and frontend code calls both. The
legacy `stream_server_django.chat` poll tables may contain historical data,
but their models cannot express a room boundary and are no longer used by any
externally reachable poll view. `/api/polls/**` is therefore a response-shape
compatibility adapter over the canonical room-bound implementation.

Consolidation does not rename poll/option IDs, CID, question text, vote fields,
`{results, next}`, counts, or poll event names. Poll creation now requires a
CID because a room cannot be safely inferred from authentication or a global
client. Channel frontend callers now include their existing canonical CID.

## Room binding and authorization

`polls.Poll.room` is the authoritative parent. The externally visible CID is
derived from `poll.room.cid`; request data and stale database CID values are
never used for event routing after a poll is resolved.

- List/create resolves an existing room and applies the PR3 room-access policy.
- Direct poll IDs load only non-orphan polls and return 404 to callers without
  owning-room access.
- Option, answer, vote, count, and cursor operations authorize the poll room
  before accessing descendants.
- Poll-list cursors carry the room scope. Vote cursors carry poll and option
  scope. A cursor from another scope is rejected before any rows/counts are
  returned.
- Delete is allowed to staff/superusers, the room agent, or the poll creator
  while the creator still has room access. Other participants receive 403;
  non-members receive 404.
- Vote events use `poll.room.cid`. Denied requests perform no writes or
  broadcasts.

## Existing data and migration treatment

This repository contains no tracked SQLite database and provides no production
database credential or operator connection in the checkout, so production row
counts cannot be queried from this development environment. Migration
`polls.0002_poll_room` handles the unknown inventory deterministically:

1. normalize each existing canonical poll CID;
2. bind it only when an already-existing `chat.Room.uuid` matches;
3. canonicalize the stored CID from that room;
4. preserve unmatched polls with `room = NULL`.

The migration never creates rooms and never deletes poll data. Preserved
orphans are excluded from every externally reachable poll operation pending
operator adjudication. Legacy `chat.Poll` rows are likewise preserved in their
tables but retired from external request handling; no destructive data
migration is performed.

## Event contract

Existing `poll.vote_casted`, `poll.vote_changed`, and `poll.vote_removed`
payload names and vote fields remain intact. The payload CID and channel-layer
group are derived exclusively from the bound room. Poll creation, option
creation, and answer creation currently emit no producer events, so their
denied paths have no broadcast side effect to suppress.
