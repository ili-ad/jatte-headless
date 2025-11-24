import type { Channel } from '@/lib/stream-adapter';
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

export interface AgentContext {
  channel: Channel;
  roomId: string;
}

export interface AgentInvocation {
  roomUUID: string;
  lastHumanMessageId: string;
  clientGeneratedId?: string;
  traceId?: string;
}

export type AgentMessage = {
  id: string;
  room_uuid: string;
  user_id: string;
  role: 'assistant';
  text: string;
  created_at: string;
  custom_data?: Record<string, unknown>;
};

export interface AgentReply {
  messages: AgentMessage[];
  reason?: string;
}

export interface RoomAgentConfig {
  enabled: boolean;
  botUserId: string;
  displayName: string;
  personaSummary?: string | null;
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

export function extractRoomAgentConfig(configState: any): RoomAgentConfig | null {
  const aiConfig = configState?.config?.ai ?? configState?.ai ?? configState?.ai_assistant;
  if (!aiConfig || typeof aiConfig !== 'object') return null;

  const botUserId = aiConfig.botUserId ?? aiConfig.user_id;
  if (!botUserId || typeof botUserId !== 'string') return null;

  return {
    enabled: Boolean(aiConfig.enabled),
    botUserId,
    displayName: typeof aiConfig.displayName === 'string' ? aiConfig.displayName : 'Assistant',
    personaSummary: aiConfig.personaSummary ?? aiConfig.persona_summary ?? null,
  };
}

export async function requestAgentReply(args: AgentInvocation): Promise<AgentReply> {
  const res = await apiFetch('/chat/agent/rag/', {
    method: 'POST',
    body: JSON.stringify({
      room_uuid: args.roomUUID,
      last_human_message_id: args.lastHumanMessageId,
      client_generated_id: args.clientGeneratedId,
      trace_id: args.traceId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to request agent reply (${res.status})`);
  }

  const payload = (await res.json()) as AgentReply;
  return {
    messages: payload?.messages ?? [],
    reason: payload?.reason,
  };
}
