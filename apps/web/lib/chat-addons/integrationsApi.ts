export interface SendSmsPayload {
  cid: string;
  to: string;
  text: string;
}

export interface SendSmsResponse {
  run_id: string;
  status: string;
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

  return (await response.json()) as T;
}

export async function sendSms(payload: SendSmsPayload): Promise<SendSmsResponse> {
  return request<SendSmsResponse>('/chat/integrations/sms/send/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
