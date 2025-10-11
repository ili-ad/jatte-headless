'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type GatingRules,
  type IntakeItem,
  type IntakeStatus,
  type IntakeSummary,
  approveIntake,
  getGatingRules,
  getIntakeSummary,
  listIntake,
  rejectIntake,
  updateGatingRules,
} from '../../lib/chat-addons/admin';
import { sendSms } from '../../lib/chat-addons/integrationsApi';

interface IntakeState {
  items: IntakeItem[];
  next: string | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_INTAKE_STATE: IntakeState = {
  items: [],
  next: null,
  loading: false,
  error: null,
};

export default function ChatAdminPage() {
  const [rules, setRules] = useState<GatingRules | null>(null);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [languagesInput, setLanguagesInput] = useState('');
  const [blocklistInput, setBlocklistInput] = useState('');
  const [minLengthInput, setMinLengthInput] = useState('2');
  const [maxLengthInput, setMaxLengthInput] = useState('1000');
  const [intervalInput, setIntervalInput] = useState('5');

  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus>('pending');
  const [intakeState, setIntakeState] = useState<IntakeState>(DEFAULT_INTAKE_STATE);
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  const [summary, setSummary] = useState<IntakeSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [smsCid, setSmsCid] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsText, setSmsText] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const payload = await getGatingRules();
      setRules(payload);
      setLanguagesInput(payload.languages.join(', '));
      setBlocklistInput(payload.blocklist.join(', '));
      setMinLengthInput(String(payload.min_length));
      setMaxLengthInput(String(payload.max_length));
      setIntervalInput(String(payload.min_interval_seconds));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load gating rules';
      setRulesError(message);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const loadIntake = useCallback(
    async (status: IntakeStatus, cursor?: string, append = false) => {
      setIntakeState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      try {
        const response = await listIntake({ status, cursor });
        setIntakeState((prev) => ({
          items: append ? [...prev.items, ...response.results] : response.results,
          next: response.next ?? null,
          loading: false,
          error: null,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load intake';
        setIntakeState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [],
  );

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      const payload = await getIntakeSummary();
      setSummary(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load summary';
      setSummaryError(message);
    }
  }, []);

  const handleSmsSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (smsSending) {
        return;
      }
      const trimmedCid = smsCid.trim();
      const trimmedPhone = smsPhone.trim();
      const trimmedText = smsText.trim();
      if (!trimmedCid || !trimmedPhone || !trimmedText) {
        setSmsStatus({ variant: 'error', message: 'CID, phone number, and message are required.' });
        return;
      }
      setSmsSending(true);
      setSmsStatus(null);
      try {
        const response = await sendSms({ cid: trimmedCid, to: trimmedPhone, text: trimmedText });
        setSmsStatus({ variant: 'success', message: `SMS queued (${response.run_id.slice(0, 8)}…)` });
        setSmsText('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to send SMS';
        setSmsStatus({ variant: 'error', message });
      } finally {
        setSmsSending(false);
      }
    },
    [smsCid, smsPhone, smsText, smsSending],
  );

  useEffect(() => {
    void loadRules();
    void loadSummary();
  }, [loadRules, loadSummary]);

  useEffect(() => {
    void loadIntake(intakeStatus);
  }, [intakeStatus, loadIntake]);

  const handleRulesSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (rulesSaving) {
        return;
      }
      setRulesSaving(true);
      setRulesError(null);
      const payload: GatingRules = {
        languages: languagesInput
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        blocklist: blocklistInput
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        min_length: Number.parseInt(minLengthInput, 10) || 0,
        max_length: Number.parseInt(maxLengthInput, 10) || 0,
        min_interval_seconds: Number.parseInt(intervalInput, 10) || 0,
      };
      try {
        const updated = await updateGatingRules(payload);
        setRules(updated);
        setLanguagesInput(updated.languages.join(', '));
        setBlocklistInput(updated.blocklist.join(', '));
        setMinLengthInput(String(updated.min_length));
        setMaxLengthInput(String(updated.max_length));
        setIntervalInput(String(updated.min_interval_seconds));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update rules';
        setRulesError(message);
      } finally {
        setRulesSaving(false);
      }
    },
    [blocklistInput, intervalInput, languagesInput, maxLengthInput, minLengthInput, rulesSaving],
  );

  const handleApprove = useCallback(
    async (item: IntakeItem) => {
      setActioning((prev) => ({ ...prev, [item.message_id]: true }));
      try {
        await approveIntake(item.message_id);
        setIntakeState((prev) => ({
          ...prev,
          items: prev.items.filter((entry) => entry.message_id !== item.message_id),
        }));
        void loadSummary();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to approve message';
        setIntakeState((prev) => ({ ...prev, error: message }));
      } finally {
        setActioning((prev) => ({ ...prev, [item.message_id]: false }));
      }
    },
    [loadSummary],
  );

  const handleReject = useCallback(
    async (item: IntakeItem) => {
      const reason = window.prompt('Reason for rejection', item.reason ?? 'spam') ?? 'spam';
      const mute = window.confirm('Mute sender for this room?');
      setActioning((prev) => ({ ...prev, [item.message_id]: true }));
      try {
        await rejectIntake(item.message_id, { reason, mute });
        setIntakeState((prev) => ({
          ...prev,
          items: prev.items.filter((entry) => entry.message_id !== item.message_id),
        }));
        void loadSummary();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to reject message';
        setIntakeState((prev) => ({ ...prev, error: message }));
      } finally {
        setActioning((prev) => ({ ...prev, [item.message_id]: false }));
      }
    },
    [loadSummary],
  );

