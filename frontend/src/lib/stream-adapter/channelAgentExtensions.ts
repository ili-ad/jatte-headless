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

export function getBotUserIdForChannel(channel: Channel): string | null {
    const snapshot = channel.messageComposer?.configState?.getSnapshot?.();

    // Prefer cached channel-level config; snapshot is fallback only.
    const agentConfig =
        (channel as any).agentConfig ?? (snapshot ? extractRoomAgentConfig(snapshot) : null);

    // If agent isn't enabled, there is no bot identity.
    if (!agentConfig?.enabled) return null;

    // If backend provided an explicit bot user id, use it.
    if (agentConfig.botUserId) return agentConfig.botUserId;

    if (process.env.NODE_ENV !== 'production') {
        console.warn('[agent] enabled but missing botUserId; using deterministic fallback', {
            cid: (channel as any).cid,
            uuid: (channel as any).uuid ?? (channel as any).data?.uuid,
        });
    }

    // Backend canonical fallback is: ai-bot-<room_uuid> (full UUID, not sliced).
    const directUuid =
        (channel as any).uuid ??
        (channel as any).data?.uuid ??
        (channel as any).roomUuid ??
        null;

    if (directUuid) return `ai-bot-${String(directUuid)}`;

    // Derive UUID from cid when possible, e.g. "messaging:<uuid>"
    const cid = (channel as any).cid as string | undefined;
    if (cid && cid.includes(':')) {
        const derived = cid.split(':', 2)[1];
        if (derived) return `ai-bot-${derived}`;
    }

    // Last-resort deterministic fallback: based on cid
    if (cid) {
        const safe = String(cid).replace(/[^a-zA-Z0-9_-]/g, '-');
        return `ai-bot-${safe}`;
    }

    return 'ai-bot';
}




export const AGENT_DISPLAY_NAME = 'Iris';

export function hasAgentMessageMarker(message: Message | Record<string, any> | null | undefined) {
    const customData = (message as any)?.custom_data ?? {};

    return Boolean(
        (message as any)?.ai_generated ||
        customData.ai_generated ||
        customData.ai_state ||
        customData.agent,
    );
}

export function resolveDisplayNameForMessage(channel: Channel, message: Message) {
    const user = (message as any).user ?? {};
    const authorId = user.id ?? (message as any).user_id ?? (message as any).sent_by;
    const botUserId = getBotUserIdForChannel(channel);
    const currentUserId = (channel as any).getCurrentUserId();

    if (user.name === 'System' || authorId === 'system') {
        return 'System';
    }

    if (authorId && botUserId && authorId === botUserId) {
        return AGENT_DISPLAY_NAME;
    }

    if (currentUserId && authorId === currentUserId) {
        return 'You';
    }

    if (hasAgentMessageMarker(message)) {
        return AGENT_DISPLAY_NAME;
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

    /**
     * Ensure config-state is fetched at least once before deciding enablement.
     * If config fetch fails, treat as disabled (no surprise cost).
     */
    try {
        await channel.messageComposer?.getConfigState?.();
    } catch {
        // no-op: disabled-by-default behavior below
    }

    const snapshot = channel.messageComposer?.configState?.getSnapshot?.();
    const aiConfig = (channel as any).agentConfig ?? (snapshot ? extractRoomAgentConfig(snapshot) : null);

    // EXPLICIT OPT-IN ONLY: no "agent-lab" special casing.
    const isAgentEnabled = Boolean(aiConfig?.enabled);

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

    // Use the helper (consistent identity + correct fallback)
    const botUserId = getBotUserIdForChannel(channel);

    // Safety: if this message is from the bot, don’t re-trigger.
    if (botUserId && authorId === botUserId) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[agent] bail: message from bot user, not echoing', {
                cid: channel.cid,
                botUserId,
            });
        }
        return;
    }

    if (!message.id) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[agent] bail: missing message id', { cid: channel.cid });
        }
        return;
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log('[agent] invoking agent', {
            cid: channel.cid,
            uuid: (channel as any).uuid,
            authorId,
            botUserId,
            messageId: message.id,
        });
    }

    // Typing indicator should be attributed to the bot (not the author).
    if (botUserId) startAgentTyping(channel, botUserId);

    try {
        const roomUUID =
            (channel as any).uuid ??
            (channel as any).data?.uuid ??
            (channel as any).roomUuid ??
            (channel.cid?.includes(':') ? channel.cid.split(':', 2)[1] : undefined);

        const reply = await invokeAgent(channel.cid, {
            roomUUID,
            lastHumanMessageId: String(message.id),
            clientGeneratedId: client_generated_id ?? (message as any).client_generated_id,
        });

        if ('status' in reply && reply.status === 'queued') {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[agent] agent job queued', reply);
            }
            return;
        }

        (reply.messages ?? []).forEach((agentMessage) => {
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

            (channel as any).integrateIncomingMessage(
                normalized as any,
                normalized.id as any,
            );
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log('[agent] agent reply integrated', reply);
        }
    } catch (err) {
        console.error('[agent] failed to request reply', err);
    } finally {
        if (botUserId) stopAgentTyping(channel, botUserId);
    }
}

