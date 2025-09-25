export type DeleteMessageParams = {
  cid: string;
  message_id: number;
};

export type CreateReminderInput = {
  cid: string;
  remind_at: string;
  message_id?: number;
  note?: string;
};

export type Reminder = {
  id: number;
  remind_at: string;
  message_id?: number | null;
  note?: string | null;
  created_by: number;
  created_at: string;
};

export type AppSettings = Record<string, unknown>;

export type UserAgentInfo = { user_agent: string };
export type SetUserAgentInput = Partial<UserAgentInfo>;

export type MuteStatus = { muted: boolean; muted_until: string | null };

export type Mute = {
  id: number;
  user_id: number;
  muted_until: string | null;
  muted_by: number;
  created_at: string;
};

export type MuteUserInput = { cid: string; user_id: number; muted_until?: string };

export type User = { id: number; username: string } & Record<string, unknown>;

export type SyncUserRequest = Partial<Record<string, unknown>>;
export type SyncUserResponse = User;

export type WebPushKeys = { p256dh: string; auth: string };
export type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: WebPushKeys;
};
export type RegisterSubscriptionsInput = {
  subscriptions: WebPushSubscription[];
  client_id?: string;
  platform?: 'web' | 'ios' | 'android';
};
export type RegisterSubscriptionsResponse = {
  subscriptions: WebPushSubscription[];
  client_id?: string | null;
  platform?: 'web' | 'ios' | 'android' | null;
};

export type Message = {
  id: number;
  body: string;
  created_at: string;
  sent_by: string;
};

