export const API = {
  SYNC_USER: '/api/sync-user/',
  SESSION: '/api/session/',
  ROOMS: '/api/rooms/',
  ACTIVE_ROOMS: '/api/rooms/active/',
  MESSAGES: '/api/messages/',
  APP_SETTINGS: '/api/app-settings/',
  MARK_UNREAD: '/api/rooms/',
  USERS: '/api/users/',
  USER: '/api/user/',
  USER_AGENT: '/api/core-user-agent/',
  NOTIFICATIONS: '/api/notifications/',
  POLLS: '/api/polls/',
  REMINDERS: '/api/reminders/',
  THREADS: '/api/threads/',
  LINK_PREVIEW: '/api/link-preview/',
  COOLDOWN: '/api/rooms/',
  MUTE_STATUS: '/api/mute-status/',
  MUTED_USERS: '/api/muted-users/',
  MUTED_CHANNELS: '/api/muted-channels/',
  MUTE_USER: '/api/mute/',
  UNMUTE_USER: '/api/unmute/',
  RECOVER_STATE: '/api/recover-state/',
  REFRESH_TOKEN: '/api/refresh-token/',
  SUBARRAY: '/api/subarray/',
  WS_AUTH: '/api/ws-auth/',
} as const;

export const EVENTS = {
  MESSAGE_NEW: 'message.new',
  SETTINGS_UPDATED: 'settings.updated',
} as const;

