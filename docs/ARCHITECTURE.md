# Architecture Overview

This project mimics basic Stream Chat features with a local shim. The table below outlines which surfaces are provided by the shim versus a real Stream backend.

| Surface            | Local Shim                            | Real Stream |
|--------------------|---------------------------------------|-------------|
| REST endpoints     | Minimal stubs returning static JSON   | Full CRUD   |
| WebSocket routing  | `ws/<cid>/` echo per channel          | Multiplexed |
| Persistence        | None (in-memory only)                 | Database    |
| Auth               | Always succeeds                       | JWT / keys  |

Endpoints under `chat/api.py` are temporary shims and will evolve to store data in Redis or Django models.