export interface RoomDraft {
  id?: number;
  text?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parseWebPushKeys = (value: unknown): WebPushKeys => {
  if (!isRecord(value)) {
    throw new Error('Invalid web push keys response');
  }
  const { p256dh, auth } = value;
  if (typeof p256dh !== 'string' || typeof auth !== 'string') {
    throw new Error('Invalid web push keys response');
  }
  return { p256dh, auth };
};

const parseWebPushSubscription = (value: unknown): WebPushSubscription => {
  if (!isRecord(value)) {
    throw new Error('Invalid web push subscription response');
  }

  const { endpoint } = value;
  if (typeof endpoint !== 'string') {
    throw new Error('Invalid web push subscription response');
  }

  const subscription: WebPushSubscription = {
    endpoint,
    keys: parseWebPushKeys(value.keys),
  };

  if ('expirationTime' in value) {
    const expiration = value.expirationTime;
    if (expiration === null) {
      subscription.expirationTime = null;
    } else if (typeof expiration === 'number') {
      subscription.expirationTime = expiration;
    } else {
      throw new Error('Invalid web push subscription response');
    }
  }

  return subscription;
};

export const getAppSettings = async (): Promise<AppSettings> => {
  const response = await fetch("/api/app-settings/", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch app settings (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as AppSettings;
};

export const listUserAgents = async (): Promise<UserAgentInfo> => {
  const response = await fetch("/api/user-agent/", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch user agent (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<UserAgentInfo>;
  return {
    user_agent: typeof data.user_agent === "string" ? data.user_agent : "",
  };
};

export const setUserAgent = async (
  body: SetUserAgentInput = {},
): Promise<UserAgentInfo> => {
  const payload = { ...body };
  const hasBody = Object.keys(payload).length > 0;
  const options: RequestInit = {
    method: "POST",
    credentials: "same-origin",
  };

  if (hasBody) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload);
  }

  const response = await fetch("/api/user-agent/", options);

  if (!response.ok) {
    const error = new Error(
      `Failed to set user agent (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<UserAgentInfo>;
  if (typeof data.user_agent !== "string") {
    throw new Error("Invalid user agent response");
  }

  return { user_agent: data.user_agent };
};

export const syncUser = async (
  body: SyncUserRequest = {},
): Promise<SyncUserResponse> => {
  const payload: Record<string, unknown> = {};
  let token: string | undefined;

  if (isRecord(body)) {
    Object.entries(body).forEach(([key, value]) => {
      if (key === "__token" && typeof value === "string") {
        token = value;
        return;
      }
      payload[key] = value;
    });
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length > 0) {
    headers["Content-Type"] = "application/json";
  }

  const options: RequestInit = {
    method: "POST",
    credentials: "same-origin",
  };

  if (Object.keys(headers).length > 0) {
    options.headers = headers;
  }

  if (payloadKeys.length > 0) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch("/api/sync-user/", options);

  if (!response.ok) {
    const error = new Error(`Failed to sync user (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;
  if (!isRecord(data) || typeof data.id !== "number" || typeof data.username !== "string") {
    throw new Error("Invalid sync user response");
  }

  return data as SyncUserResponse;
};

export const registerSubscriptions = async (
  body: RegisterSubscriptionsInput,
): Promise<RegisterSubscriptionsResponse> => {
  const response = await fetch('/api/register-subscriptions/', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to register subscriptions (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;
  if (!isRecord(data)) {
    throw new Error('Invalid register subscriptions response');
  }

  const { subscriptions: rawSubscriptions } = data;
  if (!Array.isArray(rawSubscriptions)) {
    throw new Error('Invalid register subscriptions response');
  }

  const subscriptions = rawSubscriptions.map((item) =>
    parseWebPushSubscription(item),
  );

  let clientId: string | null | undefined;
  if ('client_id' in data) {
    const rawClientId = data.client_id;
    if (typeof rawClientId === 'string') {
      clientId = rawClientId;
    } else if (rawClientId === null) {
      clientId = null;
    } else {
      throw new Error('Invalid register subscriptions response');
    }
  }

  let platform: RegisterSubscriptionsResponse['platform'];
  if ('platform' in data) {
    const rawPlatform = data.platform;
    if (rawPlatform === 'web' || rawPlatform === 'ios' || rawPlatform === 'android') {
      platform = rawPlatform;
    } else if (rawPlatform === null) {
      platform = null;
    } else {
      throw new Error('Invalid register subscriptions response');
    }
  }

  return {
    subscriptions,
    ...(clientId !== undefined ? { client_id: clientId } : {}),
    ...(platform !== undefined ? { platform } : {}),
  };
};

export const listUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/users/", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(`Failed to fetch users (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("Invalid users response");
  }

  return data.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid users response item");
    }

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "number" ||
      typeof candidate.username !== "string"
    ) {
      throw new Error("Invalid users response item");
    }

    return { id: candidate.id, username: candidate.username };
  });
};

async function deleteMessage({ cid, message_id }: DeleteMessageParams): Promise<void> {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "DELETE",
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to delete message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }
}

export const muteUser = async ({
  cid,
  user_id,
  muted_until,
}: MuteUserInput): Promise<Mute> => {
  const payload: Record<string, unknown> = { user_id };
  if (muted_until) {
    payload.muted_until = muted_until;
  }

  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/mutes/`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const error = new Error(`Failed to mute user (status ${response.status})`);
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<Mute>;

  if (
    typeof data?.id !== "number" ||
    typeof data.user_id !== "number" ||
    typeof data.muted_by !== "number" ||
    typeof data.created_at !== "string"
  ) {
    throw new Error("Invalid mute response");
  }

  let mutedUntil: string | null = null;
  if (typeof data.muted_until === "string") {
    mutedUntil = data.muted_until;
  } else if (data.muted_until === null || data.muted_until === undefined) {
    mutedUntil = null;
  } else {
    throw new Error("Invalid muted_until value");
  }

  return {
    id: data.id,
    user_id: data.user_id,
    muted_until: mutedUntil,
    muted_by: data.muted_by,
    created_at: data.created_at,
  };
};

export const muteStatus = async ({ cid }: { cid: string }): Promise<MuteStatus> => {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/mute/`,
    {
      method: "GET",
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch mute status (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = (await response.json()) as Partial<MuteStatus>;
  return {
    muted: Boolean(data?.muted),
    muted_until:
      typeof data?.muted_until === "string" || data?.muted_until === null
        ? (data?.muted_until ?? null)
        : null,
  };
};

export const getMessage = async ({
  cid,
  message_id,
}: {
  cid: string;
  message_id: number;
}): Promise<Message> => {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/messages/${encodeURIComponent(String(message_id))}/`,
    {
      method: "GET",
      credentials: "same-origin",
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as Message;
};

export const listRoomDrafts = async ({
  room_uuid,
}: {
  room_uuid: string;
}): Promise<RoomDraft[]> => {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(room_uuid)}/draft/`,
    {
      method: 'GET',
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to fetch room drafts (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? (data as RoomDraft[]) : [];
};

async function createReminder({ cid, ...body }: CreateReminderInput): Promise<Reminder> {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(cid)}/reminders/`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const error = new Error(
      `Failed to create reminder (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as Reminder;
}

async function endSession(): Promise<void> {
  const response = await fetch("/api/session/", {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to end session (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }
}

export const chatAPI = {
  createReminder,
  deleteMessage,
  muteUser,
  registerSubscriptions,
  endSession,
  getMessage,
  getAppSettings,
  muteStatus,
  listRoomDrafts,
  listUsers,
  listUserAgents,
  setUserAgent,
  syncUser,
};
