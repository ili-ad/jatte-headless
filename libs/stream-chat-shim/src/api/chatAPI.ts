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

export type MuteStatus = { muted: boolean; muted_until: string | null };

export type Mute = {
  id: number;
  user_id: number;
  muted_until: string | null;
  muted_by: number;
  created_at: string;
};

export type MuteUserInput = { cid: string; user_id: number; muted_until?: string };

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
  endSession,
  getMessage,
  getAppSettings,
  muteStatus,
  listRoomDrafts,
  listUserAgents,
};
