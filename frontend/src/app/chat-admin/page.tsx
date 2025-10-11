'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  type AdminQueueRow,
  type AdminQueueStatus,
  claimRoom,
  listAdminQueue,
} from '../../lib/chat-addons/adminApi';
import {
  disableAgent,
  enableAgent,
  getAgentStatus,
  invokeAgent,
} from '../../lib/chat-addons/agentApi';

interface QueueState {
  items: AdminQueueRow[];
  next: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const DEFAULT_QUEUE_STATE: QueueState = {
  items: [],
  next: null,
  loading: false,
  error: null,
  initialized: false,
};

interface AgentStatusState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  toggling: boolean;
}

const DEFAULT_AGENT_STATUS: AgentStatusState = {
  enabled: false,
  loading: false,
  error: null,
  initialized: false,
  toggling: false,
};

const TABS: { key: AdminQueueStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'mine', label: 'Mine' },
];

export default function ChatAdminPage() {
  const [activeTab, setActiveTab] = useState<AdminQueueStatus>('new');
  const [claimingCid, setClaimingCid] = useState<string | null>(null);
  const [queues, setQueues] = useState<Record<AdminQueueStatus, QueueState>>({
    new: { ...DEFAULT_QUEUE_STATE },
    mine: { ...DEFAULT_QUEUE_STATE },
  });
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatusState>>({});
  const [invokePrompts, setInvokePrompts] = useState<Record<string, string>>({});
  const [invoking, setInvoking] = useState<Record<string, boolean>>({});

  const activeQueue = queues[activeTab];

  const loadQueue = useCallback(
    async (
      status: AdminQueueStatus,
      options: { append?: boolean; cursor?: string } = {},
    ) => {
      const { append = false, cursor } = options;
      setQueues((prev) => ({
        ...prev,
        [status]: {
          ...prev[status],
          loading: true,
          error: null,
        },
      }));

      try {
        const response = await listAdminQueue(status, {
          cursor: append ? cursor : undefined,
        });
        setQueues((prev) => ({
          ...prev,
          [status]: {
            items: append ? [...prev[status].items, ...response.results] : response.results,
            next: response.next ?? null,
            loading: false,
            error: null,
            initialized: true,
          },
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load queue';
        setQueues((prev) => ({
          ...prev,
          [status]: {
            ...prev[status],
            loading: false,
            error: message,
            initialized: true,
          },
        }));
      }
    },
    [],
  );

  useEffect(() => {
    if (!queues[activeTab].initialized && !queues[activeTab].loading) {
      void loadQueue(activeTab);
    }
  }, [activeTab, loadQueue, queues]);

  const handleTabClick = useCallback((status: AdminQueueStatus) => {
    setActiveTab(status);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!activeQueue.next || activeQueue.loading) {
      return;
    }
    void loadQueue(activeTab, { append: true, cursor: activeQueue.next });
  }, [activeQueue.loading, activeQueue.next, activeTab, loadQueue]);

  const handleClaim = useCallback(
    async (row: AdminQueueRow) => {
      setClaimingCid(row.cid);
      try {
        const response = await claimRoom(row.cid);
        toast.success(`Room ${row.cid} claimed`);
        setQueues((prev) => ({
          ...prev,
          new: {
            ...prev.new,
            items: prev.new.items.filter((item) => item.cid !== row.cid),
          },
          mine: {
            ...prev.mine,
            items: insertIntoQueue(prev.mine.items, {
              ...row,
              owner_id: response.owner_id,
            }),
            initialized: true,
          },
        }));
        // Refresh lists to ensure pagination cursors stay accurate.
        void loadQueue('new');
        void loadQueue('mine');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to claim room';
        toast.error(message);
      } finally {
        setClaimingCid(null);
      }
    },
    [loadQueue],
  );

  useEffect(() => {
    let cancelled = false;
    const missing = activeQueue.items
      .map((row) => row.cid)
      .filter((cid) => {
        const status = agentStates[cid];
        return !(status && (status.loading || status.initialized));
      });

    missing.forEach((cid) => {
      setAgentStates((prev) => ({
        ...prev,
        [cid]: {
          ...(prev[cid] ?? DEFAULT_AGENT_STATUS),
          loading: true,
          error: null,
        },
      }));

      void getAgentStatus(cid)
        .then((response) => {
          if (cancelled) {
            return;
          }
          setAgentStates((prev) => ({
            ...prev,
            [cid]: {
              enabled: response.agent_enabled,
              loading: false,
              error: null,
              initialized: true,
              toggling: false,
            },
          }));
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to load agent status';
          setAgentStates((prev) => ({
            ...prev,
            [cid]: {
              ...(prev[cid] ?? DEFAULT_AGENT_STATUS),
              loading: false,
              error: message,
              initialized: true,
              toggling: false,
            },
          }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [activeQueue.items, agentStates]);

  const handleAgentToggle = useCallback(
    async (cid: string, nextEnabled: boolean) => {
      setAgentStates((prev) => ({
        ...prev,
        [cid]: {
          ...(prev[cid] ?? DEFAULT_AGENT_STATUS),
          toggling: true,
          error: null,
        },
      }));
      try {
        const response = nextEnabled ? await enableAgent(cid) : await disableAgent(cid);
        setAgentStates((prev) => ({
          ...prev,
          [cid]: {
            enabled: response.agent_enabled,
            loading: false,
            error: null,
            initialized: true,
            toggling: false,
          },
        }));
        toast.success(`Agent ${nextEnabled ? 'enabled' : 'disabled'} for ${cid}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to update agent state';
        toast.error(message);
        setAgentStates((prev) => ({
          ...prev,
          [cid]: {
            ...(prev[cid] ?? DEFAULT_AGENT_STATUS),
            error: message,
            toggling: false,
            loading: false,
            initialized: true,
          },
        }));
      }
    },
    [],
  );

  const handlePromptChange = useCallback((cid: string, value: string) => {
    setInvokePrompts((prev) => ({ ...prev, [cid]: value }));
  }, []);

  const handleInvoke = useCallback(
    async (cid: string) => {
      const prompt = (invokePrompts[cid] ?? '').trim();
      if (!prompt) {
        toast.error('Enter a prompt before invoking the agent.');
        return;
      }
      setInvoking((prev) => ({ ...prev, [cid]: true }));
      try {
        await invokeAgent(cid, { prompt });
        toast.success('Agent run queued.');
        setInvokePrompts((prev) => ({ ...prev, [cid]: '' }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to invoke agent';
        toast.error(message);
      } finally {
        setInvoking((prev) => ({ ...prev, [cid]: false }));
      }
    },
    [invokePrompts],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Chat Admin</h1>
        <p className="text-sm text-neutral-500">
          Claim inbound conversations and jump into the Stream demo UI.
        </p>
      </header>

      <nav className="flex gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              tab.key === activeTab
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="flex flex-col gap-4">
        {activeQueue.loading && !activeQueue.initialized ? (
          <p className="text-sm text-neutral-500">Loading conversations…</p>
        ) : null}
        {activeQueue.error ? (
          <p className="text-sm text-red-600">{activeQueue.error}</p>
        ) : null}
        {!activeQueue.loading && activeQueue.items.length === 0 && !activeQueue.error ? (
          <p className="text-sm text-neutral-500">No conversations to display.</p>
        ) : null}

        <ul className="flex flex-col divide-y rounded-md border">
          {activeQueue.items.map((row) => {
            const status = agentStates[row.cid] ?? DEFAULT_AGENT_STATUS;
            const statusLoading = status.loading || !status.initialized;
            const toggling = status.toggling;
            const agentEnabled = status.enabled;
            const agentError = status.error;
            const showLoadingState = status.loading && !status.initialized;
            const promptValue = invokePrompts[row.cid] ?? '';
            const isInvoking = Boolean(invoking[row.cid]);
            const disableToggle = statusLoading || toggling;
            const disableInvoke =
              isInvoking || promptValue.trim().length === 0 || statusLoading;

            return (
              <li
                key={row.cid}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2 text-sm font-medium text-neutral-700">
                    <span>{row.name ?? row.cid}</span>
                    <span className="text-xs text-neutral-400">{row.cid}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                    <span>
                      Last activity:{' '}
                      {row.last_message_at
                        ? dateFormatter.format(new Date(row.last_message_at))
                        : '—'}
                    </span>
                    <span>Owner: {row.owner_id ?? 'Unassigned'}</span>
                    <span>Unread: {row.unread_count ?? 0}</span>
                  </div>
                  <p className="mt-2 overflow-hidden text-ellipsis text-sm text-neutral-600">
                    {row.last_text ?? 'No messages yet'}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-80">
                  <div className="flex w-full flex-col gap-2 rounded-md border border-neutral-200 p-3">
                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        checked={agentEnabled}
                        onChange={() => handleAgentToggle(row.cid, !agentEnabled)}
                        disabled={disableToggle}
                      />
                      <span>Auto-reply agent</span>
                    </label>
                    {showLoadingState ? (
                      <span className="text-xs text-neutral-400">Loading agent status…</span>
                    ) : null}
                    {agentError ? (
                      <span className="text-xs text-red-600">{agentError}</span>
                    ) : null}
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={promptValue}
                        onChange={(event) =>
                          handlePromptChange(row.cid, event.target.value)
                        }
                        placeholder="Prompt"
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleInvoke(row.cid)}
                        disabled={disableInvoke}
                        className="inline-flex items-center justify-center rounded-md border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isInvoking ? 'Invoking…' : 'Invoke agent'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/demo?cid=${encodeURIComponent(row.cid)}`}
                      className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-400"
                    >
                      Open in demo
                    </Link>
                    {activeTab === 'new' ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(row)}
                        disabled={claimingCid === row.cid}
                        className="inline-flex items-center rounded-md border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {claimingCid === row.cid ? 'Claiming…' : 'Claim'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {activeQueue.next ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={activeQueue.loading}
            className="self-start rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeQueue.loading ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function insertIntoQueue(items: AdminQueueRow[], row: AdminQueueRow): AdminQueueRow[] {
  const next = [...items, row];
  next.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    if (aTime === bTime) {
      return a.cid.localeCompare(b.cid);
    }
    return bTime - aTime;
  });
  return next;
}
