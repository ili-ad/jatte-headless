# Phase One State-Aware Workflow Contract v1

**Repo:** `ili-ad/ntomono01`
**Primary app:** `apps/nto-next`
**Backend counterpart:** `apps/django`
**Status:** Contract freeze for Phase One
**Scope:** NTO Phase One only
**Last updated:** 2026-04-09

This document freezes the route, query-param, session-context, and navigation contract for the Phase One forms workflow.

It exists to prevent the product from being accidentally designed around the linear fallback path and only later retrofitted into a state-aware hub-and-spokes workflow.

This document is intentionally about workflow contract, not visual design.

---

## Purpose

Phase One is the transactional workflow and product shell that sits on top of the Phase Zero backbone.

The primary workflow model is:

* **state-aware hub-and-spokes**

The fallback workflow model is:

* **linear/manual wizard**

These are not competing product models. The hub-and-spokes path is the main product assumption. The wizard exists as a fallback for incomplete context, weak upstream confidence, manual completion, or edge cases.

---

## Primary architectural decision

### Canonical product assumption

The canonical product assumption for Phase One is:

* the user lands in a session-backed context
* that context is represented by `sid`
* `/confirm` is the canonical hub for that session
* downstream tools behave as spokes around that hub
* the wizard remains available, but is not the defining mental model of the product

### Fallback model

The linear wizard remains intact and remains operational.

Its role is:

* fallback for incomplete or weak context
* safe manual completion path
* compatibility path while the hub model hardens

The wizard must not become the hidden default architecture merely because it already exists.

---

## Non-negotiables

1. **Do not redesign Phase Zero**

   * Coverage v2, parcel baseline posture, QC media posture, and scraper-published backbone data are inputs to Phase One.
   * Phase One consumes them.

2. **Do not over-settle `/confirm` before ingress is settled**

   * Ingress semantics must be explicit before `/confirm` is treated as fully canonical.

3. **SSR-first remains the default**

   * Session-backed hub rendering should be SSR-first where feasible.
   * Existing client-only islands remain exceptions, not the rule.

4. **Keep the existing wizard intact in Phase One**

   * Current manual flow remains operational:

     * `package → qc → map → parcel-research → form → print-or-send → done`

5. **Prefer durable route and state contracts over UI polish**

   * Decorative refinement is downstream of semantic stability.

---

## Scope boundary

This contract governs:

* route semantics
* query-param semantics
* session identity
* session context ownership
* auto/manual navigation semantics
* hub/spoke expectations
* ingress handoff expectations
* paid/unpaid threshold semantics at the workflow-contract level

This contract does **not** govern:

* matching algorithm quality
* scoring thresholds
* parcel provider internals
* OCR or extraction heuristics
* public marketing copy
* visual design details
* receipts/highlights/bbox linking
* full post-submit dashboard feature design

---

## Current Phase One surfaces

### Public ingress

Public ingress is the threshold where the user begins the NTO workflow.

For Phase One, this includes:

* address/jobsite selection
* role and document selection
* optional active NOC derivation or candidate selection
* handoff into a session-backed forms route

### Hub

The hub route is:

* `/forms/:state/:docType/confirm`

### Spokes

Spokes are existing tools/editors accessed from the hub, including:

* QC
* Map
* Parcel Research
* Form
* Print or Send

### Fallback wizard

The wizard sequence remains:

* `package`
* `qc`
* `map`
* `parcel-research`
* `form`
* `print-or-send`
* `done`

---

## Identity and state model

### `sid`

`sid` is the canonical Phase One workflow identity.

It represents:

* the draft or active submission session
* the server-backed session context for the workflow
* the stable identity shared by the hub and its spokes

Rules:

* `/confirm` is canonical only once a `sid` exists
* spokes entered from the hub must preserve `sid`
* mode toggles must preserve `sid`
* refresh on hub or spoke must remain interpretable from `sid` plus route/query, not from lucky client memory alone

### `candidateId`

`candidateId` is an ingress or route hint.

It is **not** the long-term source of truth.

Rules:

* `candidateId` may appear in query during ingress or deep-linking
* once session context is patched, canonical candidate state lives in server session context
* long-lived workflow logic should prefer `selectedCandidateId` from server session context over raw query `candidateId`

### `selectedCandidateId`

`selectedCandidateId` is the canonical selected NOC reference for Phase One.

Rules:

