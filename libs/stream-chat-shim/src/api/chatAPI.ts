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
  endSession,
  getMessage,
  getAppSettings,
  listRoomDrafts,
};
