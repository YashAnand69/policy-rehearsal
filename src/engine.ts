/** Independent, deliberately bounded model. Not Pushary's production evaluator. */
export type Verdict = "allow" | "requires_human" | "deny";
export type Effect = "allow" | "require_approval" | "deny";
export type Scalar = string | number | boolean | null;
export interface Condition {
  parameter: string;
  operator: "lt" | "gte" | "eq";
  value: Scalar;
}
export interface Rule {
  id: string;
  name: string;
  toolPattern: string;
  effect: Effect;
  conditions: Condition[];
}
export interface Action {
  id: string;
  label: string;
  toolName: string;
  parameters: Record<string, Scalar>;
  note?: string;
}
export interface Trace {
  rule: Rule;
  status: "match" | "miss" | "unknown";
  reason: string;
}
export interface Evaluation {
  verdict: Verdict;
  reason: string;
  trace: Trace[];
}
export interface Comparison {
  action: Action;
  before: Evaluation;
  after: Evaluation;
  changed: boolean;
  newlyAllowed: boolean;
}
const rank: Record<Verdict, number> = { allow: 0, requires_human: 1, deny: 2 };
const verdictOf = (effect: Effect): Verdict =>
  effect === "require_approval" ? "requires_human" : effect;
export function evaluate(action: Action, rules: Rule[]): Evaluation {
  const trace: Trace[] = rules.map((rule) => {
    // Exact actions only: a broad coding-agent wildcard cannot authorize a Partner action here.
    if (rule.toolPattern !== action.toolName)
      return { rule, status: "miss", reason: "Different action name." };
    let unknown = "",
      miss = "";
    for (const c of rule.conditions) {
      const value = action.parameters[c.parameter];
      if (value === undefined || value === null) {
        unknown = `${c.parameter} is missing or null; human review required.`;
        continue;
      }
      if (
        c.operator !== "eq" &&
        (typeof value !== "number" ||
          !Number.isFinite(value) ||
          typeof c.value !== "number" ||
          !Number.isFinite(c.value))
      ) {
        unknown = `${c.parameter} must be a finite number; no string coercion.`;
        continue;
      }
      const match =
        c.operator === "eq"
          ? value === c.value
          : c.operator === "lt"
            ? (value as number) < (c.value as number)
            : (value as number) >= (c.value as number);
      if (!match)
        miss = `${c.parameter} does not satisfy ${c.operator} ${String(c.value)}.`;
    }
    // Conservative prototype choice: unresolved facts escalate even alongside a false condition.
    if (unknown) return { rule, status: "unknown", reason: unknown };
    if (miss) return { rule, status: "miss", reason: miss };
    return {
      rule,
      status: "match",
      reason: rule.conditions.length
        ? "All conditions match."
        : "Exact action matches.",
    };
  });
  const candidates = trace
    .filter((t) => t.status !== "miss")
    .map((t) => ({
      verdict:
        t.status === "unknown"
          ? ("requires_human" as const)
          : verdictOf(t.rule.effect),
      trace: t,
    }));
  if (!candidates.length)
    return {
      verdict: "requires_human",
      reason: "No explicit matching rule. Ask a human.",
      trace,
    };
  candidates.sort(
    (a, b) =>
      rank[b.verdict] - rank[a.verdict] ||
      a.trace.rule.id.localeCompare(b.trace.rule.id),
  );
  const winner = candidates[0];
  return {
    verdict: winner.verdict,
    reason:
      winner.trace.status === "unknown"
        ? winner.trace.reason
        : `${winner.trace.rule.name} determines the result.`,
    trace,
  };
}
export function makeRules(threshold: number, blockProduction = true): Rule[] {
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 10000)
    throw new Error("Threshold must be between 1 and 10,000 USD.");
  return [
    {
      id: "refund-allow",
      name: "Permit valid USD refunds",
      toolPattern: "refund.create",
      effect: "allow",
      conditions: [
        { parameter: "currency", operator: "eq", value: "USD" },
        { parameter: "amount", operator: "gte", value: 0 },
      ],
    },
    {
      id: "refund-review",
      name: "Review larger refunds",
      toolPattern: "refund.create",
      effect: "require_approval",
      conditions: [{ parameter: "amount", operator: "gte", value: threshold }],
    },
    {
      id: "refund-limit",
      name: "Block refunds of $10,000+",
      toolPattern: "refund.create",
      effect: "deny",
      conditions: [{ parameter: "amount", operator: "gte", value: 10000 }],
    },
    {
      id: "deploy-review",
      name: "Review deployments",
      toolPattern: "deployment.create",
      effect: "require_approval",
      conditions: [],
    },
    ...(blockProduction
      ? [
          {
            id: "deploy-block",
            name: "Block production deployments",
            toolPattern: "deployment.create",
            effect: "deny" as const,
            conditions: [
              {
                parameter: "environment",
                operator: "eq" as const,
                value: "production",
              },
            ],
          },
        ]
      : []),
  ];
}
export function compare(
  actions: Action[],
  baseline: Rule[],
  candidate: Rule[],
): Comparison[] {
  return actions.map((action) => {
    const before = evaluate(action, baseline),
      after = evaluate(action, candidate);
    return {
      action,
      before,
      after,
      changed: before.verdict !== after.verdict,
      newlyAllowed: before.verdict !== "allow" && after.verdict === "allow",
    };
  });
}
export function parseActions(text: string): Action[] {
  if (text.length > 200000)
    throw new Error("Keep the fixture file under 200 KB.");
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data) || !data.length || data.length > 500)
    throw new Error("Use an array of 1–500 actions.");
  const ids = new Set<string>();
  for (const item of data) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      item.id.length > 100 ||
      ids.has(item.id)
    )
      throw new Error(
        "Every action needs a unique, non-empty id (100 characters max).",
      );
    ids.add(item.id);
    if (
      typeof item.toolName !== "string" ||
      !item.toolName.trim() ||
      item.toolName.length > 100 ||
      typeof item.label !== "string" ||
      item.label.length > 180
    )
      throw new Error("Each action needs a toolName and a short label.");
    if (
      !item.parameters ||
      typeof item.parameters !== "object" ||
      Array.isArray(item.parameters) ||
      Object.keys(item.parameters).length > 30
    )
      throw new Error(
        "Parameters must be an object with at most 30 scalar values.",
      );
    if (
      Object.values(item.parameters).some(
        (v) =>
          (v !== null && !["string", "number", "boolean"].includes(typeof v)) ||
          (typeof v === "number" && !Number.isFinite(v)),
      )
    )
      throw new Error(
        "Parameter values must be strings, finite numbers, booleans or null.",
      );
    if (
      item.note !== undefined &&
      (typeof item.note !== "string" || item.note.length > 500)
    )
      throw new Error("Notes must be text under 500 characters.");
  }
  return data.map(({ id, label, toolName, parameters, note }) => ({
    id,
    label,
    toolName,
    parameters,
    ...(note === undefined ? {} : { note }),
  }));
}
export const formatVerdict = (verdict: Verdict) =>
  ({ allow: "Allow", requires_human: "Ask human", deny: "Deny" })[verdict];
