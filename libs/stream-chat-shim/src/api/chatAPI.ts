export type DeleteMessageParams = {
  cid: string;
  message_id: number;
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
    (error as Record<string, unknown>).status = response.status;
    throw error;
  }
}

export const chatAPI = {
  deleteMessage,
};
