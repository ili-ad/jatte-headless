export type AutoReplyMode = 'receptionist' | 'off' | 'manual';

export interface AgentPolicy {
  cid: string;
  agent_enabled: boolean;
  enabled_skills: string[];
  tool_hop_cap: number;
  turn_cap: number;
  auto_reply_mode: AutoReplyMode;
  handoff_message: string;
}

export interface AgentSkillToggle {
  name: string;
  enabled: boolean;
}

export interface AgentSkill extends AgentSkillToggle {
  description: string;
}

export interface AgentSkillListResponse {
  cid: string;
  skills: AgentSkill[];
}

export interface AgentRunSummary {
  ts: string;
  status: string;
  tools_used: string[];
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  run_id: string;
}

export interface AgentRunListResponse {
  results: AgentRunSummary[];
  next: string | null;
}

export interface AgentSimulationResponse {
  reply: string;
  tools_used: string[];
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
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

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getAgentPolicy(cid: string): Promise<AgentPolicy> {
  const params = new URLSearchParams({ cid });
  return request<AgentPolicy>(`/chat/agent/policy?${params.toString()}`);
}

export async function updateAgentPolicy(payload: AgentPolicy): Promise<AgentPolicy> {
  return request<AgentPolicy>('/chat/agent/policy', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getAgentSkills(cid: string): Promise<AgentSkillListResponse> {
  const params = new URLSearchParams({ cid });
  return request<AgentSkillListResponse>(`/chat/agent/skills?${params.toString()}`);
}

export async function updateAgentSkills(payload: {
  cid: string;
  skills: AgentSkillToggle[];
}): Promise<AgentSkillListResponse> {
  return request<AgentSkillListResponse>('/chat/agent/skills', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listAgentRuns(options: {
  cid: string;
  limit?: number;
  cursor?: string;
}): Promise<AgentRunListResponse> {
  const params = new URLSearchParams({ cid: options.cid });
  if (typeof options.limit === 'number') {
    params.set('limit', String(options.limit));
  }
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }
  const suffix = params.toString();
  const path = suffix ? `/chat/agent/runs?${suffix}` : '/chat/agent/runs';
  return request<AgentRunListResponse>(path);
}

export async function simulateAgent(payload: {
  cid: string;
  prompt: string;
}): Promise<AgentSimulationResponse> {
  return request<AgentSimulationResponse>('/chat/agent/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
