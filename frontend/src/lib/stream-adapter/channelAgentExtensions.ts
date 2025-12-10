import { AIStates } from '@iliad/stream-chat-shim';
import { extractRoomAgentConfig, invokeAgent } from '../chat-addons/agentApi';
import type { Channel } from './Channel';
import type { Message } from './types';

export function clearAgentTypingTimer(channel: Channel, userId: string) {
    const agentTypingTimers = (channel as any).agentTypingTimers as Map<string, ReturnType<typeof setTimeout>>;
    const timer = agentTypingTimers.get(userId);
    if (timer) clearTimeout(timer);
    agentTypingTimers.delete(userId);
}

export function startAgentTyping(channel: Channel, botUserId: string) {
    if (!botUserId) return;
    clearAgentTypingTimer(channel, botUserId);
    channel.simulateTypingStart(botUserId, 30000);
    const agentTypingTimers = (channel as any).agentTypingTimers as Map<string, ReturnType<typeof setTimeout>>;
    const timer = setTimeout(() => stopAgentTyping(channel, botUserId), 30000);
    agentTypingTimers.set(botUserId, timer);
}

export function stopAgentTyping(channel: Channel, botUserId: string) {
    clearAgentTypingTimer(channel, botUserId);
    channel.simulateTypingStop(botUserId);
}

export function getBotUserIdForChannel(channel: Channel) {
    const snapshot = channel.messageComposer?.configState?.getSnapshot?.();
    const agentConfig = snapshot
        ? (channel as any).agentConfig ?? extractRoomAgentConfig(snapshot)
        : (channel as any).agentConfig;
    return agentConfig?.botUserId ?? 'ai-bot-agent-lab';
}

export function resolveDisplayNameForMessage(channel: Channel, message: Message) {
    const user = (message as any).user ?? {};
    const authorId = user.id ?? (message as any).user_id ?? (message as any).sent_by;
    const botUserId = getBotUserIdForChannel(channel);
    const currentUserId = (channel as any).getCurrentUserId();

    if (authorId && botUserId && authorId === botUserId) {
        return 'AI assistant';
    }

    if (currentUserId && authorId === currentUserId) {
        return 'You';
    }

    if (user.name) {
        return user.name;
    }

    const rawId = String(authorId ?? '');
    const shortId = rawId.slice(0, 4).toUpperCase() || '????';
    return `Guest ${shortId}`;
}

export function withDisplayName(channel: Channel, message: Message): Message {
    const user = { ...(message as any).user } as { id?: string; name?: string };
    const authorId = user.id ?? (message as any).user_id ?? (message as any).sent_by;
    const displayName = resolveDisplayNameForMessage(channel, { ...message, user });
    const normalizedUser = authorId ? { ...user, id: authorId, name: displayName } : { ...user, name: displayName };

    const normalizedMessage = {
        ...message,
        user_id: (message as any).user_id ?? authorId,
        user: normalizedUser,
    } as Message;

    return normalizedMessage;
}

export function normalizeMessagesWithDisplayName(channel: Channel, messages: Message[]) {
    return messages.map((msg) => withDisplayName(channel, msg));
}

export async function triggerAgentReplyIfEnabled(
    channel: Channel,
    message: Message & { client_generated_id?: string },
    client_generated_id?: string,
) {
    const authorId =
        (message as any).user_id ??
        (message as any).sent_by ??
        (message as any).user?.id;

    const snapshot = channel.messageComposer.configState.getSnapshot();
    const aiConfig = (channel as any).agentConfig ?? extractRoomAgentConfig(snapshot);

    const isAgentLab =
        (channel as any).uuid === 'agent-lab' || channel.cid === 'messaging:agent-lab';

    const isAgentEnabled = aiConfig?.enabled ?? isAgentLab;

    if (!isAgentEnabled) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[agent] skip invokeAgent: agent disabled for channel', {
                cid: channel.cid,
                uuid: (channel as any).uuid,
            });
        }
        return;
    }

    const currentAiState = channel.getClient().getAIState?.(channel.cid);
    const isBusy =
        currentAiState === AIStates.Thinking || currentAiState === AIStates.Generating;

    if (isBusy) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[agent] skip invokeAgent: channel busy', {
                cid: channel.cid,
                aiState: currentAiState,
            });
        }
        return;
    }

    const botUserId = aiConfig?.botUserId;
    if (botUserId && authorId === botUserId) {
        console.log('[agent] bail: message from bot user, not echoing');
        return;
    }

    if (!message.id) {
        console.log('[agent] bail: missing message id');
        return;
    }

    console.log('[agent] trigger echo', {
        cid: channel.cid,
        uuid: (channel as any).uuid,
        authorId,
        botUserId,
        messageId: message.id,
    });

    const typingUserId = botUserId ?? authorId;
    startAgentTyping(channel, typingUserId);

    try {
        const reply = await invokeAgent(channel.cid, {
            roomUUID: (channel as any).uuid,
            lastHumanMessageId: String(message.id),
            clientGeneratedId:
                client_generated_id ?? (message as any).client_generated_id,
        });

        if ('status' in reply && reply.status === 'queued') {
            console.log('[agent] agent job queued', reply);
            return;
        }

        (reply.messages ?? []).forEach(agentMessage => {
            const normalized = {
                id: Number(agentMessage.id) || agentMessage.id,
                room_uuid: agentMessage.room_uuid,
                user_id: agentMessage.user_id,
                user: { id: agentMessage.user_id } as any,
                text: agentMessage.text,
                body: agentMessage.text,
                created_at: agentMessage.created_at,
                custom_data: agentMessage.custom_data ?? {},
                status: 'received' as const,
            };

            (channel as any).integrateIncomingMessage(normalized as any, normalized.id as any);
        });

        console.log('[agent] echo reply integrated', reply);

    } catch (err) {
        console.error('[agent] failed to request reply', err);
    } finally {
        stopAgentTyping(channel, typingUserId);
    }
}
