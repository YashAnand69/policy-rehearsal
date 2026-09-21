# Bounded production proposal (conditional on discovery)

## Goal

Enable a reviewer to understand a proposed policy edit using a reproducible comparison against sanitized action fixtures. This is an ownership proposal, not an agreed scope, quote, or delivery promise.

## Suggested paid pilot

A five-working-day target after access and evaluation contract are available:

1. Confirm users, rule semantics, allowed fixture fields, and an acceptance dataset with Aadil.
2. Add a read-only comparison endpoint around Pushary's authoritative evaluator. Candidate and baseline must be immutable snapshots; no notification, approval, permit consumption, or actual tool execution.
3. Adapt the React surface to Pushary's existing component system and authenticated workspace boundaries.
4. Add reproducible report export, parity tests, and relevant accessibility/interaction checks.
5. Demo against agreed fixtures and hand over a reviewed PR, tests, and maintenance notes.

If there is no candidate-evaluation boundary yet, begin with a smaller paid contract-design spike; do not silently grow a five-day frontend pilot into a new policy engine.

## Acceptance

- Every fixture evaluated against both exact version IDs; all results explain rule provenance.
- Newly allowed actions visible immediately; restrictive changes still visible.
- Missing/invalid facts, threshold equality and overlapping rules match the authoritative engine.
- Stale inputs cannot be mistaken for a current report.
- Workspace scoping and access checked server-side; fixture/report data sanitized and bounded.
- Failures are distinct from a policy verdict; partial results cannot imply complete coverage.
- A rerun of the same versions and fixtures is deterministic.

## Prototype seams

`compare` currently calls the pure local evaluator twice. Replace that dependency with a server-owned evaluation adapter; do not forward a browser's `allow` verdict to any execution path. The current JSON schema is an illustrative fixture format. Map a real export only after confirming the documented fields and redaction rules. A deployment checklist is outside this prototype: the final workflow may end with review rather than publishing.

## Out of scope

Policy-engine replacement, notification delivery, phone UI, billing, marketplace, cross-framework execution, security certification, and complete historical log ingestion. Execution permits and crash recovery remain the existing platform's concern. No customer data is needed to validate this concept.

## Discovery measure

Observe whether a reviewer can explain all changed decisions and identify one unintended allow in a seeded comparison. Then measure review time and corrections during a small trial. No conversion, safety, or support reduction is claimed from synthetic fixtures.
