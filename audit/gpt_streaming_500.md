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

## 2025-02-08 streaming timeout handling

* Split streaming vs. non-streaming timeouts (`AGENT_STREAMING_TIMEOUT_SEC`),
  routing streaming calls through the longer budget while keeping strict
  protection on classic calls.
* `_call_llm_streaming` now catches `TimeoutError`, logs
  `agent.llm.streaming_timeout` with `cid`/`trace_id`, and persists a final AI
  message marked `ai_state=AI_STATE_IDLE` with `error_reason="timeout"` and the
  fallback handoff text.
* Guarded `AgentLLMInvokeView` with explicit timeout handling (HTTP 502 + JSON
  body) to avoid uncaught exceptions bubbling into 500/ECONNRESET responses.
* Tightened `LLMClient.run_streaming` to scope the wall-clock timeout strictly
  around the provider call and harmonized the raised `TimeoutError` so it is
  handled gracefully by the agent service and view layer.
