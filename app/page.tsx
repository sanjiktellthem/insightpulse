"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChartSpec, InsightPayload } from "@/lib/types";

type SavedInsight = InsightPayload & { id: string; createdAt?: string };
type Tab = "answer" | "data" | "charts" | "dashboard";

export default function HomePage() {
  const [message, setMessage] = useState("");
  const [locale, setLocale] = useState<"en" | "ru">("en");
  const [enableMake, setEnableMake] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [assistantMessage, setAssistantMessage] = useState("Ask a question to generate your first Insight Card.");
  const [insight, setInsight] = useState<SavedInsight | null>(null);
  const [tab, setTab] = useState<Tab>("answer");
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [dashboardPins, setDashboardPins] = useState<Array<{ id: string; insight: SavedInsight }>>([]);
  const [loading, setLoading] = useState(false);
  const [makeStatus, setMakeStatus] = useState<string>("idle");

  useEffect(() => {
    void loadInsights();
    void loadDashboard();
    const local = localStorage.getItem("insightpulse_saved");
    if (local) setSavedInsights((prev) => [...JSON.parse(local), ...prev]);
  }, []);

  useEffect(() => {
    localStorage.setItem("insightpulse_saved", JSON.stringify(savedInsights.slice(0, 10)));
  }, [savedInsights]);

  const suggestions = useMemo(() => [
    "Show MRR trend by plan tier in the last 6 months",
    "Какие каналы маркетинга дают лучший ROAS?",
    "Find churn risk accounts with support volume spike",
  ], []);

  async function loadInsights() {
    const res = await fetch("/api/insights");
    if (res.ok) {
      const data = await res.json() as SavedInsight[];
      setSavedInsights(data);
    }
  }

  async function loadDashboard() {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      const data = await res.json() as Array<{ id: string; insight: SavedInsight }>;
      setDashboardPins(data);
    }
  }

  async function sendMessage(prompt?: string) {
    const finalMessage = prompt ?? message;
    if (!finalMessage.trim()) return;
    setLoading(true);
    setMakeStatus("idle");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: finalMessage, locale, enableMake }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");
      setConversationId(data.conversationId);
      setAssistantMessage(data.assistantMessage);
      setInsight(data.insight);
      setSavedInsights((prev) => [data.insight, ...prev.filter((item) => item.id !== data.insight.id)]);
      setMakeStatus(data.makeStatus ?? "skipped");
      setMessage("");
    } catch (e) {
      setAssistantMessage((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function pinCurrentInsight() {
    if (!insight) return;
    await fetch("/api/dashboard/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId: insight.id, position: dashboardPins.length + 1 }),
    });
    await loadDashboard();
    setTab("dashboard");
  }

  function exportCsv() {
    if (!insight) return;
    const lines = [insight.columns.join(","), ...insight.rows.map((r) => r.map((v) => JSON.stringify(v ?? "")).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${insight.title.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto flex h-screen max-w-[1600px] gap-4 p-4">
      <section className="flex w-[32%] min-w-[340px] flex-col gap-4">
        <Card className="flex-1 overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">InsightPulse</h1>
            <select className="rounded-lg border bg-background px-2 py-1 text-sm" value={locale} onChange={(e) => setLocale(e.target.value as "en" | "ru") }>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">Insight Cards: ask, analyze, pin.</p>
          <div className="mb-3 flex gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => void sendMessage(s)} className="rounded-lg bg-muted px-2 py-1 text-xs hover:bg-muted/80">{s}</button>
            ))}
          </div>
          <div className="mb-3 rounded-xl border p-3 text-sm">{loading ? "Generating insight..." : assistantMessage}</div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={locale === "ru" ? "Спросите про выручку, churn, usage..." : "Ask about revenue, churn, usage..."} />
          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm text-muted-foreground">
              <input type="checkbox" checked={enableMake} onChange={(e) => setEnableMake(e.target.checked)} className="mr-2" />
              Send to Make
            </label>
            <Button onClick={() => void sendMessage()} disabled={loading}>Send</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Make status: {makeStatus}</p>
        </Card>

        <Card className="max-h-[35vh] overflow-auto">
          <h2 className="mb-2 text-sm font-semibold">Saved Insights</h2>
          <div className="space-y-2">
            {savedInsights.map((item) => (
              <button key={item.id} onClick={() => { setInsight(item); setTab("answer"); }} className="w-full rounded-lg border p-2 text-left hover:bg-muted/40">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="flex-1">
        <Card className="h-full overflow-auto">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["answer", "data", "charts", "dashboard"] as Tab[]).map((t) => (
              <Button key={t} variant={tab === t ? "default" : "secondary"} size="sm" onClick={() => setTab(t)}>{t}</Button>
            ))}
            {insight && <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(insight.sql)}>Copy SQL</Button>}
            {insight && <Button size="sm" variant="outline" onClick={exportCsv}>Download CSV</Button>}
            {insight && <Button size="sm" onClick={() => void pinCurrentInsight()}>Pin to Dashboard</Button>}
          </div>

          {insight && (
            <Card className="mb-4 bg-muted/20">
              <h3 className="mb-2 text-sm font-semibold">Insight Card Editor</h3>
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={insight.title} onChange={(e) => setInsight({ ...insight, title: e.target.value })} />
                <Input value={insight.tags.join(", ")} onChange={(e) => setInsight({ ...insight, tags: e.target.value.split(",").map((v) => v.trim()) })} />
              </div>
              <Textarea className="mt-2" value={insight.summary} onChange={(e) => setInsight({ ...insight, summary: e.target.value })} rows={2} />
            </Card>
          )}

          {tab === "answer" && <p className="text-sm leading-7">{insight?.summary ?? "No insight yet."}</p>}

          {tab === "data" && insight && (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>{insight.columns.map((c) => <th key={c} className="p-2 text-left">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {insight.rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-border/50">{row.map((cell, i) => <td key={i} className="p-2">{String(cell ?? "")}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "charts" && insight && (
            <div className="grid gap-4 md:grid-cols-2">
              {insight.charts.map((chart) => (
                <ChartCard key={chart.id} chart={chart} />
              ))}
            </div>
          )}

          {tab === "dashboard" && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboardPins.map((pin) => (
                <Card key={pin.id} className="bg-background/60">
                  <p className="text-sm font-semibold">{pin.insight.title}</p>
                  <p className="text-xs text-muted-foreground">{pin.insight.summary}</p>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}

function ChartCard({ chart }: { chart: ChartSpec }) {
  return (
    <Card>
      <p className="mb-2 text-sm font-semibold">{chart.title}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "line" ? (
            <LineChart data={chart.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={chart.xKey} /><YAxis /><Tooltip /><Legend />{chart.yKeys?.map((k) => <Line key={k} dataKey={k} stroke="#30b2ff" />)}</LineChart>
          ) : chart.type === "bar" ? (
            <BarChart data={chart.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={chart.xKey} /><YAxis /><Tooltip /><Legend />{chart.yKeys?.map((k) => <Bar key={k} dataKey={k} fill="#705cff" />)}</BarChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chart.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={chart.xKey} /><YAxis /><Tooltip /><Legend />{chart.yKeys?.map((k) => <Area key={k} dataKey={k} fill="#30b2ff" stroke="#30b2ff" />)}</AreaChart>
          ) : (
            <PieChart><Pie data={chart.data} dataKey={chart.valueKey} nameKey={chart.categoryKey} fill="#30b2ff" label /><Tooltip /></PieChart>
          )}
        </ResponsiveContainer>
      </div>
      {chart.notes && <p className="mt-2 text-xs text-muted-foreground">{chart.notes}</p>}
    </Card>
  );
}
