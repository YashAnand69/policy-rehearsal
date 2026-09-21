import {
  compare,
  evaluate,
  makeRules,
  parseActions,
  type Action,
  type Rule,
  type Verdict,
} from "./engine";

export interface RehearsalBundle {
  schemaVersion: 1;
  model: "rehearsal-local-v1";
  baseline: { threshold: number; blockProduction: boolean };
  candidate: { threshold: number; blockProduction: boolean };
  actions: Action[];
}
export interface Guardrail {
  id: string;
  label: string;
  action: Action;
  expected: Verdict;
  actual: Verdict;
  passed: boolean;
  reason: string;
}
const strictness = { allow: 0, requires_human: 1, deny: 2 };

/** Authored expectations, independent of observed verdicts. These are demo contracts. */
export function checkGuardrails(rules: Rule[], threshold: number): Guardrail[] {
  const refund = (
    parameters: Action["parameters"],
  ): Pick<Action, "toolName" | "parameters"> => ({
    toolName: "refund.create",
    parameters,
  });
  const cases: Array<{
    id: string;
    label: string;
    expected: Verdict;
    input: Pick<Action, "toolName" | "parameters">;
  }> = [
    {
      id: "missing",
      label: "Missing amount asks a human",
      expected: "requires_human",
      input: refund({ currency: "USD" }),
    },
    {
      id: "null",
      label: "Null amount asks a human",
      expected: "requires_human",
      input: refund({ amount: null, currency: "USD" }),
    },
    {
      id: "string",
      label: "Numeric strings are not coerced",
      expected: "requires_human",
      input: refund({ amount: "600", currency: "USD" }),
    },
    {
      id: "negative",
      label: "Negative refunds are not allowed",
      expected: "requires_human",
      input: refund({ amount: -1, currency: "USD" }),
    },
    {
      id: "currency",
      label: "Unknown currency asks a human",
      expected: "requires_human",
      input: refund({ amount: 0, currency: "EUR" }),
    },
    {
      id: "unknown",
      label: "Unconfigured actions ask a human",
      expected: "requires_human",
      input: { toolName: "repository.delete", parameters: {} },
    },
    {
      id: "production",
      label: "Production deployments stay denied",
      expected: "deny",
      input: {
        toolName: "deployment.create",
        parameters: { environment: "production" },
      },
    },
    {
      id: "ceiling",
      label: "$10,000 refund ceiling stays denied",
      expected: "deny",
      input: refund({ amount: 10000, currency: "USD" }),
    },
    {
      id: "below",
      label: "Just below threshold is allowed",
      expected: "allow",
      input: refund({
        amount: Number((threshold - 0.01).toFixed(8)),
        currency: "USD",
      }),
    },
    {
      id: "boundary",
      label: "At threshold requires review or denial",
      expected: threshold === 10000 ? "deny" : "requires_human",
      input: refund({ amount: threshold, currency: "USD" }),
    },
  ];
  return cases.map(({ id, label, expected, input }) => {
    const action = { id: `guard_${id}`, label, ...input };
    const result = evaluate(action, rules);
    return {
      id,
      label,
      action,
      expected,
      actual: result.verdict,
      passed: expected === result.verdict,
      reason: result.reason,
    };
  });
}

export function runRegression(bundle: RehearsalBundle) {
  const baseline = makeRules(
    bundle.baseline.threshold,
    bundle.baseline.blockProduction,
  );
  const candidate = makeRules(
    bundle.candidate.threshold,
    bundle.candidate.blockProduction,
  );
  const comparisons = compare(bundle.actions, baseline, candidate);
  const guardrails = checkGuardrails(candidate, bundle.candidate.threshold);
  // Deny -> human is also a relaxation, even though it isn't newly allowed.
  const relaxations = comparisons.filter(
    (row) => strictness[row.after.verdict] < strictness[row.before.verdict],
  );
  return {
    passed:
      guardrails.every((check) => check.passed) && relaxations.length === 0,
    guardrails,
    relaxations,
    comparisons,
  };
}

export function parseBundle(text: string): RehearsalBundle {
  if (text.length > 250000) throw new Error("Keep the CI bundle under 250 KB.");
  const value: unknown = JSON.parse(text);
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1 ||
    !("model" in value) ||
    value.model !== "rehearsal-local-v1"
  )
    throw new Error("Unsupported rehearsal bundle or evaluator version.");
  const data = value as Record<string, unknown>;
  function config(key: string) {
    const item = data[key] as Record<string, unknown> | undefined;
    if (
      !item ||
      typeof item.threshold !== "number" ||
      typeof item.blockProduction !== "boolean"
    )
      throw new Error(`Invalid ${key} configuration.`);
    makeRules(item.threshold, item.blockProduction);
    return { threshold: item.threshold, blockProduction: item.blockProduction };
  }
  return {
    schemaVersion: 1,
    model: "rehearsal-local-v1",
    baseline: config("baseline"),
    candidate: config("candidate"),
    actions: parseActions(JSON.stringify(data.actions)),
  };
}
