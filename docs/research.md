# Public evidence and opportunity selection

Reviewed September 20–21, 2026. Public pages, GitHub repository metadata, and selected source files were inspected. No Pushary account, paid workspace, customer interview, or live approval delivery was tested. Search index excerpts lagged the directly opened pages; current pages and GitHub API timestamps took precedence.

## Decision

Build **Policy Rehearsal**: compare baseline and candidate authorization rules on the same bounded set of action fixtures, highlight newly permitted actions, explain the differences, export a review report.

**Hypothesis, not a known customer request:** people editing Partner authorization rules may benefit from assessing a batch of changed decisions before rollout. The exact workflow was not found in the reviewed public docs, repository listings, selected source, or targeted searches. It may exist privately or be planned. Ask Aadil before extending the prototype.

## Evidence ledger

| Source | Observed public evidence | Relevance and limit |
| --- | --- | --- |
| [About](https://pushary.com/about) | Founder Aadil Ghani still writes code; business contact is business@pushary.com and X is @aadilbuilds. Policies, Fleet Board, Policy Autopilot, and shared audit exports appear in the product offering. | Supports founder-directed, technical outreach. Does not establish budget, contractor appetite, or team pain. |
| [Partner product](https://pushary.com/partners) | Authorization evaluates named actions and parameters with allow, deny, and human-review outcomes. | Stronger product anchor than a generic integration directory. |
| [Threshold engineering post, Aug 23](https://pushary.com/blog/ai-agent-approval-threshold) | Aadil discusses restrictive rule precedence, missing facts, numeric strings, and repeat execution. | Informs the sample cases. The demo covers verdict changes, not execution guarantees. |
| [Integration testing docs](https://pushary.com/docs/agents/embed-testing) | An authenticated API sandbox already exercises outcomes and recovery; it is separate from the public demo and test-approval card. | Do not pitch a new sandbox. The proposed addition is a comparative review of a candidate policy. |
| [Policy docs](https://pushary.com/docs/agents/policies) | Coding-agent hook policies use tool patterns and specificity, modes, and timeouts. | Keep these separate from Partner authorization precedence; this prototype targets the latter. |
| [REST reference](https://pushary.com/docs/agents/reference/api) | Public OpenAPI document and SDK entry points. | A future adapter has a documented integration surface, but candidate-policy evaluation must be confirmed. |
| [Changelog](https://pushary.com/docs/changelog) | August enforced gates and shared adapter kernel; July Partner and framework work. An older roadmap lists a Q3 integrations marketplace among web-push items. | That roadmap context is insufficient evidence for a current agent marketplace project. Reject the earlier marketplace pitch. |
| [Pushary Isle announcement, Sep 17](https://pushary.com/blog/pushary-isle-mac-notch-app) | A new Mac approval surface is a recent public launch. | Shows ongoing product work; does not prove a gap in the web console. |
| [GitHub organization](https://github.com/Pushary) | Live API returned 22 public repos; Mac/tap activity on Sep 20, adapters/plugins updated through September. | Search snippets listing 12 repos were stale. No claim that the public repos expose the whole product. |
| [Server SDK](https://github.com/Pushary/pushary-server) | Public client, adapter kernel, authorization types and tests. Inspected commit `4a20a66a55242a252ee01b57e94f59aa0b262b95`. Types identify production policy core as private. | A browser copy cannot claim engine parity. `protect` documents at-most-once permit consumption; do not describe this demo as execution protection. |
| [OpenAI adapter](https://github.com/Pushary/pushary-openai-agents) | Explicit gate/interrupt resolution and shared kernel. | Another generic gate or adapter would duplicate existing work. |
| [Public issue #3](https://github.com/Pushary/pushary-skill/issues/3) | Requests a tested Windows PowerShell setup walkthrough and real version/transcript evidence. | Concrete contributor opportunity, but not the best React/TypeScript paid-product wedge; cannot claim Windows validation on this Mac. |

## Why this one wins

- **Specific product fit:** a review surface over the policy system Pushary already develops.
- **Demonstrable in a minute:** change $500 to $1,000; inspect the four newly allowed sample refunds.
- **Bounded ownership:** UI, fixture mapping, comparison report, and contract tests could be a small paid feature after discovery.
- **Respects existing infrastructure:** use the authoritative evaluator for a production version rather than selling a parallel policy engine.
- **Honest uncertainty:** “would this help your users?” rather than “your users are blocked by this.”

Rejected: Fleet Board/approval queue (already exists); generic marketplace (roadmap ambiguity and existing adapters); sandbox/outcome simulator (already documented); production gate (existing kernel and outside a frontend proof-of-work scope).

## Portfolio evidence

Authenticated GitHub account: `YashAnand69`. Only public projects are used as prospect-facing proof; private repositories were not published or linked in the pitch.

1. [Live PR Fixer / GitHub WebHook Agent](https://github.com/YashAnand69/Live-PR-Fixer-and-GitHub-WebHook-Agent), commit `1e4d0c64853131aa58edb095941db9c0d0c8ffa4`.
   - `server.ts`: GitHub event ingestion at `/api/webhook`; Gemini integration; explicit GitHub contents-write and comment path.
   - React components include webhook inspection, pipeline view, diff view and simulation controls.
   - Simulated clone/test/log steps exist. No evidence gathered of a real E2B execution sandbox, production customers, or production reliability. Do not claim them.
2. [Attendance Recorder](https://github.com/YashAnand69/Attendance-Recorder), commit `ba929815d1c9501fd86448cb89ef78be388fba36`.
   - React/TypeScript UI, local face matching, Firestore integration.
   - `attendanceStore.ts` includes offline queue handling and cloud synchronization.
   - Useful secondary proof of stateful product implementation; no adoption metrics were verified.

The new prototype is the first link in outreach. The webhook project is supporting evidence if Aadil asks about previous work.

## Questions that change the proposal

1. Do customers already compare candidate policies against saved actions? Is this available privately?
2. Are rule edits a source of support work, hesitation, or costly mistakes? Ask for one redacted example.
3. Is there a side-effect-free evaluation interface that accepts an immutable candidate policy version?
4. Which single reviewer and acceptance fixture set would define completion?

Public materials are not perfectly synchronized: About still labels part of server-side work “being built,” while Partner docs and SDKs describe authorization. Treat availability and private roadmap status as discovery questions, not contradictions to exploit in a sales message.
