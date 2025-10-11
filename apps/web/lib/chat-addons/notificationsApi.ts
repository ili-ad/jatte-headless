export interface OnCallConfigPayload {
  phone_e164: string | null;
  email: string | null;
}

export interface EscalationRequestPayload {
  cid: string;
  reason: string;
}

export interface EscalationResponse {
  cid: string;
  notified: boolean;
  via: 'sms' | 'email' | 'none';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Request to ${path} failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getOnCallConfig(): Promise<OnCallConfigPayload> {
  return request<OnCallConfigPayload>('/chat/notifications/oncall/');
}

export async function setOnCallConfig(payload: {
  phone_e164?: string | null;
  email?: string | null;
}): Promise<OnCallConfigPayload> {
  return request<OnCallConfigPayload>('/chat/notifications/oncall/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function sendAdminHeartbeat(): Promise<void> {
  await request<void>('/chat/notifications/presence/', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function escalateRoom(
  payload: EscalationRequestPayload,
): Promise<EscalationResponse> {
  return request<EscalationResponse>('/chat/notifications/escalate/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
