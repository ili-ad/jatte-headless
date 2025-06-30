You are an expert at wiring front-end chat SDK shims to a Django-DRF backend.

Below is:
1. A list of **stub tokens** that appear in the React code as  
   `// TODO backend-wire-up:<token>`
client.on
client.off
channel.on
channel.off
sendMessage
client.channel
deleteMessage
channel.query
channel.state.loadMessageIntoState
truncate
channel.watch
polls.fromState
client.queryChannels
search
lastRead
connectUser
disconnectUser
channel.getClient
channel.countUnread
channel.muteStatus
castVote
on
client.threads.deactivate
addError
findMessage
pinMessage
unpinMessage
muteUser
unmuteUser
queryReactions
flagMessage
sendReaction
deleteReaction
markUnread
sendAction
stopAIResponse
getDraft
stopTyping
client.threads.state
channel.markRead
client.deleteMessage
channel.sendMessage
channel.getReplies
client.updateMessage
countUnread
reminders.deleteReminder
reminders.createReminder
reminders.scheduledOffsetsMs
reminders.upsertReminder
getAppSettings
getUserAgent
setUserAgent
threads.registerSubscriptions
polls.registerSubscriptions
reminders.registerSubscriptions
reminders.initTimers
threads.unregisterSubscriptions
polls.unregisterSubscriptions
reminders.unregisterSubscriptions
reminders.clearTimers
query
channel.unpin
channel.pin
channel.unarchive
channel.archive
removeVote
on(poll.vote_casted)
on(poll.vote_removed)
on(poll.vote_changed)
queryAnswers
queryOptionVotes
createPollOption
addAnswer
close
client.queryUsers
client.threads.activate
client.threads.loadNextPage
client.threads.reload
notifications.store
client.reminders.deleteReminder
client.reminders.createReminder


2. The full **OpenAPI 3** spec for the backend.

available here: openapi/frontend-openapi-spec.yml

or 

components:
  schemas:
    Message:
      properties:
        body:
          readOnly: true
          type: string
        created_at:
          format: date-time
          readOnly: true
          type: string
        id:
          readOnly: true
          type: integer
        sent_by:
          readOnly: true
          type: string
        text:
          type: string
          writeOnly: true
      type: object
    User:
      properties:
        id:
          readOnly: true
          type: integer
        username:
          description: Required. 150 characters or fewer. Letters, digits and @/./+/-/_
            only.
          maxLength: 150
          pattern: ^[\w.@+-]+\z
          type: string
      required:
      - username
      type: object
info:
  title: ''
  version: ''
