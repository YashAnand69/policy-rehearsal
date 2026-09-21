import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compare,
  evaluate,
  makeRules,
  parseActions,
  type Action,
  type Rule,
} from "./engine";
import { fixtures } from "./fixtures";
const action = (amount: unknown): Action => ({
  id: "a",
  label: "Test",
  toolName: "refund.create",
  parameters: { amount: amount as number, currency: "USD" },
});
test("default demo produces four newly allowed refunds and no changed deployments", () => {
  const result = compare(fixtures, makeRules(500), makeRules(1000));
  assert.equal(result.length, 18);
  assert.deepEqual(
    result.filter((r) => r.newlyAllowed).map((r) => r.action.parameters.amount),
    [500, 650, 899, 999],
  );
  assert.equal(result.filter((r) => r.changed).length, 4);
});
test("threshold equality escalates; hard deny wins even at threshold 10,000", () => {
  assert.equal(evaluate(action(499), makeRules(500)).verdict, "allow");
  assert.equal(evaluate(action(500), makeRules(500)).verdict, "requires_human");
  assert.equal(evaluate(action(10000), makeRules(10000)).verdict, "deny");
});
test("missing, null, numeric text, empty string, boolean and non-finite amounts never allow", () => {
  for (const value of [undefined, null, "600", "", "1e3", true, NaN, Infinity])
    assert.equal(
      evaluate(action(value), makeRules(500)).verdict,
      "requires_human",
      String(value),
    );
});
test("rule ordering cannot change the winner", () => {
  const rules = makeRules(500);
  for (const sample of fixtures)
    assert.deepEqual(
      evaluate(sample, rules).verdict,
      evaluate(sample, [...rules].reverse()).verdict,
    );
});
test("a matched deny takes precedence over an unresolved condition", () => {
  const rules: Rule[] = [
    ...makeRules(500),
    {
      id: "deny-all",
      name: "Stop refunds",
      toolPattern: "refund.create",
      effect: "deny",
      conditions: [],
    },
  ];
  assert.equal(evaluate(action(undefined), rules).verdict, "deny");
});
test("unconfigured actions and broad wildcard alone cannot authorize", () => {
  const wildcard: Rule = {
    id: "wild",
    name: "Broad allow",
    toolPattern: "*",
    effect: "allow",
    conditions: [],
  };
  assert.equal(evaluate(action(1), [wildcard]).verdict, "requires_human");
  assert.equal(evaluate(action(1), []).verdict, "requires_human");
});
test("negative values and unsupported currencies cannot use the allow rule", () => {
  assert.equal(evaluate(action(-1), makeRules(500)).verdict, "requires_human");
  const eur = action(42);
  eur.parameters.currency = "EUR";
  assert.equal(evaluate(eur, makeRules(500)).verdict, "requires_human");
});
test("removing production deny relaxes to human review, not allow", () => {
  const production = fixtures.find((a) => a.id === "evt_015")!;
  const row = compare([production], makeRules(500), makeRules(500, false))[0];
  assert.equal(row.before.verdict, "deny");
  assert.equal(row.after.verdict, "requires_human");
  assert.equal(row.newlyAllowed, false);
});
test("validated import round-trips sample fixtures", () =>
  assert.deepEqual(parseActions(JSON.stringify(fixtures)), fixtures));
test("import rejects duplicate ids, nested values, invalid labels, oversized sets, and empty arrays", () => {
  for (const data of [
    [],
    [action(1), action(2)],
    [{ ...action(1), parameters: { amount: {} } }],
    [{ ...action(1), label: 42 }],
    Array(501).fill(action(1)),
  ])
    assert.throws(() => parseActions(JSON.stringify(data)));
  assert.throws(() =>
    parseActions(
      '[ {"id":"overflow","label":"Overflow","toolName":"refund.create","parameters":{"amount":1e309}} ]',
    ),
  );
  assert.throws(() => parseActions("{bad json"));
  assert.throws(() => parseActions(" ".repeat(200001)));
});
test("invalid thresholds are rejected", () => {
  for (const value of [0, -1, NaN, Infinity, 10001])
    assert.throws(() => makeRules(value));
});