* it lives in server session context
* it may be seeded from ingress query or client-store context
* once present in session context, it is the canonical candidate identity for hub/spoke rendering

### `modePreference`

`modePreference` records the last chosen navigation skin:

* `auto`
* `manual`

Rules:

* it is advisory, not authoritative business state
* it exists to preserve navigation preference, not entitlements or matching truth
* mode changes must not mutate paid/unpaid state, candidate truth, or jobsite truth

---

## Session context ownership

The canonical Phase One session context fields are:

* `jobsiteAddress`
* `jobsiteLat`
* `jobsiteLng`
* `selectedCandidateId`
* `modePreference`

Rules:

1. server session context is canonical after bootstrap
2. client store may seed or hydrate this context
3. route query may seed this context
4. but steady-state workflow behavior should resolve from server session context where available

This means:

* client store is allowed as a staging layer
* query is allowed as an ingress layer
* server session context is the steady-state contract layer

---

## Route contract

### Manual routes

Manual routes remain step-based:

* `/forms/:state/:docType/:step`

Examples:

* `/forms/fl/notice-to-owner/map?sid=<sid>`
* `/forms/fl/notice-to-owner/form?sid=<sid>`

### Hub route

Hub route:

* `/forms/:state/:docType/confirm?sid=<sid>`

Rules:

* `confirm` is a hub route
* `confirm` is not part of the linear step registry
* hub rendering without `sid` is allowed only as a bootstrap state, not as a settled steady-state

### Spoke routes

Spokes remain existing routes, but when entered from the hub they must preserve:

* `sid`
* sanitized `returnTo`

Canonical pattern:

* `/forms/:state/:docType/qc?sid=<sid>&returnTo=<encoded-confirm-url>`
* `/forms/:state/:docType/map?sid=<sid>&returnTo=<encoded-confirm-url>`
* `/forms/:state/:docType/parcel-research?sid=<sid>&returnTo=<encoded-confirm-url>`
* `/forms/:state/:docType/form?sid=<sid>&returnTo=<encoded-confirm-url>`
* `/forms/:state/:docType/print-or-send?sid=<sid>&returnTo=<encoded-confirm-url>`

---

## Query-param contract

### `sid`

`sid` is the only required durable workflow param.

Rules:

* required for steady-state hub behavior
* required for hub-entered spoke behavior
* must never be silently dropped by navigation helpers

### `returnTo`

`returnTo` is a navigation param for spoke-to-hub return.

Rules:

* must be a relative path
* must not include protocol or host
* must be sanitized
* for Phase One hub/spoke contract, valid `returnTo` values must point back to `/confirm`
* non-confirm `returnTo` values are treated as invalid for hub semantics

`returnTo` is navigation-only.
It does not define entitlement state, candidate truth, or workflow truth.

### `candidateId`

`candidateId` is allowed only as:

* ingress hint
* deep-link hint
* initial route seed for QC-like routes

It should not be treated as a permanent workflow truth once session context is established.

---

## Ingress contract

Ingress is the immediate next Phase One hardening target.

The minimum viable ingress lane is:

1. public entry threshold
2. address/jobsite selection
3. active NOC derivation, candidate selection, or explicit manual/no-selection branch
4. session bootstrap
5. session-context patch
6. canonical handoff to `/confirm?sid=...`

Rules:

* ingress must create or recover a `sid`
* ingress must patch known jobsite context into the session
* if a candidate is selected upstream, ingress must patch it into session context
* if no candidate is selected, ingress must still land in a valid session-backed `/confirm`
* weak or incomplete upstream context must degrade into manual completion, not into broken pseudo-automation

### What ingress must not do

Ingress must not:

* settle the product around the wizard as the default mental model
* make `/confirm` depend on ephemeral local-only state
* require broad public-site redesign before workflow truth is stable
* reopen broad Phase Zero architecture

---

## Hub contract

`/confirm` is the canonical hub for a session, but only after ingress semantics are explicit.

The hub is responsible for:

* showing session-backed context
* showing paid/unpaid threshold clearly
* showing whether the current state is strong, weak, or incomplete
* launching spokes with preserved `sid` and `returnTo`
* acting as the center of gravity for review-and-edit behavior

The hub is **not** responsible for:

* re-solving ingress ambiguity that should have been settled earlier
* hiding incomplete context behind decorative polish
* replacing all spoke logic with summary UI

---

## Spoke contract

Spokes are editors/workspaces around a shared session.

Each spoke must:

