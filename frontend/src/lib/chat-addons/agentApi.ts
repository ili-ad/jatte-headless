import type { Channel } from '@/chat-kit/client';
import { apiFetch } from '../api';

export interface AgentToggleResponse {
  cid: string;
  agent_enabled: boolean;
  updated_at: string | null;
}

export interface AgentContext {
  channel: Channel;
  roomId: string;
}

export interface AgentInvocation {
  roomUUID: string;
  lastHumanMessageId: string | number;
  clientGeneratedId?: string;
  traceId?: string;
}

export interface AgentInvokePromptPayload {
  prompt: string;
  meta?: Record<string, unknown>;
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

export type AgentInvokeQueuedResponse = {
  status: 'queued';
  job_id: string;
  trace_id: string | null;
};

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
  payload: AgentInvocation | AgentInvokePromptPayload,
): Promise<AgentReply | AgentInvokeQueuedResponse> {
  const isInvocationPayload =
    'roomUUID' in payload || 'lastHumanMessageId' in payload;

  const body = isInvocationPayload
    ? {
        room_uuid: (payload as AgentInvocation).roomUUID,
        last_human_message_id: Number(
          (payload as AgentInvocation).lastHumanMessageId,
        ),
        client_generated_id: (payload as AgentInvocation).clientGeneratedId,
        trace_id: (payload as AgentInvocation).traceId,
      }
    : {
        prompt: (payload as AgentInvokePromptPayload).prompt,
        meta: (payload as AgentInvokePromptPayload).meta,
      };

  console.log('[agent] invokeAgent request', { cid, body });

  const res = await apiFetch(`/chat/agent/${encodeCid(cid)}/invoke/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('[agent] invokeAgent response status', res.status);

  const rawText = await res.text().catch(() => '');
  console.log('[agent] invokeAgent raw response', rawText);

  if (!res.ok) {
    // This will show up in the Channel catch block too.
    console.error('[agent] invokeAgent error response', res.status, rawText);
    throw new Error(`Failed to invoke agent (${res.status})`);
  }

  let reply: AgentReply | AgentInvokeQueuedResponse | Record<string, unknown> = {};
  try {
    reply = rawText ? (JSON.parse(rawText) as any) : {};
  } catch (err) {
    console.error('[agent] invokeAgent parse error', err);
    throw err;
  }

  const replyKind = (reply as AgentInvokeQueuedResponse)?.status === 'queued' ? 'queued' : 'messages';

  console.log('[agent] invokeAgent parsed reply', reply);
  console.log('[agent] invokeAgent reply kind', replyKind, {
    job_id: (reply as AgentInvokeQueuedResponse).job_id,
    message_count: Array.isArray((reply as AgentReply).messages)
      ? (reply as AgentReply).messages.length
      : undefined,
  });

  return reply as AgentReply | AgentInvokeQueuedResponse;
}



export function extractRoomAgentConfig(configState: any): RoomAgentConfig | null {
  const aiConfig = configState?.config?.ai ?? configState?.ai ?? null;
  const aiAssistant = configState?.ai_assistant ?? null;
  const candidateConfig = aiAssistant && typeof aiAssistant === 'object' ? { ...aiAssistant, ...aiConfig } : aiConfig;
  if (!candidateConfig || typeof candidateConfig !== 'object') return null;

  const botUserId =
    candidateConfig.botUserId ??
    candidateConfig.user_id ??
    (typeof aiAssistant?.user_id === 'string' ? aiAssistant.user_id : undefined);
  if (!botUserId || typeof botUserId !== 'string') return null;

  const enabledFlag =
    typeof configState?.has_ai_assistant === 'boolean'
      ? configState.has_ai_assistant
      : candidateConfig.enabled;

  return {
    enabled: Boolean(enabledFlag),
    botUserId,
    displayName:
      typeof candidateConfig.displayName === 'string'
        ? candidateConfig.displayName
        : typeof aiAssistant?.display_name === 'string'
          ? aiAssistant.display_name
          : 'Assistant',
    personaSummary:
      candidateConfig.personaSummary ??
      candidateConfig.persona_summary ??
      aiAssistant?.persona_summary ??
      null,
  };
}

export async function requestAgentReply(args: AgentInvocation): Promise<AgentReply> {
  const res = await apiFetch('/chat/agent/rag/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      room_uuid: args.roomUUID,
      last_human_message_id: Number(args.lastHumanMessageId),
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

