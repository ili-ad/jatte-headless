'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  type AgentPolicy,
  type AgentRunSummary,
  type AgentSimulationResponse,
  type AgentSkill,
  type AgentSkillToggle,
  getAgentPolicy,
  getAgentSkills,
  listAgentRuns,
  simulateAgent,
  updateAgentPolicy,
  updateAgentSkills,
} from '../../../lib/chat-addons/agentApi';

interface RunsState {
  results: AgentRunSummary[];
  next: string | null;
  loading: boolean;
  error: string | null;
}

const STATUS_OPTIONS: Array<'all' | AgentRunSummary['status']> = [
  'all',
  'ok',
  'handoff',
  'capped',
  'error',
];

const DEFAULT_RUNS_STATE: RunsState = {
  results: [],
  next: null,
  loading: false,
  error: null,
};

export default function AgentAdminPage(): JSX.Element {
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') ?? '';

  const [policyDraft, setPolicyDraft] = useState<AgentPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySuccess, setPolicySuccess] = useState<string | null>(null);

  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillsSuccess, setSkillsSuccess] = useState<string | null>(null);

  const [runsState, setRunsState] = useState<RunsState>(DEFAULT_RUNS_STATE);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('all');

  const [simulationPrompt, setSimulationPrompt] = useState('');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<AgentSimulationResponse | null>(null);

  useEffect(() => {
    setPolicyDraft(null);
    setSkills([]);
    setRunsState(DEFAULT_RUNS_STATE);
    setSimulationResult(null);
    setSimulationError(null);
  }, [cid]);

  const loadPolicy = useCallback(async () => {
    if (!cid) {
      return;
    }
    setPolicyLoading(true);
    setPolicyError(null);
    setPolicySuccess(null);
    try {
      const payload = await getAgentPolicy(cid);
      setPolicyDraft(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load policy';
      setPolicyError(message);
    } finally {
      setPolicyLoading(false);
    }
  }, [cid]);

  const loadSkills = useCallback(async () => {
    if (!cid) {
      return;
    }
    setSkillsLoading(true);
    setSkillsError(null);
    setSkillsSuccess(null);
    try {
      const payload = await getAgentSkills(cid);
      setSkills(payload.skills);
      setPolicyDraft((prev) =>
        prev ? { ...prev, enabled_skills: payload.skills.filter((skill) => skill.enabled).map((skill) => skill.name) } : prev,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load skills';
      setSkillsError(message);
    } finally {
      setSkillsLoading(false);
    }
  }, [cid]);

  const loadRuns = useCallback(
    async (cursor?: string, append = false) => {
      if (!cid || runsState.loading) {
        return;
      }
      setRunsState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await listAgentRuns({ cid, limit: 25, cursor });
        setRunsState((prev) => ({
          results: append ? [...prev.results, ...response.results] : response.results,
          next: response.next ?? null,
          loading: false,
          error: null,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load runs';
        setRunsState((prev) => ({ ...prev, loading: false, error: message }));
      }
    },
    [cid, runsState.loading],
  );

  useEffect(() => {
    if (!cid) {
      return;
    }
    void loadPolicy();
    void loadSkills();
    setRunsState(DEFAULT_RUNS_STATE);
    void loadRuns();
  }, [cid, loadPolicy, loadRuns, loadSkills]);

  const handlePolicyChange = useCallback(
    <K extends keyof AgentPolicy>(field: K, value: AgentPolicy[K]) => {
      setPolicyDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
      setPolicySuccess(null);
    },
    [],
  );

  const handlePolicySubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!policyDraft || policySaving) {
        return;
      }
      setPolicySaving(true);
      setPolicyError(null);
      setPolicySuccess(null);
      try {
        const updated = await updateAgentPolicy(policyDraft);
        setPolicyDraft(updated);
        setPolicySuccess('Policy saved successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save policy';
        setPolicyError(message);
      } finally {
        setPolicySaving(false);
      }
    },
    [policyDraft, policySaving],
  );

  const handleSkillToggle = useCallback((skill: AgentSkill) => {
    setSkills((prev) =>
      prev.map((entry) =>
        entry.name === skill.name
          ? { ...entry, enabled: !entry.enabled }
          : entry,
      ),
    );
    setSkillsSuccess(null);
  }, []);

  const handleSkillsSave = useCallback(async () => {
    if (!cid || skillsSaving) {
      return;
    }
    setSkillsSaving(true);
    setSkillsError(null);
    setSkillsSuccess(null);
    const payload: AgentSkillToggle[] = skills.map(({ name, enabled }) => ({ name, enabled }));
    try {
      const response = await updateAgentSkills({ cid, skills: payload });
      setSkills(response.skills);
      setSkillsSuccess('Skill settings updated.');
      setPolicyDraft((prev) =>
        prev
          ? {
              ...prev,
              enabled_skills: response.skills.filter((entry) => entry.enabled).map((entry) => entry.name),
            }
          : prev,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save skills';
      setSkillsError(message);
    } finally {
      setSkillsSaving(false);
    }
  }, [cid, skills, skillsSaving]);

  const filteredRuns = useMemo(() => {
    if (statusFilter === 'all') {
      return runsState.results;
    }
    return runsState.results.filter((run) => run.status === statusFilter);
  }, [runsState.results, statusFilter]);

  const handleSimulate = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!cid || simulationLoading) {
        return;
      }
      const trimmedPrompt = simulationPrompt.trim();
      if (!trimmedPrompt) {
        setSimulationError('Prompt is required.');
        return;
      }
      setSimulationLoading(true);
      setSimulationError(null);
      setSimulationResult(null);
      try {
        const payload = await simulateAgent({ cid, prompt: trimmedPrompt });
        setSimulationResult(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Simulation failed';
        setSimulationError(message);
      } finally {
        setSimulationLoading(false);
      }
    },
    [cid, simulationLoading, simulationPrompt],
  );

  if (!cid) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Agent controls</h1>
          <p className="text-sm text-gray-600">
            Provide a <code className="rounded bg-gray-100 px-1">cid</code> query parameter to manage an agent room.
          </p>
        </header>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Agent controls</h1>
        <p className="text-sm text-gray-600">Manage policy, skills, and run analytics for {cid}.</p>
      </header>

      <section className="space-y-4 rounded-md border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Policy &amp; skills</h2>
          <span className="text-xs text-gray-500">CID: {cid}</span>
        </div>
        {policyError ? <p className="text-sm text-red-600">{policyError}</p> : null}
        {policySuccess ? <p className="text-sm text-green-600">{policySuccess}</p> : null}
        <form className="space-y-4" onSubmit={handlePolicySubmit}>
          <fieldset className="grid gap-4 sm:grid-cols-2" disabled={policyLoading}>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={policyDraft?.agent_enabled ?? false}
                onChange={(event) => handlePolicyChange('agent_enabled', event.target.checked)}
              />
              Agent enabled
            </label>
            <label className="text-sm font-medium">
              <span>Auto reply mode</span>
              <select
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={policyDraft?.auto_reply_mode ?? 'receptionist'}
                onChange={(event) => handlePolicyChange('auto_reply_mode', event.target.value as AgentPolicy['auto_reply_mode'])}
              >
                <option value="receptionist">Receptionist</option>
                <option value="manual">Manual</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              <span>Tool hop cap</span>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={policyDraft?.tool_hop_cap ?? 0}
                onChange={(event) => handlePolicyChange('tool_hop_cap', Number.parseInt(event.target.value, 10) || 0)}
              />
            </label>
            <label className="text-sm font-medium">
              <span>Turn cap</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={policyDraft?.turn_cap ?? 1}
                onChange={(event) => handlePolicyChange('turn_cap', Number.parseInt(event.target.value, 10) || 1)}
              />
            </label>
          </fieldset>
          <label className="block text-sm font-medium">
            <span>Handoff message</span>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              rows={3}
              value={policyDraft?.handoff_message ?? ''}
              onChange={(event) => handlePolicyChange('handoff_message', event.target.value)}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 disabled:opacity-50"
              disabled={policyLoading || policySaving}
            >
              {policySaving ? 'Saving…' : 'Save policy'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Skills</h3>
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm"
              onClick={() => void loadSkills()}
              disabled={skillsLoading}
            >
              Refresh
            </button>
          </div>
          {skillsError ? <p className="text-sm text-red-600">{skillsError}</p> : null}
          {skillsSuccess ? <p className="text-sm text-green-600">{skillsSuccess}</p> : null}
          <ul className="grid gap-2 sm:grid-cols-2">
            {skills.map((skill) => (
              <li key={skill.name} className="flex items-start justify-between rounded border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium">{skill.name}</p>
                  <p className="mt-1 text-xs text-gray-600">{skill.description}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skill.enabled}
                    onChange={() => handleSkillToggle(skill)}
                  />
                  Enabled
                </label>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 disabled:opacity-50"
              onClick={() => void handleSkillsSave()}
              disabled={skillsSaving || skillsLoading || skills.length === 0}
            >
              {skillsSaving ? 'Saving…' : 'Save skills'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent runs</h2>
          <div className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <span>Status</span>
              <select
                className="rounded border px-2 py-1"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])}
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'All' : value.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => void loadRuns(undefined, false)}
              disabled={runsState.loading}
            >
              Refresh
            </button>
          </div>
        </div>
        {runsState.error ? <p className="text-sm text-red-600">{runsState.error}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Timestamp</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Tools</th>
                <th className="px-3 py-2 text-right">Latency (ms)</th>
                <th className="px-3 py-2 text-right">Tokens (in/out)</th>
                <th className="px-3 py-2 text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                    {runsState.loading ? 'Loading runs…' : 'No runs recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredRuns.map((run) => (
                  <tr key={run.run_id}>
                    <td className="px-3 py-2 align-top text-gray-700">
                      {new Date(run.ts).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-top font-medium text-gray-700">{run.status.toUpperCase()}</td>
                    <td className="px-3 py-2 align-top text-gray-600">
                      {run.tools_used.length > 0 ? run.tools_used.join(', ') : '—'}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-gray-700">{run.latency_ms}</td>
                    <td className="px-3 py-2 align-top text-right text-gray-700">
                      {run.tokens_in}/{run.tokens_out}
                    </td>
                    <td className="px-3 py-2 align-top text-right text-gray-700">{run.cost_usd.toFixed(6)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredRuns.length} of {runsState.results.length} run{runsState.results.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => void loadRuns(runsState.next ?? undefined, true)}
            disabled={!runsState.next || runsState.loading}
          >
            {runsState.loading ? 'Loading…' : runsState.next ? 'Load more' : 'No more runs'}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-medium">Simulate</h2>
        <p className="text-sm text-gray-600">
          Test a prompt against the current policy and skill configuration without posting a message.
        </p>
        <form className="space-y-3" onSubmit={handleSimulate}>
          <label className="block text-sm font-medium">
            <span>Prompt</span>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              rows={3}
              value={simulationPrompt}
              onChange={(event) => setSimulationPrompt(event.target.value)}
            />
          </label>
          {simulationError ? <p className="text-sm text-red-600">{simulationError}</p> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 disabled:opacity-50"
              disabled={simulationLoading}
            >
              {simulationLoading ? 'Simulating…' : 'Run simulation'}
            </button>
          </div>
        </form>
        {simulationResult ? (
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Reply</p>
            <p className="mt-1 whitespace-pre-wrap text-gray-800">{simulationResult.reply}</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-gray-500">Status</dt>
                <dd className="text-sm font-medium text-gray-800">{simulationResult.status.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Latency</dt>
                <dd className="text-sm text-gray-800">{simulationResult.latency_ms} ms</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Tokens</dt>
                <dd className="text-sm text-gray-800">
                  {simulationResult.tokens_in}/{simulationResult.tokens_out}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Cost</dt>
                <dd className="text-sm text-gray-800">${simulationResult.cost_usd.toFixed(6)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-gray-500">Tools used</dt>
                <dd className="text-sm text-gray-800">
                  {simulationResult.tools_used.length > 0
                    ? simulationResult.tools_used.join(', ')
                    : 'None'}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>
    </main>
  );
}
