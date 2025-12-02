# GPT agent streaming timeout investigation

## Summary

Agent invocations could hang for 30+ seconds because the LLM provider call
was not guarded by a hard wall-clock timeout. When the upstream SDK failed to
return or respect its own timeout parameter, the request thread stayed blocked
and Daphne eventually killed the scope, producing 500/ECONNRESET responses in
the frontend.

## Fix

* Wrapped all LLM provider calls in a short-lived `ThreadPoolExecutor` and use
  `future.result(timeout=...)` to enforce the configured `AGENT_TIMEOUT_SEC`.
  Any overrun now raises `TimeoutError`, which the orchestration layer converts
  into a handoff/error response instead of hanging the request.
* Added a regression test to ensure the agent service returns within the
  timeout window and surfaces an error reason when the provider sleeps longer
  than allowed.

## 2025-02-06 follow-up instrumentation

* Added explicit latency logs around `AgentService.generate` and the LLM
  leg inside `_orchestrate` so we can see when the LLM call starts/finishes
  and how long the whole invocation took end-to-end.
* Tightened `_execute_with_timeout` to shut down its thread pool without
  waiting when a timeout occurs, eliminating the extra ~1s hang from
  waiting on the worker thread to finish sleeping.
* Standardized the canned handoff text across `AgentService` and the canned
  provider and ensured timeouts surface `reason="error"` with the handoff
  reply.
