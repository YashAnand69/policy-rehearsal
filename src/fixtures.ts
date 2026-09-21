import type { Action } from "./engine";
export const fixtures: Action[] = [
  ...[42, 120, 480, 499, 500, 650, 899, 999, 1000, 4200, 10000].map(
    (amount, i) => ({
      id: `evt_${String(i + 1).padStart(3, "0")}`,
      label: `$${amount.toLocaleString("en-US")} refund`,
      toolName: "refund.create",
      parameters: { amount, currency: "USD" },
    }),
  ),
  {
    id: "evt_012",
    label: "Amount missing",
    toolName: "refund.create",
    parameters: { currency: "USD" },
    note: "A missing amount must not silently bypass a threshold.",
  },
  {
    id: "evt_013",
    label: "Amount sent as text",
    toolName: "refund.create",
    parameters: { amount: "600", currency: "USD" },
    note: 'The string "600" is deliberately not coerced into a number.',
  },
  {
    id: "evt_014",
    label: "Unrecognized currency",
    toolName: "refund.create",
    parameters: { amount: 42, currency: "EUR" },
    note: "No matching allow rule for this currency.",
  },
  {
    id: "evt_015",
    label: "Production deployment",
    toolName: "deployment.create",
    parameters: { environment: "production", repository: "demo/checkout" },
  },
  {
    id: "evt_016",
    label: "Staging deployment",
    toolName: "deployment.create",
    parameters: { environment: "staging", repository: "demo/checkout" },
  },
  {
    id: "evt_017",
    label: "Delete repository",
    toolName: "repository.delete",
    parameters: { repository: "demo/checkout" },
    note: "Unconfigured actions require a human; they are never implicitly allowed.",
  },
  {
    id: "evt_018",
    label: "Negative refund",
    toolName: "refund.create",
    parameters: { amount: -1, currency: "USD" },
  },
];
