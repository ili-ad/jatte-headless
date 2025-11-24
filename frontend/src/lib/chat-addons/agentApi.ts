import type { Channel, Message } from '@/lib/stream-adapter';
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

export interface AgentRagPayload {
  roomId: string;
  message: string;
  history?: Record<string, unknown>[];
}

export interface AgentRagResponse {
  reply: string;
  agent_user_id: string;
  status: string;
}

export interface AgentContext {
  channel: Channel;
  roomId: string;
  messages: Message[];
  userMessage: Message;
}

const AGENT_DISPLAY_NAME = 'Assistant';

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

export const agentUserId = (roomId: string) => `ai-bot-${roomId}`;

function getAuthorId(message: Message): string | undefined {
  return (
    (message as any).user?.id ||
    (message as any).user_id ||
    (message as any).sent_by
  );
}

function ensureAgentUser(channel: Channel, agentId: string) {
  const client: any = channel as any;
  const userMap = client?.client?.state?.users;
  if (userMap && !userMap[agentId]) {
    userMap[agentId] = { id: agentId, name: AGENT_DISPLAY_NAME, role: 'ai' } as any;
  }
}

export async function invokeAgentRag(
  payload: AgentRagPayload,
): Promise<AgentRagResponse> {
  const res = await apiFetch('/chat/agent/rag/', {
    method: 'POST',
    body: JSON.stringify({
      room_id: payload.roomId,
      message: payload.message,
      history: payload.history ?? [],
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to run agent RAG (${res.status})`);
  }

  return (await res.json()) as AgentRagResponse;
}

export async function handleUserMessageWithAgent(ctx: AgentContext): Promise<void> {
  const agentId = agentUserId(ctx.roomId);
  const authorId = getAuthorId(ctx.userMessage);
  if (!authorId || authorId === agentId) return;

  const recentHistory = ctx.messages
    .slice(-20)
    .map((msg) => ({
      text: (msg as any).text ?? (msg as any).body ?? '',
      user_id: getAuthorId(msg),
    }))
    .filter((entry) => entry.text);

  ensureAgentUser(ctx.channel, agentId);
  ctx.channel.simulateTypingStart(agentId);

  const stopTyping = () => ctx.channel.simulateTypingStop(agentId);
  const handleAgentEcho = (event: { message: Message }) => {
    if (event?.message && getAuthorId(event.message) === agentId) {
      stopTyping();
      (ctx.channel as any).off('message.new', handleAgentEcho as any);
      clearTimeout(fallbackTimer);
    }
  };

  (ctx.channel as any).on('message.new', handleAgentEcho as any);
  const fallbackTimer = setTimeout(() => {
    stopTyping();
    (ctx.channel as any).off('message.new', handleAgentEcho as any);
  }, 15000);

  try {
    const messageText = (ctx.userMessage as any).text ?? (ctx.userMessage as any).body ?? '';
    await invokeAgentRag({
      roomId: ctx.roomId,
      message: messageText,
      history: recentHistory,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[agent] failed to invoke RAG agent', err);
    stopTyping();
    (ctx.channel as any).off('message.new', handleAgentEcho as any);
    clearTimeout(fallbackTimer);
  }
}
