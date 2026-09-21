import { readFileSync, writeFileSync } from "node:fs";
import { parseBundle, runRegression } from "../src/regression";

try {
  const [input, report] = process.argv.slice(2);
  if (!input)
    throw new Error(
      "Usage: npm run check:policy -- <bundle.json> [result.json]",
    );
  const result = runRegression(parseBundle(readFileSync(input, "utf8")));
  const failed = result.guardrails.filter((check) => !check.passed);
  console.log(
    `Policy Rehearsal · independent local model\n${result.guardrails.length - failed.length}/${result.guardrails.length} contract checks pass · ${result.relaxations.length} less restrictive decisions`,
  );
  for (const check of failed)
    console.log(
      `FAIL ${check.label}: expected ${check.expected}, observed ${check.actual}`,
    );
  for (const row of result.relaxations)
    console.log(
      `REVIEW ${row.action.id}: ${row.before.verdict} -> ${row.after.verdict}`,
    );
  if (report)
    writeFileSync(
      report,
      JSON.stringify({ model: "rehearsal-local-v1", ...result }, null, 2) +
        "\n",
    );
  console.log(
    result.passed
      ? "PASS · These local checks passed; no policy is authorized or deployed."
      : "FAIL · Review contract failures and policy relaxations before changing the baseline.",
  );
  process.exitCode = result.passed ? 0 : 1;
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Invalid rehearsal bundle",
  );
  process.exitCode = 2;
}
