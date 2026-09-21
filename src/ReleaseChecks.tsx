import {
  ArrowDownToLine,
  Check,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { formatVerdict } from "./engine";
import type { runRegression } from "./regression";

export function ReleaseChecks({
  result,
  stale,
  onExport,
}: {
  result: ReturnType<typeof runRegression>;
  stale: boolean;
  onExport: () => void;
}) {
  const failures = result.guardrails.filter((check) => !check.passed);
  return (
    <section className="release-panel panel" aria-label="Regression checks">
      <div className="release-heading">
        <div>
          <div className="eyebrow">FROM EXPLORATION TO A REPEATABLE CHECK</div>
          <h2>
            <ShieldCheck size={19} /> Policy regression checks
          </h2>
        </div>
        <span
          className={`gate-status ${stale ? "pending" : result.passed ? "pass" : "hold"}`}
        >
          {stale
            ? "Rerun needed"
            : result.passed
              ? "Local checks pass"
              : "Review required"}
        </span>
      </div>
      <p className="release-description">
        Ten authored expectations and a strict no-relaxation check. Export the
        compared inputs and reproduce the result in CI.
      </p>
      <div className="gate-summary">
        <div>
          <strong>
            {result.guardrails.length - failures.length}
            <span> / {result.guardrails.length}</span>
          </strong>
          <span>Contract checks passing</span>
        </div>
        <div>
          <strong>{result.relaxations.length}</strong>
          <span>Less restrictive decisions</span>
        </div>
        <div className="gate-explanation">
          {failures.length
            ? "A protected behavior changed. Open the contract checks to inspect the failure."
            : result.relaxations.length
              ? "The sample change permits more. The strict CI check fails so this change gets reviewed."
              : "These fixtures retain their protections. Passing is not a production authorization."}
        </div>
      </div>
      <details className="guardrail-details">
        <summary>
          <ChevronRight size={15} /> Inspect contract checks{" "}
          <span>
            {failures.length
              ? `${failures.length} failing`
              : "Boundary cases included"}
          </span>
        </summary>
        <div className="guardrail-list">
          {result.guardrails.map((check) => (
            <div
              key={check.id}
              className={`guardrail ${check.passed ? "passed" : "failed"}`}
            >
              {check.passed ? <Check size={15} /> : <X size={15} />}
              <div>
                <strong>{check.label}</strong>
                <code>{JSON.stringify(check.action.parameters)}</code>
              </div>
              <span>
                Expected: {formatVerdict(check.expected)}
                <br />
                Observed: {formatVerdict(check.actual)}
              </span>
            </div>
          ))}
        </div>
      </details>
      <div className="ci-footer">
        <code>npm run check:policy -- rehearsal-ci.json</code>
        <button className="secondary" disabled={stale} onClick={onExport}>
          <ArrowDownToLine size={15} />
          Export CI bundle
        </button>
      </div>
      <p className="gate-note">
        Same local model in browser and CLI. No Pushary parity verified. This
        check can fail a CI job; it cannot approve or deploy a policy.
      </p>
    </section>
  );
}
