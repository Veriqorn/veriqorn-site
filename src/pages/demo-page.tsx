import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Database,
  FileWarning,
  Filter,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  MoreHorizontal,
  Play,
  Search,
  Settings2,
  ShieldCheck,
  SkipForward,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TestStatus = "passed" | "failed" | "broken" | "skipped";
type Run = { id: string; branch: string; title: string; status: TestStatus; time: string; duration: string; total: number; passed: number; failed: number; broken: number; skipped: number };

const runs: Run[] = [
  { id: "run-4821", branch: "main", title: "Release verification", status: "failed", time: "12 min ago", duration: "8m 42s", total: 128, passed: 119, failed: 3, broken: 1, skipped: 5 },
  { id: "run-4820", branch: "feature/checkout", title: "Checkout regression", status: "broken", time: "38 min ago", duration: "6m 18s", total: 96, passed: 82, failed: 2, broken: 4, skipped: 8 },
  { id: "run-4819", branch: "main", title: "Nightly API suite", status: "passed", time: "2 h ago", duration: "11m 06s", total: 214, passed: 207, failed: 0, broken: 0, skipped: 7 },
  { id: "run-4818", branch: "hotfix/auth-timeout", title: "Authentication smoke", status: "passed", time: "3 h ago", duration: "2m 31s", total: 42, passed: 41, failed: 0, broken: 0, skipped: 1 },
  { id: "run-4817", branch: "main", title: "Frontend visual checks", status: "failed", time: "Yesterday", duration: "14m 03s", total: 167, passed: 154, failed: 6, broken: 0, skipped: 7 },
];

const tests = [
  { name: "Payment is confirmed after 3-D Secure", suite: "Checkout / Payment", status: "failed" as const, duration: "18.4s" },
  { name: "Refund is available for a completed order", suite: "Checkout / Refunds", status: "failed" as const, duration: "12.8s" },
  { name: "Discount is recalculated after cart change", suite: "Checkout / Pricing", status: "failed" as const, duration: "8.1s" },
  { name: "Customer receives order confirmation", suite: "Notifications", status: "broken" as const, duration: "0.7s" },
  { name: "Guest checkout preserves selected delivery", suite: "Checkout", status: "skipped" as const, duration: "—" },
];

