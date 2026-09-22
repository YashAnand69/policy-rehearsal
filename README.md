# Policy Rehearsal

**See which actions a policy edit would newly allow before rolling it out.**

An independent React/TypeScript product prototype by [Yash Anand](https://github.com/YashAnand69), exploring a focused workflow for Pushary's Partner authorization product. It is not an official Pushary product or a connected Pushary integration.

[Live demo](https://yash-rehearsal-lab-0921.netlify.app) · [Source](https://github.com/YashAnand69/policy-rehearsal)

## Try it in 60 seconds

1. Open the demo. The baseline asks for refunds at $500; the proposed policy asks at $1,000.
2. Select **Newly allowed**. Four of the 18 synthetic actions move from human review to allow.
3. Inspect **$500 refund**. The trace shows the allow rule matches while the proposed approval threshold does not.
4. Choose **Tighten · $250**, then **Run comparison**. Two previously allowed actions now require a human.
5. Inspect the missing-amount and numeric-string cases: both still ask a human. Disable the production block and rerun to see a deny become a human review.
6. Open **Inspect contract checks**: ten expectations cover missing facts, type errors, the refund ceiling, and threshold boundaries. The default change passes these cases but fails the strict no-relaxation check.
7. Use **Restore baseline settings**, then rerun: the local gate passes. Disable the production guard and rerun: its contract fails and the deny-to-human relaxation is flagged.
8. **Export report** downloads the compared policies, fixtures, per-rule traces, and summary. **Get sample** gives you the JSON import format.

No signup, API key, backend, or phone pairing is needed. No actions are executed. Imports stay in memory in your browser; refresh clears them...

## Run locally

Use Node.js 22 LTS and npm.

```sh
npm ci --include=optional
npm run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`).

```sh
npm test       # 19 policy, import, regression, and CLI tests
npm run build # TypeScript check + static production bundle
npm run preview
```

The static `dist/` directory can be hosted on Netlify or another static host. `netlify.toml` defines the build and basic response headers. The app does not require environment variables. CI performs the same tests and build on Node 22.

## What works

- Editable refund threshold and production-deployment guard.
- Actual baseline/candidate evaluation over 18 synthetic fixtures, or 1–500 imported fixtures.
- Changed/newly-allowed filters, text search, and a per-rule decision inspector.
- Report export tied to the last completed comparison; stale edits disable export.
- Validated JSON import, reset, empty/error states, keyboard controls, and responsive layouts.
- Ten authored regression expectations, including threshold-boundary probes.
- CI bundle export and a CLI that recomputes results with the same model.
- Strict detection of all less-restrictive verdicts, including deny → human.
- Evidence and scope view inside the demo.

## Reproduce a review in CI

In the demo, click **Export CI bundle** after running a comparison. Use the actual downloaded filename (it includes a timestamp):

```sh
npm run check:policy -- /path/to/rehearsal-ci-123.json result.json
```

Exit status: **0** = these local checks passed, **1** = a contract failed or a verdict became less restrictive, **2** = invalid input. The optional second argument writes full JSON results and traces. The input pins the local model version, both configurations, and the exact fixture set. It is a prototype schema, not a Pushary export.

Included examples:

```sh
npm run check:policy -- examples/baseline-ci.json # exits 0
npm run check:policy -- examples/relaxed-ci.json  # intentionally exits 1
```

The ten demo contracts are authored separately from observed results and always run, even if imported fixtures omit those cases. They are **not an exhaustive security specification**. Boundary probes use the candidate threshold; fixed contracts protect production deployment denial and the $10,000 ceiling.

The strict gate rejects every relaxation. Intentional relaxations require human review outside this prototype; there is no approval button or bypass flag. Changing the baseline can change the result, so production baselines and acceptance contracts must come from a trusted, versioned source with branch protection. Bundles are unsigned and local data is user-editable. Passing neither certifies safety nor triggers deployment.

The repository workflow runs both unit tests and the passing example. CLI integration tests also prove the intentionally failing example exits 1. To check an exported candidate in another CI pipeline, install this repository and invoke the command above, allowing its status to fail the job.

## What this model means

This is a deliberately small **independent evaluator**, not Pushary's private production policy engine. It illustrates Partner action authorization, not coding-agent hook policies (which use different pattern-selection semantics).

It supports exact action names and scalar `eq`, `lt`, and `gte` conditions. A matched deny outranks a human-review requirement, which outranks allow. Missing/null facts and invalid numeric types escalate; unmatched actions ask a human. Numeric strings are never coerced. Broad wildcards cannot authorize an action in this model.

Prototype choices beyond the documented high-level behavior: unknown conditions conservatively escalate even when another condition in that rule is false; exact-only matching; explicit USD/non-negative allow guard; deterministic rule-ID tie explanation. These require contract validation before integration. The JSON fixture/report format belongs to this prototype and is not claimed to be Pushary's audit export format.

**Not implemented:** authenticating to Pushary; parity testing against its evaluator; policy deployment; real audit-log import; tenant/actor/target scoping; wildcard matching; notification delivery; webhook validation; decision expiry; idempotency or execution permits. A result here is not proof an action is safe or that it would receive the same live verdict.

A production implementation should call Pushary's authoritative evaluation boundary using immutable policy versions, agree on sanitized fixture mapping, and avoid any real authorization side effects. API availability for candidate evaluation needs founder confirmation; no undocumented endpoint is assumed.

## Why this experiment

Pushary already has policies, approval-history suggestions, audit exports, framework adapters, and an API sandbox. The hypothesis is more specific: **a batch, before-and-after review can make a proposed policy change easier to assess**. Public absence is not proof of a product gap. See [the evidence review](docs/research.md) and [integration boundary](docs/integration-plan.md).

## Source map

- `src/engine.ts` — pure bounded evaluator, comparison, and import validation.
- `src/engine.test.ts` — edge cases and invariants.
- `src/fixtures.ts` — invented action examples; no customer data.
- `src/regression.ts` — authored contract cases, no-relaxation gate, and bundle validation.
- `src/regression.test.ts` — regression detection and real CLI exit-code checks.
- `src/ReleaseChecks.tsx` — contract results and CI handoff.
- `scripts/check-policy.ts` — CI runner, with optional JSON result output.
- `examples/` — reproducible passing and intentionally failing bundles.
- `src/App.tsx` — workflow and report export.
- `src/style.css` — original responsive styling; no Pushary assets copied.

## Relevant prior work

[Live PR Fixer / GitHub Webhook Agent](https://github.com/YashAnand69/Live-PR-Fixer-and-GitHub-WebHook-Agent) contains a webhook receiver, Gemini-backed patch generation, and an explicit GitHub write path, alongside simulated execution stages. [Attendance Recorder](https://github.com/YashAnand69/Attendance-Recorder) demonstrates React/TypeScript product UI and an offline queue synchronized to Firestore. These are code examples, not claims of production usage or customer outcomes.

## License and attribution

Original prototype code is MIT licensed. Pushary is referenced nominatively to explain the concept; no affiliation or endorsement is implied. Product statements are linked to public sources. Dependency licenses remain with their authors.
