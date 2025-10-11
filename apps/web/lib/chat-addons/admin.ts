export type IntakeStatus = 'pending' | 'rejected' | 'all';

export interface GatingRules {
  languages: string[];
  min_length: number;
  max_length: number;
  min_interval_seconds: number;
  blocklist: string[];
}

export interface IntakeItem {
  message_id: string;
  cid: string;
  user_id: string;
  text: string;
  created_at: string;
  status: string;
  reason: string | null;
}

export interface IntakeListResponse {
  results: IntakeItem[];
  next: string | null;
}

export interface IntakeActionResponse {
  message_id: string;
  status: string;
  muted: boolean;
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

export function buildIntakeQuery(status: IntakeStatus, limit?: number, cursor?: string) {
  const params = new URLSearchParams();
  if (status !== 'all') {
    params.set('status', status);
  }
  if (typeof limit === 'number') {
    params.set('limit', String(limit));
  }
  if (cursor) {
    params.set('cursor', cursor);
  }
  const suffix = params.toString();
  return suffix ? `/chat/admin/intake/?${suffix}` : '/chat/admin/intake/';
}

export async function getGatingRules(): Promise<GatingRules> {
  return request<GatingRules>('/chat/admin/gating-rules/');
}

export async function updateGatingRules(payload: GatingRules): Promise<GatingRules> {
  return request<GatingRules>('/chat/admin/gating-rules/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listIntake(options: {
  status?: IntakeStatus;
  limit?: number;
  cursor?: string;
} = {}): Promise<IntakeListResponse> {
  const path = buildIntakeQuery(options.status ?? 'pending', options.limit, options.cursor);
  return request<IntakeListResponse>(path);
}

export async function approveIntake(messageId: string): Promise<IntakeActionResponse> {
  const encoded = encodeURIComponent(messageId);
  return request<IntakeActionResponse>(`/chat/admin/intake/${encoded}/approve/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function rejectIntake(
  messageId: string,
  options: { reason?: string; mute?: boolean } = {},
): Promise<IntakeActionResponse> {
  const encoded = encodeURIComponent(messageId);
  return request<IntakeActionResponse>(`/chat/admin/intake/${encoded}/reject/`, {
    method: 'POST',
    body: JSON.stringify({
      reason: options.reason,
      mute: options.mute ?? false,
    }),
  });
}

export interface IntakeSummary {
  intake: {
    pending: number;
    rejected: number;
  };
}

export async function getIntakeSummary(): Promise<IntakeSummary> {
  return request<IntakeSummary>('/chat/notifications/intake/');
}
