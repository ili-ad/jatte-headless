export const API = {
  SYNC_USER: '/api/sync-user/',
  SESSION: '/api/session/',
  ROOMS: '/api/rooms/',
  MESSAGES: '/api/messages/',
  APP_SETTINGS: '/api/app-settings/',
  USERS: '/api/users/',
} as const;

export const EVENTS = {
  MESSAGE_NEW: 'message.new',
  SETTINGS_UPDATED: 'settings.updated',
} as const;

