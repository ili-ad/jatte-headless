import { apiFetch } from '../api';

export interface AgentToggleResponse {
  cid: string;
  agent_enabled: boolean;
  updated_at: string | null;
}

export interface AgentInvokeResponse {
  run_id: string;
  status: 'queued';
}

export interface AgentInvokePayload {
  prompt: string;
  meta?: Record<string, unknown>;
}

function encodeCid(cid: string): string {
  return encodeURIComponent(cid);
}

export async function getAgentStatus(cid: string): Promise<AgentToggleResponse> {
  const res = await apiFetch(`/chat/agent/${encodeCid(cid)}/`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to load agent status (${res.status})`);
  }
  return (await res.json()) as AgentToggleResponse;
}

export async function enableAgent(cid: string): Promise<AgentToggleResponse> {
  const res = await apiFetch(`/chat/agent/${encodeCid(cid)}/enable/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to enable agent (${res.status})`);
  }
  return (await res.json()) as AgentToggleResponse;
}

export async function disableAgent(cid: string): Promise<AgentToggleResponse> {
  const res = await apiFetch(`/chat/agent/${encodeCid(cid)}/disable/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(`Failed to disable agent (${res.status})`);
  }
  return (await res.json()) as AgentToggleResponse;
}

export async function invokeAgent(
  cid: string,
  payload: AgentInvokePayload,
): Promise<AgentInvokeResponse> {
  const res = await apiFetch(`/chat/agent/${encodeCid(cid)}/invoke/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to invoke agent (${res.status})`);
  }
  return (await res.json()) as AgentInvokeResponse;
}
