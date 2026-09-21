import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  checkGuardrails,
  parseBundle,
  runRegression,
  type RehearsalBundle,
} from "./regression";
import { fixtures } from "./fixtures";
import { makeRules } from "./engine";

const bundle = (threshold = 1000, blockProduction = true): RehearsalBundle => ({
  schemaVersion: 1,
  model: "rehearsal-local-v1",
  baseline: { threshold: 500, blockProduction: true },
  candidate: { threshold, blockProduction },
  actions: fixtures,
});
test("ten independent contract cases pass at low, default, and ceiling thresholds", () => {
  for (const threshold of [1, 250, 500, 1000, 10000]) {
    const checks = checkGuardrails(makeRules(threshold), threshold);
    assert.equal(checks.length, 10);
    assert.ok(checks.every((check) => check.passed));
  }
});
test("a relaxed policy fails the CI gate even when every contract expectation passes", () => {
  const result = runRegression(bundle());
  assert.equal(result.passed, false);
  assert.ok(result.guardrails.every((check) => check.passed));
  assert.deepEqual(
    result.relaxations.map((row) => row.action.id),
    ["evt_005", "evt_006", "evt_007", "evt_008"],
  );
});
test("unchanged and tighter sample policies pass", () => {
  assert.equal(runRegression(bundle(500)).passed, true);
  assert.equal(runRegression(bundle(250)).passed, true);
});
test("deny to human is caught even with no newly allowed decisions", () => {
  const result = runRegression(bundle(500, false));
  assert.equal(result.passed, false);
  assert.equal(result.relaxations.length, 1);
  assert.equal(result.relaxations[0].newlyAllowed, false);
  assert.deepEqual(
    result.guardrails.filter((check) => !check.passed).map((check) => check.id),
    ["production"],
  );
});
test("contract suite cannot be bypassed by importing fixtures that omit production", () => {
  const value = bundle(500, false);
  value.actions = [fixtures[0]];
  const result = runRegression(value);
  assert.equal(result.relaxations.length, 0);
  assert.equal(result.passed, false);
});
test("expectations catch mutated policy behavior rather than mirroring the evaluator", () => {
  const rules = makeRules(500).filter((rule) => rule.id !== "refund-limit");
  assert.equal(
    checkGuardrails(rules, 500).find((check) => check.id === "ceiling")?.passed,
    false,
  );
});
test("CI bundle parser validates versions, configuration and action identities", () => {
  assert.deepEqual(parseBundle(JSON.stringify(bundle())), bundle());
  for (const input of [
    null,
    {},
    { ...bundle(), schemaVersion: 2 },
    { ...bundle(), model: "pushary" },
    { ...bundle(), candidate: { threshold: "500", blockProduction: true } },
    { ...bundle(), candidate: { threshold: 500 } },
    { ...bundle(), actions: [] },
    { ...bundle(), actions: [fixtures[0], fixtures[0]] },
  ]) {
    assert.throws(() => parseBundle(JSON.stringify(input)));
  }
  assert.throws(() => parseBundle(" ".repeat(250001)));
});
test("CLI returns meaningful process status for pass, review and invalid input", () => {
  for (const [file, expected] of [
    ["examples/baseline-ci.json", 0],
    ["examples/relaxed-ci.json", 1],
    ["examples/does-not-exist.json", 2],
  ] as const) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/check-policy.ts", file],
      { encoding: "utf8" },
    );
    assert.equal(result.status, expected, result.stderr);
  }
});
