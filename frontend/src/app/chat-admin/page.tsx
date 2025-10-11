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
          {activeQueue.items.map((row) => (
            <li key={row.cid} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
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
              <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
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
            </li>
          ))}
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