  const languagesPreview = useMemo(() => languagesInput.trim() || '—', [languagesInput]);
  const blocklistPreview = useMemo(() => blocklistInput.trim() || '—', [blocklistInput]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Chat admin console</h1>
        <p className="text-sm text-gray-600">
          Review first-message intake decisions and adjust gating rules for unknown visitors.
        </p>
      </header>

      <section className="rounded-md border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Intake summary</h2>
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void loadSummary()}
          >
            Refresh
          </button>
        </div>
        {summaryError ? (
          <p className="mt-3 text-sm text-red-600">{summaryError}</p>
        ) : summary ? (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Pending</dt>
              <dd className="text-lg font-semibold">{summary.intake.pending}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Rejected</dt>
              <dd className="text-lg font-semibold">{summary.intake.rejected}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Loading summary…</p>
        )}
      </section>

      <section className="rounded-md border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-medium">SMS bridge</h2>
        <p className="mt-1 text-sm text-gray-600">
          Send a quick SMS reply to the participant linked to a room. Messages are queued with the
          chat timeline and marked as pending until a delivery receipt arrives.
        </p>
        {smsStatus ? (
          <p
            className={`mt-3 text-sm ${
              smsStatus.variant === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {smsStatus.message}
          </p>
        ) : null}
        <form className="mt-4 space-y-3" onSubmit={handleSmsSubmit}>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <label className="text-sm font-medium">
              <span>Room CID</span>
              <input
                type="text"
                value={smsCid}
                onChange={(event) => setSmsCid(event.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="messaging:<room-uuid>"
              />
            </label>
            <label className="text-sm font-medium">
              <span>Phone number</span>
              <input
                type="tel"
                value={smsPhone}
                onChange={(event) => setSmsPhone(event.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="+15551234567"
              />
            </label>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="sms-text">
              Message
            </label>
            <textarea
              id="sms-text"
              value={smsText}
              onChange={(event) => setSmsText(event.target.value)}
              className="min-h-[96px] rounded border px-3 py-2 text-sm"
              placeholder="Type the SMS to send"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={smsSending}
            >
              {smsSending ? 'Sending…' : 'Send SMS'}
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              onClick={() => {
                setSmsStatus(null);
                setSmsText('');
              }}
              disabled={smsSending}
            >
              Reset message
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-md border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-medium">Gating rules</h2>
        {rulesError ? <p className="mt-2 text-sm text-red-600">{rulesError}</p> : null}
        {rulesLoading && !rules ? (
          <p className="mt-4 text-sm text-gray-500">Loading current rules…</p>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleRulesSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Allowed languages</label>
              <input
                type="text"
                value={languagesInput}
                onChange={(event) => setLanguagesInput(event.target.value)}
                className="rounded border px-3 py-2 text-sm"
                placeholder="en, es"
              />
              <p className="text-xs text-gray-500">Comma separated ISO codes. Current: {languagesPreview}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
              <label className="text-sm font-medium">
                <span>Min length</span>
                <input
                  type="number"
                  min={0}
                  value={minLengthInput}
                  onChange={(event) => setMinLengthInput(event.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium">
                <span>Max length</span>
                <input
                  type="number"
                  min={1}
                  value={maxLengthInput}
                  onChange={(event) => setMaxLengthInput(event.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium">
                <span>Min interval (seconds)</span>
                <input
                  type="number"
                  min={0}
                  value={intervalInput}
                  onChange={(event) => setIntervalInput(event.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Blocklist terms</label>
              <input
                type="text"
                value={blocklistInput}
                onChange={(event) => setBlocklistInput(event.target.value)}
                className="rounded border px-3 py-2 text-sm"
                placeholder="casino, viagra"
              />
              <p className="text-xs text-gray-500">Comma separated terms. Current: {blocklistPreview}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={rulesSaving}
              >
                {rulesSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="rounded border px-4 py-2 text-sm"
                onClick={() => void loadRules()}
                disabled={rulesSaving}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </section>

  <section className="rounded-md border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">Intake review</h2>
          <div className="flex items-center gap-2 text-sm">
            {(['pending', 'rejected', 'all'] as IntakeStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                className={`rounded px-3 py-1 ${
                  intakeStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700'
                }`}
                onClick={() => setIntakeStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => void loadIntake(intakeStatus)}
            >
              Refresh
            </button>
          </div>
        </div>
        {intakeState.error ? (
          <p className="mt-3 text-sm text-red-600">{intakeState.error}</p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 font-medium text-gray-600">Message</th>
                <th className="px-3 py-2 font-medium text-gray-600">CID</th>
                <th className="px-3 py-2 font-medium text-gray-600">User</th>
                <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {intakeState.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                    {intakeState.loading ? 'Loading intake…' : 'No messages in this view'}
                  </td>
                </tr>
              ) : (
                intakeState.items.map((item) => (
                  <tr key={item.message_id} className="border-b last:border-0">
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-xs break-words text-gray-900">{item.text}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">{item.cid}</td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">{item.user_id}</td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">
                      {item.status}
                      {item.reason ? <div className="text-xs text-gray-500">{item.reason}</div> : null}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-2 text-sm">
                        <button
                          type="button"
                          className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-60"
                          onClick={() => void handleApprove(item)}
                          disabled={!!actioning[item.message_id]}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-60"
                          onClick={() => void handleReject(item)}
                          disabled={!!actioning[item.message_id]}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {intakeState.next ? (
          <div className="mt-4">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              disabled={intakeState.loading}
              onClick={() => void loadIntake(intakeStatus, intakeState.next ?? undefined, true)}
            >
              {intakeState.loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
