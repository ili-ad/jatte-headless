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

interface ErrorWithStatus extends Error {
  status?: number;
}

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
};
