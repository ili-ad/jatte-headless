import { apiFetch } from '../api';

export type AdminQueueStatus = 'new' | 'mine';

export interface AdminQueueRow {
  cid: string;
  name: string | null;
  last_message_at: string | null;
  last_text: string | null;
  owner_id: string | null;
  unread_count: number;
}

export interface AdminQueueResponse {
  results: AdminQueueRow[];
  next: string | null;
}

export interface ClaimRoomResponse {
  cid: string;
  owner_id: string;
  claimed_at: string;
}

function buildQueuePath(status: AdminQueueStatus, limit?: number, cursor?: string) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (typeof limit === 'number') {
    params.set('limit', String(limit));
  }
  if (cursor) {
    params.set('cursor', cursor);
  }
  const suffix = params.toString();
  return `/chat/admin/queue/${suffix ? `?${suffix}` : ''}`;
}

export async function listAdminQueue(
  status: AdminQueueStatus,
  options: { limit?: number; cursor?: string } = {},
): Promise<AdminQueueResponse> {
  const path = buildQueuePath(status, options.limit, options.cursor);
  const res = await apiFetch(path, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to load queue (${res.status})`);
  }
  return (await res.json()) as AdminQueueResponse;
}

export async function claimRoom(cid: string): Promise<ClaimRoomResponse> {
  const encoded = encodeURIComponent(cid);
  const res = await apiFetch(`/chat/admin/rooms/${encoded}/claim/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to claim room (${res.status})`);
  }
  return (await res.json()) as ClaimRoomResponse;
}
