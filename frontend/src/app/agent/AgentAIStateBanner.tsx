import { useEffect, useState } from 'react';

import type { Channel } from '@/lib/stream-adapter/Channel';

type AgentAIState = 'idle' | 'thinking' | 'generating' | 'error';

interface Props {
    channel?: Channel | null;
}

export function AgentAIStateBanner({ channel }: Props) {
    const [state, setState] = useState<AgentAIState>('idle');

    useEffect(() => {
        if (!channel) {
            setState('idle');
            return undefined;
        }

        const handler = (event: any) => {
            if (!event?.message) return;
            const msg = event.message;

            const isAgentMessage =
                msg.sent_by === 'ai-bot-agent-lab' ||
                msg.user?.id === 'ai-bot-agent-lab' ||
                msg.custom_data?.ai_generated;

            if (!isAgentMessage) return;

            const raw = msg.custom_data?.ai_state as string | undefined;

            let next: AgentAIState = 'idle';
            if (raw === 'AI_STATE_THINKING') next = 'thinking';
            else if (raw === 'AI_STATE_GENERATING') next = 'generating';
            else if (raw === 'AI_STATE_ERROR') next = 'error';

            setState(next);
        };

        channel.on('message.new', handler);
        channel.on('message.updated', handler);

        const messages = channel.state?.messages ?? [];
        const lastAgent = [...messages]
            .reverse()
            .find((m: any) => m.custom_data?.ai_generated);
        if (lastAgent?.custom_data?.ai_state) {
            handler({ message: lastAgent });
        }

        return () => {
            channel.off('message.new', handler);
            channel.off('message.updated', handler);
            setState('idle');
        };
    }, [channel]);

    if (state === 'idle' || state === 'error') return null;

    const label = state === 'generating' ? 'Generating...' : 'Thinking...';

    return (
        <div
            style={{
                padding: '4px 12px',
                fontSize: 12,
                color: '#444',
                borderTop: '1px solid #e5e5e5',
                backgroundColor: '#f5f5f5',
            }}
        >
            {label}
        </div>
    );
}
