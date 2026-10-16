"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Bot, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, Command, GitBranch, Layers3, LoaderCircle, MoreHorizontal,
  Play, Plus, Search, Settings2, Sparkles, Workflow as WorkflowIcon, Zap
} from "lucide-react";
import { api, type Workflow, type Run } from "@/lib/api";

const iconFor = (type: string) => type === "ai" ? <Bot size={16} /> :
  type === "http" ? <Zap size={16} /> :
  type === "approval" ? <CheckCircle2 size={16} /> :
  type === "condition" ? <GitBranch size={16} /> : <Layers3 size={16} />;

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [runInput, setRunInput] = useState("Please review this sample lead: Acme Dental is evaluating a scheduling solution for a 12-person practice.");
  const [result, setResult] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [workflowData, runData] = await Promise.all([api.workflows(), api.runs()]);
      setWorkflows(workflowData);
      setRuns(runData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = workflows.filter((workflow) =>
    `${workflow.name} ${workflow.description}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalSteps = workflows.reduce((sum, workflow) => sum + (Array.isArray(workflow.steps) ? workflow.steps.length : 0), 0);
  const success = runs.filter((run) => run.status === "succeeded").length;

  async function runWorkflow(workflow: Workflow) {
    setBusy(workflow.id);
    setResult("");
    try {
      const response = await api.run(workflow.id, { text: runInput, lead: runInput, ticket: runInput });
      setResult(`Run #${response.runId}: ${response.status}${response.error ? ` — ${response.error}` : ""}\n\n${JSON.stringify(response.output ?? {}, null, 2)}`);
      await load();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Run failed.");
    } finally {
      setBusy(null);
    }
  }

  async function createWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError("");
      const steps = [
        { id: "input", name: "Prepare input", type: "transform" as const, config: { template: "{{input.text}}" } },
        { id: "agent", name: "AI agent", type: "ai" as const, config: { prompt: "Analyze the supplied request. Return a clear summary, recommended next actions, and any missing information. Be concise and do not invent facts.", inputKey: "input" } },
        { id: "review", name: "Human review", type: "approval" as const, config: { message: "Review the agent result before taking external action." } }
      ];
      await api.create({ name, description, steps, status: "active" });
      setName("");
      setDescription("");
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create workflow.");
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#"><span className="brand-mark"><WorkflowIcon size={21} /></span><span>agentflow<span className="brand-muted"> studio</span></span></a>
        <div className="workspace"><span className="workspace-dot" /> PERSONAL WORKSPACE <ChevronDown size={13} /></div>
        <div className="nav-label">BUILD</div>
        <a className="nav active" href="#workflows"><Layers3 size={17} /> Workflows <span className="nav-number">{workflows.length}</span></a>
        <a className="nav" href="#runs"><Activity size={17} /> Runs & logs</a>
        <a className="nav" href="#workflows"><GitBranch size={17} /> Templates <span className="soon">SOON</span></a>
        <div className="nav-label integrations-label">MANAGE</div>
        <a className="nav" href="#tools"><Zap size={17} /> Integrations <span className="soon">SOON</span></a>
        <a className="nav" href="#settings"><Settings2 size={17} /> Settings</a>
        <div className="sidebar-bottom">
          <div className="usage-card"><div className="usage-icon"><Sparkles size={16} /></div><strong>Make work flow.</strong><p>Connect your tools and let agents handle the busywork.</p><a href="#workflows">Explore workflows ↗</a></div>
          <div className="user"><div className="user-avatar">AF</div><div><strong>My workspace</strong><span>Starter plan</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-right"><span className="api-status"><i /> Agent engine <b>connected</b></span><button className="icon-btn" aria-label="Notifications"><Bell size={18} /></button><div className="top-avatar">AF</div></div></header>
        <div className="content">
          <div className="hero">
            <div><div className="eyebrow"><Sparkles size={14} /> YOUR AUTOMATION HQ</div><h1>Make busywork <em>disappear.</em></h1><p>Build intelligent workflows. Let AI handle the repetitive stuff.</p></div>
            <button className="primary" onClick={() => setShowCreate(true)}><Plus size={17} /> New workflow</button>
          </div>

          {error && <div className="error" role="alert"><span>{error}</span><button onClick={() => void load()}>Retry</button></div>}

          <div className="metrics">
            <article className="metric metric-dark"><div className="metric-head">Active workflows <span><WorkflowIcon size={16} /></span></div><div className="metric-value">{loading ? "—" : workflows.filter((w) => w.status === "active").length.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="green-chip"><Activity size={12} /> Ready to run</span><span>Across your workspace</span></div><div className="metric-bars"><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article className="metric"><div className="metric-head">Total workflow steps <span className="metric-icon purple"><GitBranch size={16} /></span></div><div className="metric-value">{loading ? "—" : totalSteps.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="dot-purple" /> <span>Logic, tools & AI agents</span></div><div className="metric-spark purple-spark">⌁</div></article>
            <article className="metric"><div className="metric-head">Recent successful runs <span className="metric-icon green"><CheckCircle2 size={16} /></span></div><div className="metric-value">{loading ? "—" : success.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="dot-green" /> <span>From latest executions</span></div><div className="metric-spark green-spark">⌁</div></article>
          </div>

          <div className="section-head" id="workflows"><div><div className="section-kicker">YOUR AUTOMATIONS</div><h2>Workflow library <span className="count">{workflows.length}</span></h2><p>Reusable agents and automations, all in one place.</p></div><button className="outline" onClick={() => setShowCreate(true)}><Plus size={15} /> Create workflow</button></div>
          <div className="toolbar"><label className="search"><Search size={16} /><input placeholder="Search workflows..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button className="outline filter-btn"><Settings2 size={15} /> All workflows <ChevronDown size={14} /></button></div>

          <div className="workflow-grid">
            {loading && <div className="empty"><LoaderCircle className="spin" size={18} /> Loading your workflows…</div>}
            {!loading && visible.map((workflow, index) => (
              <article className="workflow-card" key={workflow.id}>
                <div className="card-top"><span className={`workflow-icon tone-${index % 4}`}><WorkflowIcon size={19} /></span><span className={`status ${workflow.status}`}>{workflow.status === "active" ? <><i /> Active</> : workflow.status}</span><button className="dots" aria-label="Workflow options"><MoreHorizontal size={18} /></button></div>
                <h3>{workflow.name}</h3><p className="card-description">{workflow.description || "A custom AI-powered automation."}</p>
                <div className="step-list">{(Array.isArray(workflow.steps) ? workflow.steps : []).slice(0, 4).map((step, i) => <div className="step" key={step.id}><span className={`step-icon step-${step.type}`}>{iconFor(step.type)}</span><span>{step.name}</span>{i < workflow.steps.length - 1 && <span className="step-connector" />}</div>)}{workflow.steps.length > 4 && <span className="more-steps">+{workflow.steps.length - 4} more steps</span>}</div>
                <div className="card-footer"><span><Layers3 size={14} /> {workflow.steps.length} steps</span><span><Clock3 size={14} /> Ready to run</span><button className="run-btn" disabled={busy === workflow.id || workflow.status !== "active"} onClick={() => void runWorkflow(workflow)}>{busy === workflow.id ? <LoaderCircle className="spin" size={15} /> : <Play size={14} fill="currentColor" />} {busy === workflow.id ? "Running" : "Run"}</button></div>
              </article>
            ))}
            {!loading && visible.length === 0 && <div className="empty">No workflows found. Create your first automation.</div>}
          </div>

          {result && <section className="result-panel"><div className="result-head"><div><span className="section-kicker">LATEST EXECUTION</span><h2>Agent output</h2></div><button className="icon-btn" onClick={() => setResult("")} aria-label="Close output">×</button></div><pre>{result}</pre></section>}

          <div className="lower-grid">
            <section className="panel" id="runs"><div className="panel-head"><div><h2>Recent runs</h2><p>What your agents have been up to.</p></div><a href="#runs">View all ↗</a></div><div className="run-table"><div className="run-table-head"><span>WORKFLOW</span><span>STATUS</span><span>STARTED</span></div>
              {runs.slice(0, 5).map((run) => <div className="run-row" key={run.id}><div className="run-name"><span className="run-symbol"><Command size={15} /></span><div><strong>{run.workflowName}</strong><small>Run #{run.id}</small></div></div><span className={`run-status ${run.status}`}>{run.status === "succeeded" ? "Succeeded" : run.status === "failed" ? "Failed" : run.status === "needs_approval" ? "Needs review" : run.status}</span><span className="run-date">{run.createdAt ? new Date(run.createdAt).toLocaleString() : "Just now"}</span></div>)}
              {!loading && runs.length === 0 && <div className="no-runs">Your workflow runs will appear here.</div>}
            </div></section>
            <section className="panel tips" id="tools"><div className="panel-head"><div><h2>Build smarter</h2><p>A few ideas to get started.</p></div><span className="tip-spark"><Sparkles size={17} /></span></div>
              <div className="tip-row"><span className="tip-icon violet"><Bot size={17} /></span><div><strong>AI-powered lead follow-up</strong><p>Summarize a lead and draft a personalized reply.</p></div><ArrowUpRight size={15} /></div>
              <div className="tip-row"><span className="tip-icon mint"><Activity size={17} /></span><div><strong>Support ticket triage</strong><p>Classify incoming issues and suggest next steps.</p></div><ArrowDownRight size={15} /></div>
              <div className="tip-note"><CircleHelp size={15} /><span>Model calls use a mock response until you configure an API key in <code>apps/api/.env</code>.</span></div>
            </section>
          </div>
          <footer><span>© 2026 AgentFlow Studio</span><span>Automation with a human in the loop <span className="heart">♥</span></span><a href="https://github.com/dixit2812/agentflow-studio">Open source project ↗</a></footer>
        </div>
      </section>

      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div className="modal-head"><div><span className="section-kicker">NEW AUTOMATION</span><h2 id="create-title">Create a workflow</h2><p>Start with a simple AI agent and human review step.</p></div><button className="icon-btn" onClick={() => setShowCreate(false)} aria-label="Close">×</button></div>
        <form onSubmit={createWorkflow}><label>Workflow name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Weekly insights assistant" /></label><label>Description<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this workflow help you automate?" /></label><label>Test input for future runs<textarea value={runInput} onChange={(event) => setRunInput(event.target.value)} /></label><div className="modal-steps"><span>1 <b>Prepare input</b></span><span>2 <b>AI agent</b></span><span>3 <b>Human review</b></span></div><div className="modal-actions"><button type="button" className="outline" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="primary"><Plus size={16} /> Create workflow</button></div></form>
      </section></div>}
    </main>
  );
}