openapi: 3.1.0
paths:
  /:
    get:
      description: ''
      operationId: listindices
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - ''
  /about/:
    get:
      description: ''
      operationId: listabouts
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - about
  /api/app-settings/:
    get:
      description: ''
      operationId: listget_app_settings
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/client-id/:
    get:
      description: Return a random client identifier.
      operationId: listClientIDs
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/connection-id/:
    get:
      description: ''
      operationId: listconnection_ids
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/core-user-agent/:
    get:
      description: Return the User-Agent string sent by the client.
      operationId: listget_user_agents
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/disconnected/:
    get:
      description: Return whether the current user is marked as disconnected.
      operationId: listDisconnecteds
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/editing-audit-state/:
    post:
      description: Echo posted editing audit state after JWT auth.
      operationId: createediting_audit_state
      parameters: []
      requestBody:
        content:
          application/json:
            schema: {}
          application/x-www-form-urlencoded:
            schema: {}
          multipart/form-data:
            schema: {}
      responses:
        '201':
          content:
            application/json:
              schema: {}
          description: ''
      tags:
      - api
  /api/initialized/:
    get:
      description: Return whether the current user is marked as initialized.
      operationId: listInitializeds
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/refresh-token/:
    get:
      description: ''
      operationId: listRefreshTokens
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/register-subscriptions/:
    post:
      description: Register web push subscriptions and echo them back.
      operationId: createregister_subscriptions
      parameters: []
      requestBody:
        content:
          application/json:
            schema: {}
          application/x-www-form-urlencoded:
            schema: {}
          multipart/form-data:
            schema: {}
      responses:
        '201':
          content:
            application/json:
              schema: {}
          description: ''
      tags:
      - api
  /api/rooms/{cid}/config/:
    get:
      description: Return basic metadata for the given room.
      operationId: listRoomConfigs
      parameters:
      - description: ''
        in: path
        name: cid
        required: true
        schema:
          type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/rooms/{cid}/members/:
    get:
      description: Return paginated members for the room identified by cid.
      operationId: listRoomMembersCIDs
      parameters:
      - description: ''
        in: path
        name: cid
        required: true
        schema:
          type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/rooms/{cid}/messages/:
    get:
      description: List and create messages for a room.
      operationId: listMessages
      parameters:
      - description: ''
        in: path
        name: cid
        required: true
        schema:
          type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                items:
                  $ref: '#/components/schemas/Message'
                type: array
          description: ''
      tags:
      - api
    post:
      description: List and create messages for a room.
      operationId: createMessage
      parameters:
      - description: ''
        in: path
        name: cid
        required: true
        schema:
          type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Message'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Message'
          multipart/form-data:
            schema:
              $ref: '#/components/schemas/Message'
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Message'
          description: ''
      tags:
      - api
  /api/rooms/{room_uuid}/config-state/:
    get:
      description: Return message composer configuration for the room.
      operationId: listRoomConfigStates
      parameters:
      - description: ''
        in: path
        name: room_uuid
        required: true
        schema:
          type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/rooms/{room_uuid}/draft/:
    delete:
      description: Save and retrieve message drafts.
      operationId: destroyRoomDraft
      parameters:
      - description: ''
        in: path
        name: room_uuid
        required: true
        schema:
          type: string
      responses:
        '204':
          description: ''
      tags:
      - api
    get:
      description: Save and retrieve message drafts.
      operationId: listRoomDrafts
      parameters:
      - description: ''
        in: path
        name: room_uuid
        required: true
        schema:
          type: string
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
    post:
      description: Save and retrieve message drafts.
      operationId: createRoomDraft
      parameters:
      - description: ''
        in: path
        name: room_uuid
        required: true
        schema:
          type: string
      requestBody:
        content:
          application/json:
            schema: {}
          application/x-www-form-urlencoded:
            schema: {}
          multipart/form-data:
            schema: {}
      responses:
        '201':
          content:
            application/json:
              schema: {}
          description: ''
      tags:
      - api
  /api/session/:
    delete:
      description: ''
      operationId: destroySession
      parameters: []
      responses:
        '204':
          description: ''
      tags:
      - api
  /api/sync-user/:
    post:
      description: ''
      operationId: createSyncUser
      parameters: []
      requestBody:
        content:
          application/json:
            schema: {}
          application/x-www-form-urlencoded:
            schema: {}
          multipart/form-data:
            schema: {}
      responses:
        '201':
          content:
            application/json:
              schema: {}
          description: ''
      tags:
      - api
  /api/tag/:
    get:
      description: Return a constant tag value for tests.
      operationId: listget_tags
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/token/:
    get:
      description: Return the current user's ID and their Supabase access token.
      operationId: listTokens
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/user-agent/:
    get:
      description: ''
      operationId: listUserAgents
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
    post:
      description: ''
      operationId: createUserAgent
      parameters: []
      requestBody:
        content:
          application/json:
            schema: {}
          application/x-www-form-urlencoded:
            schema: {}
          multipart/form-data:
            schema: {}
      responses:
        '201':
          content:
            application/json:
              schema: {}
          description: ''
      tags:
      - api
  /api/user/:
    get:
      description: Return details for the current authenticated user.
      operationId: listCurrentUsers
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api
  /api/users/:
    get:
      description: ''
      operationId: listUsers
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items:
                  $ref: '#/components/schemas/User'
                type: array
          description: ''
      tags:
      - api
  /api/ws-auth/:
    get:
      description: Return a signed websocket URL for authenticated requests.
      operationId: listws_auths
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                items: {}
                type: array
          description: ''
      tags:
      - api



## Task
For every stub token that corresponds to a REST operation, produce a JSON
entry of the form:

```json
"stubToken": "operationId"


Save the output in /openapi/stub_map.json

---- TASK START ----
### Shim helper task: unmuteUser

**todo stubs in FE** 0

**Scope**
1. Extend or create **chatSDKShim.ts** so calls matching `unmuteUser` resolve.
2. Run a codemod (jscodeshift / sed) to remove **all** matching
3. No backend changes expected – just unit tests & lint.

Paste a single patch (multiple files welcome).
