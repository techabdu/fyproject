"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import { Card, StatCard, PageSpinner, Alert, cx } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { Layers, Users, FileText, GitPullRequest } from "lucide-react";

type Bar = { label: string; value: number };

function BarChart({ data, color = "bg-indigo-500" }: { data: Bar[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No data yet.</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm text-slate-600" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cx("h-full rounded-full", color)}
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-700">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </Card>
  );
}

function AnalyticsInner() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/admin/analytics")
      .then((r) => setData(r?.data ?? null))
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner label="Loading analytics…" />;
  if (error || !data)
    return (
      <Container>
        <Alert tone="error">{error ?? "No analytics available."}</Alert>
      </Container>
    );

  const pStatus = data.projects_by_status ?? {};
  const rStatus = data.requests_by_status ?? {};
  const cap = data.capacity_utilisation ?? {};

  return (
    <Container>
      <PageHeader
        title="Faculty Analytics"
        description="Aggregate activity across all departments in the faculty."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Capacity used" value={`${cap.percentage ?? 0}%`} tone="indigo" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Supervisors" value={cap.supervisors ?? 0} tone="purple" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Approved projects" value={pStatus.approved ?? 0} tone="green" icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Requests" value={(rStatus.pending ?? 0) + (rStatus.accepted ?? 0) + (rStatus.declined ?? 0)} tone="blue" icon={<GitPullRequest className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Projects by status">
          <BarChart
            data={[
              { label: "Approved", value: pStatus.approved ?? 0 },
              { label: "Pending", value: pStatus.pending ?? 0 },
              { label: "Rejected", value: pStatus.rejected ?? 0 },
            ]}
            color="bg-emerald-500"
          />
        </Section>

        <Section title="Supervision requests by status">
          <BarChart
            data={[
              { label: "Pending", value: rStatus.pending ?? 0 },
              { label: "Accepted", value: rStatus.accepted ?? 0 },
              { label: "Declined", value: rStatus.declined ?? 0 },
            ]}
            color="bg-sky-500"
          />
        </Section>

        <Section title="Approved projects by graduation year">
          <BarChart
            data={(data.projects_by_year ?? []).map((y: any) => ({
              label: String(y.graduation_year),
              value: y.count,
            }))}
            color="bg-violet-500"
          />
        </Section>

        <Section title="Supervisor capacity utilisation">
          <div className="flex items-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${cap.percentage ?? 0} 100`} strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-lg font-bold text-slate-800">{cap.percentage ?? 0}%</span>
            </div>
            <div className="text-sm text-slate-600">
              <p><span className="font-semibold">{cap.total_load ?? 0}</span> of <span className="font-semibold">{cap.total_capacity ?? 0}</span> supervision slots filled</p>
              <p className="mt-1 text-slate-400">across {cap.supervisors ?? 0} supervisors</p>
            </div>
          </div>
        </Section>

        <Section title="Top supervisor interest areas">
          <BarChart
            data={(data.top_interest_areas ?? []).map((t: any) => ({ label: t.name, value: t.supervisors }))}
            color="bg-indigo-500"
          />
        </Section>

        <Section title="Top project topics">
          <BarChart
            data={(data.top_topics ?? []).map((t: any) => ({ label: t.keyword, value: t.count }))}
            color="bg-amber-500"
          />
        </Section>
      </div>
    </Container>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAuth roles={["super_admin"]}>
      <AnalyticsInner />
    </RequireAuth>
  );
}
