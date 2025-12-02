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
