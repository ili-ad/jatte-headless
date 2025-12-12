'use client';

import { MAX_BOOTSTRAP_ATTEMPTS } from '../chat-kit/lib/bootstrapFetchPolicy';
import type { BootstrapStatus } from './ChatProvider';

interface Props {
  status: BootstrapStatus;
  onRetry: () => void;
}

function formatRetrySeconds(ms: number) {
  return Math.max(0, ms) / 1000;
}

export default function ChatBootstrapNotice({ status, onRetry }: Props) {
  const isError = status.kind === 'error';
  const isRetrying = status.kind === 'retrying';

  const heading = (() => {
    if (status.kind === 'connecting') return 'Connecting…';
    if (status.kind === 'retrying') return 'Having trouble connecting…';
    if (status.kind === 'error') return 'Unable to load chat';
    return 'Connecting…';
  })();

  const description = (() => {
    if (status.kind === 'connecting') return 'Setting up chat for this room.';
    if (status.kind === 'retrying') {
      const seconds = formatRetrySeconds(status.retryInMs).toFixed(1);
      return `Retrying in ${seconds}s (attempt ${status.attempt}/${MAX_BOOTSTRAP_ATTEMPTS}).`;
    }
    if (status.kind === 'error') return status.message;
    return '';
  })();

  const actionLabel = (() => {
    if (!isError) return null;
    if (status.code === 401 || status.code === 403) return 'Reload';
    return status.retryable ? 'Retry' : 'Reload';
  })();

  const handleAction = () => {
    if (!isError) return;
    if (status.retryable) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 24,
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 200,
        border: '1px solid #d6d6d6',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{heading}</div>
        {description ? <div style={{ color: '#444', lineHeight: 1.5 }}>{description}</div> : null}
        {isRetrying ? (
          <div style={{ color: '#666', fontSize: 14 }}>
            We’ll keep trying for a bit and then stop if we still can’t connect.
          </div>
        ) : null}
      </div>

      {isError && actionLabel ? (
        <button
          type="button"
          onClick={handleAction}
          style={{
            background: '#0f62fe',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
