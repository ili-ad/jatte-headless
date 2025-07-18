export const API = {
  SYNC_USER: '/sync-user/',
  SESSION: '/session/',
  CLIENT_ID: '/client-id/',
  CONNECTION_ID: '/connection-id/',
  ROOMS: '/rooms/',
  ACTIVE_ROOMS: '/rooms/active/',
  MESSAGES: '/messages/',
  APP_SETTINGS: '/app-settings/',
  MARK_UNREAD: '/rooms/',
  USERS: '/users/',
  USER: '/user/',
  USER_AGENT: '/core-user-agent/',
  NOTIFICATIONS: '/notifications/',
  POLLS: '/polls/',
  REMINDERS: '/reminders/',
  THREADS: '/threads/',
  LINK_PREVIEW: '/link-preview/',
  COOLDOWN: '/rooms/',
  MUTE_STATUS: '/mute-status/',
  MUTED_USERS: '/muted-users/',
  MUTED_CHANNELS: '/muted-channels/',
  MUTE_USER: '/mute/',
  UNMUTE_USER: '/unmute/',
  RECOVER_STATE: '/recover-state/',
  REFRESH_TOKEN: '/refresh-token/',
  SUBARRAY: '/subarray/',
  EDITING_AUDIT_STATE: '/editing-audit-state/',
  WS_AUTH: '/ws-auth/',
  ATTACHMENTS: '/attachments/',
  DISCONNECTED: '/disconnected/',
  INITIALIZED: '/initialized/',
  LISTENERS: '/listeners/',
  DISPATCH_EVENT: '/dispatch-event/',
  REGISTER_SUBSCRIPTIONS: '/register-subscriptions/',
  QUOTED_MESSAGE: '/quoted-message/',
} as const;

export const EVENTS = {
  MESSAGE_NEW: 'message.new',
  SETTINGS_UPDATED: 'settings.updated',
} as const;