const statusStyle: Record<TestStatus, string> = {
  passed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  broken: "bg-amber-50 text-amber-800 ring-amber-600/20",
  skipped: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
const statusText: Record<TestStatus, string> = { passed: "Passed", failed: "Failed", broken: "Broken", skipped: "Skipped" };
const StatusIcon = ({ status, className }: { status: TestStatus; className?: string }) => {
  const Icon = status === "passed" ? CheckCircle2 : status === "failed" ? XCircle : status === "broken" ? FileWarning : SkipForward;
  return <Icon className={className} />;
};

export function DemoPage() {
  const [activeSection, setActiveSection] = useState("Launches");
  const [statusFilter, setStatusFilter] = useState<"all" | TestStatus>("all");
  const [selectedRun, setSelectedRun] = useState(runs[0]);
  const [selectedTest, setSelectedTest] = useState(tests[0]);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const visibleRuns = useMemo(() => statusFilter === "all" ? runs : runs.filter((run) => run.status === statusFilter), [statusFilter]);
  const navItems = [["Overview", LayoutDashboard], ["Launches", Play], ["Test cases", FlaskConical], ["Analytics", BarChart3], ["Integrations", Database]] as const;

  return (
    <div className="-mx-4 my-0 overflow-hidden border-x border-slate-200 bg-slate-100 sm:-mx-6 lg:-mx-8">
      <div className="flex min-h-[calc(100vh-9rem)] bg-slate-50">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-slate-950 p-4 text-slate-300 lg:block">
          <div className="mb-9 flex items-center gap-2 px-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400 text-slate-950"><ShieldCheck className="h-5 w-5" /></div><span className="font-semibold text-white">Acme Store</span></div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
          <nav className="space-y-1">{navItems.map(([name, Icon]) => <button key={name} onClick={() => setActiveSection(name)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition", activeSection === name ? "bg-cyan-400 text-slate-950 font-bold" : "hover:bg-slate-800 hover:text-white")}><Icon className="h-4 w-4" />{name}</button>)}</nav>
          <div className="mt-8 border-t border-slate-800 pt-5"><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-800"><Settings2 className="h-4 w-4" />Settings</button></div>
          <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400"><span className="font-semibold text-cyan-300">Demo workspace</span><p className="mt-1 leading-relaxed">All information is simulated for product review.</p></div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div><div className="flex items-center gap-2 text-xs text-slate-500"><span>Acme Store</span><ChevronRight className="h-3 w-3" /><span>Quality</span></div><h1 className="mt-1 text-lg font-bold text-slate-950">{activeSection === "Launches" ? "Test launches" : activeSection}</h1></div>
            <div className="flex items-center gap-3"><span className="hidden rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 sm:block">Interactive product demo</span><Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950">Exit demo</Link><div className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">AS</div></div>
          </div>

          <main className="p-4 sm:p-6">
            <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-950"><span className="font-bold">This is a demo.</span> Explore the workspace freely — every result and AI insight is sample data.</div>
            <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Test health" value="93.0%" detail="+2.4% vs. last week" icon={ShieldCheck} tone="emerald" />
              <Metric label="Last launch" value="3 failed" detail="1 broken · 5 skipped" icon={AlertTriangle} tone="rose" />
              <Metric label="Mean duration" value="8m 36s" detail="12% faster this week" icon={Clock3} tone="cyan" />
              <Metric label="AI insights" value="4 new" detail="Root causes detected" icon={Sparkles} tone="violet" />
            </section>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">Recent launches</h2><p className="mt-0.5 text-xs text-slate-500">Select a launch to inspect its test results.</p></div><div className="flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400" />{(["all", "failed", "broken", "passed"] as const).map((filter) => <button key={filter} onClick={() => setStatusFilter(filter)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize", statusFilter === filter ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}>{filter === "all" ? "All" : statusText[filter]}</button>)}</div></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Launch</th><th className="px-3 py-3 font-semibold">Branch</th><th className="px-3 py-3 font-semibold">Result</th><th className="px-3 py-3 font-semibold">Tests</th><th className="px-3 py-3 font-semibold">Time</th></tr></thead><tbody>{visibleRuns.map((run) => <tr key={run.id} onClick={() => setSelectedRun(run)} className={cn("cursor-pointer border-t border-slate-100 transition hover:bg-cyan-50/50", selectedRun.id === run.id && "bg-cyan-50/60")}><td className="px-4 py-3"><div className="font-semibold text-slate-800">{run.title}</div><div className="mt-0.5 font-mono text-xs text-slate-400">#{run.id.slice(4)}</div></td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><GitBranch className="h-3.5 w-3.5" />{run.branch}</span></td><td className="px-3 py-3"><span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset", statusStyle[run.status])}><StatusIcon status={run.status} className="h-3.5 w-3.5" />{statusText[run.status]}</span></td><td className="px-3 py-3"><div className="font-semibold text-slate-700">{run.passed}/{run.total}</div><div className="text-xs text-slate-400">{run.failed ? `${run.failed} failed` : "all checked"}</div></td><td className="px-3 py-3 text-xs text-slate-500">{run.time}<div className="mt-0.5">{run.duration}</div></td></tr>)}</tbody></table></div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="font-bold text-slate-950">Launch summary</h2><p className="mt-0.5 font-mono text-xs text-slate-500">#{selectedRun.id.slice(4)} · {selectedRun.branch}</p></div><MoreHorizontal className="h-5 w-5 text-slate-400" /></div><div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 text-center">{([['Passed', selectedRun.passed, 'text-emerald-600'], ['Failed', selectedRun.failed, 'text-rose-600'], ['Broken', selectedRun.broken, 'text-amber-600'], ['Skipped', selectedRun.skipped, 'text-slate-500']] as const).map(([label, value, tone]) => <div key={label} className="py-3"><div className={cn("text-lg font-bold", tone)}>{value}</div><div className="text-[10px] font-semibold uppercase text-slate-400">{label}</div></div>)}</div><div className="p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Needs attention</h3><span className="text-xs text-slate-400">{tests.length} tests</span></div><div className="space-y-1">{tests.map((test) => <button key={test.name} onClick={() => { setSelectedTest(test); setAnalysisOpen(true); }} className={cn("flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-slate-50", selectedTest.name === test.name && "bg-slate-50 ring-1 ring-slate-200")}><StatusIcon status={test.status} className={cn("h-4 w-4 shrink-0", test.status === "failed" ? "text-rose-500" : test.status === "broken" ? "text-amber-500" : "text-slate-400")} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{test.name}</span><span className="block truncate text-[11px] text-slate-400">{test.suite}</span></span><span className="text-[11px] text-slate-400">{test.duration}</span></button>)}</div></div></section>
            </div>

            {analysisOpen && <section className="mt-6 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/70 p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-white"><Bot className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-violet-950">Veriqorn AI analysis</h2><p className="text-xs text-violet-700">Based on logs, history, and linked changes</p></div></div><button onClick={() => setAnalysisOpen(false)} className="text-xs font-semibold text-violet-700 hover:text-violet-950">Hide analysis</button></div><div className="grid gap-5 p-4 lg:grid-cols-[1.2fr_0.8fr]"><div><div className="mb-3 flex items-center gap-2"><StatusIcon status={selectedTest.status} className="h-4 w-4 text-rose-500" /><span className="font-semibold text-slate-800">{selectedTest.name}</span></div><p className="text-sm leading-6 text-slate-600">The payment confirmation API returned <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-rose-700">502 Bad Gateway</code> after the 3-D Secure redirect. This pattern first appeared in build #4818 and correlates with a change to the payment-provider client.</p><div className="mt-4 rounded-lg bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-300"><span className="text-rose-300">POST</span> /api/payments/confirm → 502<br /><span className="text-slate-500">provider timeout after 15 000ms</span></div></div><div className="rounded-lg border border-violet-100 bg-violet-50/50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-violet-950"><Sparkles className="h-4 w-4" />Likely root cause <span className="ml-auto rounded-full bg-violet-200 px-2 py-0.5 text-[10px]">87% confidence</span></div><p className="mt-2 text-sm leading-5 text-violet-900/80">The new retry configuration is not applied to the 3-D Secure callback request.</p><button className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-950">View suggested fix <ChevronRight className="h-3.5 w-3.5" /></button></div></div></section>}
          </main>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof ShieldCheck; tone: "emerald" | "rose" | "cyan" | "violet" }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-600", rose: "bg-rose-50 text-rose-600", cyan: "bg-cyan-50 text-cyan-600", violet: "bg-violet-50 text-violet-600" };
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{value}</p></div><span className={cn("grid h-9 w-9 place-items-center rounded-lg", colors[tone])}><Icon className="h-4 w-4" /></span></div><p className="mt-2 text-xs text-slate-500">{detail}</p></div>;
}
