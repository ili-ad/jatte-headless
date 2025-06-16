export const API = {
  SYNC_USER: '/api/sync-user/',
  SESSION: '/api/session/',
  ROOMS: '/api/rooms/',
  MESSAGES: '/api/messages/',
  APP_SETTINGS: '/api/app-settings/',
  MARK_UNREAD: '/api/rooms/',
  USERS: '/api/users/',
  USER_AGENT: '/api/user-agent/',
} as const;

export const EVENTS = {
  MESSAGE_NEW: 'message.new',
  SETTINGS_UPDATED: 'settings.updated',
} as const;

