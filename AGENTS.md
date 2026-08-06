# AGENTS.md

This repository implements a Django/DRF/Channels backend that emulates the subset of Stream Chat used by the JATTE frontend.

Priorities:
- Preserve frontend compatibility with the existing Stream Chat React client usage.
- Prefer small, test-backed patches over broad rewrites.
- Treat authentication, channel membership, WebSocket subscriptions, attachments, CORS/CSRF, and event delivery as high-risk areas.
- Do not rename public API routes or response fields unless tests and migration notes are provided.
- Do not introduce external managed chat services.
- When reviewing, classify findings as must-fix, should-fix, tests-needed, or defer.