1. accept `sid`
2. preserve `sid`
3. accept sanitized hub `returnTo`
4. allow return to hub when entered from hub
5. avoid surprising redirects into unrelated surfaces
6. resolve canonical context from session where possible

### QC spoke

QC should resolve candidate truth from:

1. session `selectedCandidateId`
2. fallback query `candidateId` only when needed

### Map spoke

Map should treat missing jobsite context as an explicit state, not a silent failure.

### Parcel Research spoke

Parcel research should behave as a true spoke, not a hidden detour into package-first logic.

### Form workspace

Form should be a reviewable/editable workspace around known workflow context, not just an isolated terminal page.

### Print or Send

Print or Send should reflect entitlement truth and remain session-aware.

---

## Auto/manual contract

### Core rule

Auto and Manual are navigation skins over the same session.

They do not represent different business objects.

### Auto

Auto means:

* hub-first orientation
* `/confirm` as the center
* spokes launched from the hub
* return-to-hub semantics preserved

### Manual

Manual means:

* linear wizard traversal
* same `sid`
* same session context
* same entitlement truth
* same candidate truth
* same jobsite truth

### Mode toggle rules

Mode toggles must:

* preserve `sid`
* preserve canonical workflow truth
* preserve return-to-hub semantics where relevant
* avoid dropping user context

Mode toggles must not:

* create a new session unless no session exists
* change plan state
* change payment state
* change selected candidate truth
* change jobsite truth

---

## Entitlement contract

Entitlements are resolved from server-backed session state.

Rules:

* payment/unlock truth is not inferred from client UI state
* hub and spokes must render based on resolved entitlement state
* manual flow remains available where the business model allows it
* paid-only capabilities must be explicit, not implied

The contract boundary here is semantic, not pricing-design specific.

This document does not freeze pricing copy.
It freezes the fact that entitlement truth is server-backed and shared across hub and spokes.

---

## Source-of-truth hierarchy

When multiple layers exist, resolve truth in this order:

### Session-backed workflow truth

1. server session context via `sid`

### Ingress or deep-link seed

2. sanitized query params

### Client staging memory

3. client store

This ordering is intentional.

Client store is useful for capture and UX continuity, but it should not be the settled workflow authority once `sid` exists.

---

## Guardrails

1. Do not let the wizard silently become the main product architecture.
2. Do not over-design `/confirm` before ingress is explicit.
3. Do not reopen broad Phase Zero questions.
4. Do not let spokes invent their own route grammar.
5. Do not allow raw string route construction to drift away from shared helpers.
6. Do not treat `candidateId` query as long-term canonical truth.
7. Do not let paid/unpaid logic fork into separate incompatible workflows.
8. Do not depend on refresh-fragile local state once session context exists.

---

## Acceptance criteria for this contract freeze

This contract is considered frozen when the repo satisfies all of the following:

1. There is one canonical meaning for `sid`.
2. There is one canonical meaning for `selectedCandidateId`.
3. `candidateId` is explicitly defined as a seed/hint, not long-term truth.
4. `returnTo` is explicitly defined and sanitized.
5. Hub-entered spokes preserve `sid` and sanitized `returnTo`.
6. Manual/Auto toggles preserve `sid` and shared session truth.
7. `/confirm` is treated as a hub route, not a hidden wizard step.
8. Ingress into `/confirm` is session-backed and explicit.
9. Refresh on hub or spoke is interpretable from route plus server session state.
10. The contract is reflected in shared navigation helpers and route wrappers, not only in prose.

---

## Out of scope for ONE-01

ONE-01 does **not** include:

* redesigning `/confirm`
* hardening the full public ingress UI
* reworking NOC matching quality
* expanding parcel provider capabilities
* reworking the public marketing site
* implementing post-submit dashboard design
* redefining pricing/packages
* rebuilding Phase Zero backbone

Those belong in later backlog items, especially ONE-02 and beyond.

---

## Immediate next step

After this contract freeze, the immediate next implementation step is:

* **ONE-02: Minimum viable ingress lane into `/confirm`**

That work should harden:

* entry threshold
* jobsite selection
* candidate derivation/selection or explicit manual branch
* `sid` bootstrap
* session-context patch
* canonical redirect/handoff into `/confirm`

---

If you want this in next-pass form, the most natural follow-on is for me to turn this into the exact Codex ticket for ONE-01 implementation, with file targets, deltas, and acceptance criteria tied to the current repo.
