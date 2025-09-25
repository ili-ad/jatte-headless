export type CreateMessagePayload = { text: string } & Record<string, unknown>;

export type CreateMessageResult = Record<string, unknown>;

interface ErrorWithStatus extends Error {
  status?: number;
}

/**
 * Persist a new message for the given channel identifier.
 */
export async function createMessage(
  cid: string,
  payload: CreateMessagePayload,
  init?: RequestInit,
): Promise<CreateMessageResult> {
  const url = `/api/rooms/${encodeURIComponent(cid)}/messages/`;
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    method: "POST",
    credentials: init?.credentials ?? "same-origin",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = new Error(
      `Failed to create message (status ${response.status})`,
    );
    const errorWithStatus = error as ErrorWithStatus;
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return (await response.json()) as CreateMessageResult;
}
