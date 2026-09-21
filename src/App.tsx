import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Code2,
  FileJson,
  FlaskConical,
  GitCompareArrows,
  Info,
  Layers3,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import {
  compare,
  formatVerdict,
  makeRules,
  parseActions,
  type Action,
  type Verdict,
} from "./engine";
import { fixtures } from "./fixtures";
const baseline = makeRules(500);
const download = (name: string, value: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function Badge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`badge ${verdict}`}>
      {verdict === "allow" ? (
        <Check size={12} />
      ) : verdict === "deny" ? (
        <X size={12} />
      ) : (
        <span className="badge-dot" />
      )}
      {formatVerdict(verdict)}
    </span>
  );
}
export default function App() {
  const [threshold, setThreshold] = useState("1000"),
    [block, setBlock] = useState(true);
  const [actions, setActions] = useState<Action[]>(fixtures),
    [dataset, setDataset] = useState("18 synthetic actions");
  const [run, setRun] = useState(() => ({
    threshold: 1000,
    block: true,
    actions: fixtures,
    at: "Example comparison",
  }));
  const [selected, setSelected] = useState("evt_005"),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState("");
  const [tab, setTab] = useState("rehearsal"),
    [notice, setNotice] = useState(""),
    [running, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const candidate = useMemo(
    () => makeRules(run.threshold, run.block),
    [run.threshold, run.block],
  );
  const rows = useMemo(
    () => compare(run.actions, baseline, candidate),
    [run.actions, candidate],
  );
  const changed = rows.filter((r) => r.changed),
    newly = rows.filter((r) => r.newlyAllowed);
  const detail = rows.find((r) => r.action.id === selected) ?? rows[0];
  const stale =
    threshold !== String(run.threshold) ||
    block !== run.block ||
    actions !== run.actions;
  const valid =
    threshold.trim() !== "" &&
    Number.isFinite(Number(threshold)) &&
    Number(threshold) >= 1 &&
    Number(threshold) <= 10000;
  const visible = rows.filter(
    (r) =>
      (filter === "all" ||
        (filter === "changed" && r.changed) ||
        (filter === "allowed" && r.newlyAllowed)) &&
      `${r.action.label} ${r.action.toolName} ${r.action.id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const beforeAsks = rows.filter(
      (r) => r.before.verdict === "requires_human",
    ).length,
    afterAsks = rows.filter((r) => r.after.verdict === "requires_human").length;
  function runComparison() {
    if (!valid) return;
    startTransition(() => {
      setRun({
        threshold: Number(threshold),
        block,
        actions,
        at: "Comparison complete",
      });
      setNotice("Comparison updated. Nothing was executed or published.");
    });
  }
  function reset() {
    setThreshold("1000");
    setBlock(true);
    setActions(fixtures);
    setDataset("18 synthetic actions");
    setRun({
      threshold: 1000,
      block: true,
      actions: fixtures,
      at: "Example comparison",
    });
    setSelected("evt_005");
    setFilter("all");
    setQuery("");
    setNotice("Example restored.");
  }
  async function importFixtures(file?: File) {
    if (!file) return;
    try {
      if (file.size > 200000)
        throw new Error("Keep the fixture file under 200 KB.");
      const parsed = parseActions(await file.text());
      setActions(parsed);
      setDataset(`${parsed.length} imported actions`);
      setNotice(
        "Fixtures loaded locally. Run comparison to see their results.",
      );
    } catch (error) {
      setNotice(
        `Import failed: ${error instanceof Error ? error.message : "Invalid file"}`,
      );
    }
    if (inputRef.current) inputRef.current.value = "";
  }
  function exportReport() {
    download("policy-rehearsal-report.json", {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      model: "Independent bounded evaluator v1; not verified against Pushary",
      data: run.actions === fixtures ? "synthetic" : "user-imported",
      baseline,
      candidate,
      summary: {
        actions: rows.length,
        changed: changed.length,
        newlyAllowed: newly.length,
        humanReviewsBefore: beforeAsks,
        humanReviewsAfter: afterAsks,
      },
      comparisons: rows,
    });
    setNotice("Report downloaded with the exact compared rules and fixtures.");
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("rehearsal");
          }}
        >
          <span className="brand-symbol">
            <Layers3 size={21} />
          </span>
          Rehearsal<span className="beta">LAB</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">YA</span>
          <div>
            Yash’s workspace<small>Independent concept</small>
          </div>
        </div>
        <div className="nav-label">BUILD WITH CONFIDENCE</div>
        <nav aria-label="Main navigation">
          <button
            className={tab === "rehearsal" ? "nav active" : "nav"}
            onClick={() => setTab("rehearsal")}
          >
            <GitCompareArrows size={18} />
            Policy rehearsal<span>01</span>
          </button>
          <button
            className={tab === "evidence" ? "nav active" : "nav"}
            onClick={() => setTab("evidence")}
          >
            <FileJson size={18} />
            Evidence & scope
            <ArrowUpRight size={14} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-icon">
            <FlaskConical size={20} />
          </div>
          <strong>A safe place for “what if”.</strong>
          <p>
            Local model. Sample actions.
            <br />
            No live policy changes.
          </p>
          <a
            href="https://github.com/YashAnand69/policy-rehearsal"
            target="_blank"
            rel="noreferrer"
          >
            View source <ArrowUpRight size={14} />
          </a>
          <div className="author">Built by Yash Anand</div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            Experiments <ChevronRight size={14} />
            <span>
              {tab === "rehearsal" ? "Policy rehearsal" : "Evidence & scope"}
            </span>
          </div>
          <span className="concept-tag">
            <span />
            Independent prototype for Pushary
          </span>
        </header>
        <main>
          {tab === "evidence" ? (
            <section className="evidence">
              <div className="eyebrow">THE REASON FOR THIS EXPERIMENT</div>
              <h1>
                Change a rule.
                <br />
                Understand the consequences.
              </h1>
              <p className="lede">
                A product hypothesis for Pushary’s Partner authorization
                workflow. Public evidence supports the direction; customer
                demand and roadmap fit still need validation.
              </p>
              <div className="evidence-grid">
                <article className="panel">
                  <h2>What already exists</h2>
                  <p>
                    Pushary documents authorization rules, an API sandbox,
                    enforced framework gates, and audit records. This prototype
                    complements those capabilities with a before-and-after
                    policy review.
                  </p>
                  <a
                    href="https://pushary.com/docs/agents/embed-testing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Integration testing docs <ArrowUpRight size={14} />
                  </a>
                  <a
                    href="https://pushary.com/partners"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Partner authorization <ArrowUpRight size={14} />
                  </a>
                </article>
                <article className="panel">
                  <h2>The opportunity to validate</h2>
                  <p>
                    Could a batch comparison help a team catch newly allowed
                    actions before shipping a policy change? I did not find this
                    specific workflow documented in the public material reviewed
                    on September 20, 2026.
                  </p>
                  <a
                    href="https://pushary.com/blog/ai-agent-approval-threshold"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Aadil’s threshold engineering post{" "}
                    <ArrowUpRight size={14} />
                  </a>
                </article>
                <article className="panel">
                  <h2>Working in this prototype</h2>
                  <p>
                    Editable refund threshold, deployment guard, local fixture
                    import, computed verdict differences, per-rule explanations,
                    and a portable JSON report. All sample actions are invented.
                  </p>
                  <p>
                    The current policy is a demo baseline, not a policy fetched
                    from Pushary.
                  </p>
                </article>
                <article className="panel">
                  <h2>Deliberate boundary</h2>
                  <p>
                    This is an independent model of a small documented subset.
                    It does not call Pushary, approve actions, deliver
                    notifications, test webhook retries, or implement execution
                    permits.
                  </p>
                  <p>
                    A production feature must use Pushary’s authoritative
                    evaluator. This report is not a safety certification.
                  </p>
                </article>
              </div>
              <button className="primary" onClick={() => setTab("rehearsal")}>
                Explore the comparison <ArrowRight size={16} />
              </button>
            </section>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span />
                    POLICY WORKBENCH
                  </div>
                  <h1>Rehearse before you release.</h1>
                  <p>
                    See what a policy change would allow, deny, or send to a
                    human.
                  </p>
                </div>
                <button className="secondary reset" onClick={reset}>
                  <RotateCcw size={15} />
                  Reset example
                </button>
              </section>
              <div className="scope-strip">
                <FlaskConical size={15} />
                <span>Local simulation</span>
                <span className="strip-divider" />
                <span>Synthetic baseline · No Pushary connection</span>
                <button onClick={() => setTab("evidence")}>
                  About this concept <ArrowUpRight size={13} />
                </button>
              </div>
              <section className="workbench">
                <div className="policy-editor panel">
                  <div className="panel-title">
                    <div>
                      <SlidersHorizontal size={17} />
                      <h2>Proposed policy</h2>
                    </div>
                    <span className="draft-label">DRAFT</span>
                  </div>
                  <div className="policy-context">
                    <span className="mini-icon">
                      <Code2 size={18} />
                    </span>
                    <div>
                      <strong>Partner action rules</strong>
                      <small>Refunds & deployments</small>
                    </div>
                  </div>
                  <label className="field-label" htmlFor="threshold">
                    Ask a human for refunds at or above
                  </label>
                  <div className="money-input">
                    <span>$</span>
                    <input
                      id="threshold"
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                    <span>USD</span>
                  </div>
                  <div className="field-hint">
                    Baseline <strong>$500</strong>
                    <ArrowRight size={12} />
                    Proposed{" "}
                    <strong>
                      {valid
                        ? `$${Number(threshold).toLocaleString("en-US")}`
                        : "—"}
                    </strong>
                  </div>
                  {!valid && (
                    <p className="error">Enter a value from $1 to $10,000.</p>
                  )}
                  <div className="preset-row">
                    <button
                      className={threshold === "250" ? "chosen" : ""}
                      onClick={() => setThreshold("250")}
                    >
                      Tighten · $250
                    </button>
                    <button
                      className={threshold === "1000" ? "chosen" : ""}
                      onClick={() => setThreshold("1000")}
                    >
                      Relax · $1,000
                    </button>
                  </div>
                  <div className="rule-separator" />
                  <label className="switch-row">
                    <span>
                      <strong>Block production deploys</strong>
                      <small>Keep production changes denied</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={block}
                      onChange={(e) => setBlock(e.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                  <div className="fixed-rule">
                    <ShieldCheck size={16} />
                    <span>
                      Refunds of $10,000+ remain denied.
                      <br />
                      Missing or non-numeric amounts ask a human.
                    </span>
                  </div>
                  <button
                    className="primary run"
                    disabled={!valid || running}
                    onClick={runComparison}
                  >
                    <Play size={15} fill="currentColor" />
                    {running ? "Comparing…" : "Run comparison"}
                    <ArrowRight size={15} style={{ marginLeft: "auto" }} />
                  </button>
                </div>
                <div className="impact-panel panel">
                  <div className="panel-title">
                    <div>
                      <GitCompareArrows size={18} />
                      <h2>Change impact</h2>
                    </div>
                    <span className={`result-state ${stale ? "stale" : ""}`}>
                      {stale ? "Changes not compared" : run.at}
                    </span>
                  </div>
                  <div className="impact-head">
                    <div>
                      <span className="huge-number">
                        {changed.length.toString().padStart(2, "0")}
                      </span>
                      <div className="impact-caption">
                        decisions would change
                        <span>Across {rows.length} sample actions</span>
                      </div>
                    </div>
                    <div className="impact-callout">
                      <span className="callout-count">{newly.length}</span>
                      <span>
                        newly allowed
                        <br />
                        <strong>Review before rollout</strong>
                      </span>
                      <ArrowUpRight size={22} />
                    </div>
                  </div>
                  <div className="distribution">
                    <div className="distribution-label">
                      <span>Current policy</span>
                      <strong>Baseline · $500</strong>
                    </div>
                    <div className="bar">
                      {(["allow", "requires_human", "deny"] as Verdict[]).map(
                        (v) => (
                          <div
                            key={v}
                            className={v}
                            style={{
                              flex: Math.max(
                                0,
                                rows.filter((r) => r.before.verdict === v)
                                  .length,
                              ),
                            }}
                            title={`${formatVerdict(v)}: ${rows.filter((r) => r.before.verdict === v).length}`}
                          />
                        ),
                      )}
                    </div>
                    <div className="distribution-label">
                      <span>Proposed policy</span>
                      <strong>
                        Compared · ${run.threshold.toLocaleString("en-US")}
                      </strong>
                    </div>
                    <div className="bar">
                      {(["allow", "requires_human", "deny"] as Verdict[]).map(
                        (v) => (
                          <div
                            key={v}
                            className={v}
                            style={{
                              flex: Math.max(
                                0,
                                rows.filter((r) => r.after.verdict === v)
                                  .length,
                              ),
                            }}
                            title={`${formatVerdict(v)}: ${rows.filter((r) => r.after.verdict === v).length}`}
                          />
                        ),
                      )}
                    </div>
                    <div className="legend">
                      {(["allow", "requires_human", "deny"] as Verdict[]).map(
                        (v) => (
                          <span key={v}>
                            <i className={v} />
                            {formatVerdict(v)}
                            <b>
                              {
                                rows.filter((r) => r.before.verdict === v)
                                  .length
                              }{" "}
                              →{" "}
                              {rows.filter((r) => r.after.verdict === v).length}
                            </b>
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                  <div className="impact-footer">
                    <Info size={15} />
                    <span>
                      {beforeAsks - afterAsks >= 0
                        ? `${beforeAsks - afterAsks} fewer`
                        : `${afterAsks - beforeAsks} more`}{" "}
                      human reviews in this sample. Counts are illustrative, not
                      a forecast.
                    </span>
                  </div>
                </div>
              </section>
              <section className="review-section">
                <div className="section-heading">
                  <div>
                    <h2>Every decision, explained.</h2>
                    <p>
                      Inspect a sample to see which rules determined the result.
                    </p>
                  </div>
                  <button
                    className="secondary"
                    disabled={stale}
                    onClick={exportReport}
                  >
                    <ArrowDownToLine size={15} />
                    Export report
                  </button>
                </div>
                <div className="review-layout">
                  <div className="results panel">
                    <div className="table-toolbar">
                      <div className="filters" aria-label="Filter actions">
                        {[
                          ["all", "All actions"],
                          ["changed", "Changed"],
                          ["allowed", "Newly allowed"],
                        ].map(([key, label]) => (
                          <button
                            key={key}
                            className={filter === key ? "selected" : ""}
                            onClick={() => setFilter(key)}
                          >
                            {label}
                            <span>
                              {key === "all"
                                ? rows.length
                                : key === "changed"
                                  ? changed.length
                                  : newly.length}
                            </span>
                          </button>
                        ))}
                      </div>
                      <input
                        aria-label="Search actions"
                        className="search"
                        placeholder="Find action…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Sample action</th>
                            <th>Current</th>
                            <th>Proposed</th>
                            <th>
                              <span className="sr-only">Inspect</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((row) => (
                            <tr
                              className={
                                selected === row.action.id ? "selected-row" : ""
                              }
                              key={row.action.id}
                            >
                              <td>
                                <button
                                  className="action-button"
                                  onClick={() => setSelected(row.action.id)}
                                >
                                  <span className="action-title">
                                    {row.action.label}
                                    {row.newlyAllowed && (
                                      <span
                                        className="change-mark"
                                        title="Newly allowed"
                                      />
                                    )}
                                  </span>
                                  <code>{row.action.toolName}</code>
                                </button>
                              </td>
                              <td>
                                <Badge verdict={row.before.verdict} />
                              </td>
                              <td>
                                <Badge verdict={row.after.verdict} />
                              </td>
                              <td>
                                <button
                                  aria-label={`Inspect ${row.action.label}`}
                                  className="row-arrow"
                                  onClick={() => setSelected(row.action.id)}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {visible.length === 0 && (
                        <div className="empty">
                          No actions match this filter.
                          <button
                            onClick={() => {
                              setFilter("all");
                              setQuery("");
                            }}
                          >
                            Clear filters
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="table-footer">
                      <span>
                        {dataset}
                        {stale && " · comparison pending"}
                      </span>
                      <button onClick={() => inputRef.current?.click()}>
                        <Upload size={13} />
                        Import JSON
                      </button>
                      <button
                        onClick={() =>
                          download("sample-actions.json", fixtures)
                        }
                      >
                        Get sample
                      </button>
                      <input
                        ref={inputRef}
                        className="sr-only"
                        tabIndex={-1}
                        type="file"
                        accept=".json,application/json"
                        aria-label="Import action fixtures"
                        onChange={(e) =>
                          void importFixtures(e.target.files?.[0])
                        }
                      />
                    </div>
                  </div>
                  <aside className="inspector panel">
                    <div className="panel-title">
                      <div>
                        <Layers3 size={16} />
                        <h2>Decision trace</h2>
                      </div>
                      <code>{detail.action.id}</code>
                    </div>
                    <h3>{detail.action.label}</h3>
                    <div className="verdict-flow">
                      <Badge verdict={detail.before.verdict} />
                      <ArrowRight size={15} />
                      <Badge verdict={detail.after.verdict} />
                    </div>
                    <div className="code-label">ACTION PARAMETERS</div>
                    <pre>
                      {JSON.stringify(detail.action.parameters, null, 2)}
                    </pre>
                    <div className="code-label">PROPOSED RULE EVALUATION</div>
                    <div className="trace-list">
                      {detail.after.trace
                        .filter(
                          (t) => t.rule.toolPattern === detail.action.toolName,
                        )
                        .map((t) => (
                          <div
                            className={`trace-item ${t.status}`}
                            key={t.rule.id}
                          >
                            <span className="trace-icon">
                              {t.status === "match" ? (
                                <Check size={12} />
                              ) : t.status === "unknown" ? (
                                "?"
                              ) : (
                                "–"
                              )}
                            </span>
                            <div>
                              <strong>{t.rule.name}</strong>
                              <p>{t.reason}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="decision-reason">
                      <strong>
                        Why {formatVerdict(detail.after.verdict).toLowerCase()}?
                      </strong>
                      <p>{detail.after.reason}</p>
                      {detail.action.note && <p>{detail.action.note}</p>}
                    </div>
                    <div className="inspector-note">
                      Deny wins over ask; ask wins over allow. This model covers
                      exact action names only.
                    </div>
                  </aside>
                </div>
              </section>
              <footer className="page-footer">
                <span>
                  <ShieldCheck size={14} />
                  Runs in your browser. Imported fixtures are not uploaded.
                </span>
                <button onClick={() => setTab("evidence")}>
                  Model limitations & sources <ArrowUpRight size={13} />
                </button>
              </footer>
            </>
          )}
          {notice && (
            <div className="toast" role="status">
              <Info size={16} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
