"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { Container } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  StatusBadge,
  StatCard,
  ProgressBar,
  EmptyState,
  Alert,
  PageSpinner,
  Divider,
} from "@/components/ui";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Upload,
  Users,
  Bookmark,
  Inbox,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  UserCheck,
  Layers,
  GraduationCap,
  ArrowRight,
  Check,
  Search,
  ClipboardList,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";

/* ===================================================================== */

function DashboardInner() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiGet("/dashboard");
      setData(res?.data ?? null);
    } catch {
      setError("Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;

  return (
    <Container>
      {/* Welcome banner */}
      <div className="mb-8 rounded-2xl bg-[#1e3a5f] p-8 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Badge tone="indigo" className="bg-white/15 text-white">
            {user.role_label}
          </Badge>
          {user.department && (
            <span className="text-sm text-slate-300">
              {user.department.name}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {user.name}
        </h1>
        {data?.role === "supervisor" && data.capacity && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="indigo" className="bg-white/15 text-white">
              Capacity {data.capacity.current_load}/{data.capacity.max_capacity}
            </Badge>
            <Badge tone="indigo" className="bg-white/15 text-white">
              {data.capacity.available_slots} open
            </Badge>
          </div>
        )}
      </div>

      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading your dashboard..." />
      ) : !data ? null : data.role === "student" ? (
        <StudentDashboard data={data} />
      ) : data.role === "supervisor" ? (
        <SupervisorDashboard data={data} reload={load} />
      ) : data.role === "dept_admin" ? (
        <DeptAdminDashboard data={data} reload={load} />
      ) : (
        <SuperAdminDashboard data={data} />
      )}
    </Container>
  );
}

/* ----------------------------------------------------------- Student ---- */

function StudentDashboard({ data }: { data: any }) {
  const s = data.stats ?? {};
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="My uploads"
          value={s.uploads_total ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Approved"
          value={s.uploads_approved ?? 0}
          tone="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending review"
          value={s.uploads_pending ?? 0}
          tone="yellow"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Saved supervisors"
          value={s.saved_count ?? 0}
          tone="purple"
          icon={<Bookmark className="h-4 w-4" />}
        />
      </div>

      <Divider />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active request */}
        <div className="lg:col-span-2">
          <SectionTitle
            title="My supervision request"
            href="/requests"
            linkLabel="All requests"
          />
          {data.active_request ? (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={data.active_request.status} />
                <span className="text-sm text-slate-400">
                  with {data.active_request.supervisor ?? "—"}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                {data.active_request.proposed_title}
              </h3>
              {data.active_request.decision_reason && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {data.active_request.decision_reason}
                </p>
              )}
            </Card>
          ) : (
            <EmptyState
              title="No active request"
              description="You can hold one active supervision request at a time."
              icon={<Inbox className="h-6 w-6" />}
              action={
                <Link href="/supervisors">
                  <Button size="sm">Find a supervisor</Button>
                </Link>
              }
            />
          )}
          {data.recent_decline && (
            <Alert tone="warning" className="mt-3">
              <span className="font-semibold">
                Last decline ({data.recent_decline.supervisor}):{" "}
              </span>
              {data.recent_decline.decision_reason}
            </Alert>
          )}
        </div>

        {/* Saved supervisors */}
        <div>
          <SectionTitle
            title="Saved supervisors"
            href="/saved"
            linkLabel="View all"
          />
          <Card className="divide-y divide-slate-100">
            {(data.saved_supervisors ?? []).length === 0 ? (
              <p className="p-5 text-sm text-slate-400">No bookmarks yet.</p>
            ) : (
              data.saved_supervisors.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/supervisors/${s.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {s.name}
                  </span>
                  <Badge tone={s.available_slots > 0 ? "green" : "red"}>
                    {s.available_slots}/{s.max_capacity}
                  </Badge>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>

      <Divider />

      {/* My projects */}
      <div>
        <SectionTitle
          title="My uploaded projects"
          href="/projects/upload"
          linkLabel="Upload new"
        />
        {(data.my_projects ?? []).length === 0 ? (
          <EmptyState
            title="No uploads yet"
            description="Submit a completed project to the repository."
            icon={<Upload className="h-6 w-6" />}
          />
        ) : (
          <Card className="divide-y divide-slate-100">
            {data.my_projects.map((p: any) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-slate-800 hover:text-indigo-700"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {p.graduation_year}
                  </p>
                  {p.status === "rejected" && p.rejection_feedback && (
                    <p className="mt-1 text-xs text-red-600">
                      {p.rejection_feedback}
                    </p>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </Card>
        )}
      </div>

      <Divider />

      <QuickLinks
        links={[
          { href: "/projects", title: "Repository", icon: BookOpen },
          { href: "/supervisors", title: "Find Supervisors", icon: Users },
          { href: "/requests", title: "My Requests", icon: Inbox },
        ]}
      />
    </div>
  );
}

/* --------------------------------------------------------- Supervisor --- */

function SupervisorDashboard({
  data,
  reload,
}: {
  data: any;
  reload: () => void;
}) {
  const cap = data.capacity ?? {};
  const s = data.stats ?? {};
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function accept(id: number) {
    setActionId(id);
    setActionError(null);
    try {
      await apiPatch(`/requests/${id}/accept`, {});
      reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not accept this request.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Capacity
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {cap.current_load}/{cap.max_capacity}
          </p>
          <ProgressBar
            value={cap.current_load ?? 0}
            max={cap.max_capacity ?? 0}
            className="mt-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            {cap.available_slots} slot(s) open
          </p>
        </Card>
        <StatCard
          label="Pending requests"
          value={s.pending_count ?? 0}
          tone="yellow"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Accepted students"
          value={s.accepted_count ?? 0}
          tone="green"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Declined"
          value={s.declined_count ?? 0}
          tone="gray"
          icon={<Inbox className="h-4 w-4" />}
        />
      </div>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <Divider />

      {/* Pending requests with inline accept */}
      <div>
        <SectionTitle
          title="Pending requests"
          href="/requests"
          linkLabel="Review all"
        />
        {(data.pending_requests ?? []).length === 0 ? (
          <EmptyState
            title="No pending requests"
            description="New supervision requests will appear here."
            icon={<ClipboardList className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {data.pending_requests.map((r: any) => (
              <Card
                key={r.id}
                hover
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {r.proposed_title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    from {r.student}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    loading={actionId === r.id}
                    onClick={() => accept(r.id)}
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <Link href="/requests">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Accepted students */}
      <div>
        <SectionTitle title="My students" />
        {(data.accepted_students ?? []).length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Accepted students will be listed here."
            icon={<GraduationCap className="h-6 w-6" />}
          />
        ) : (
          <Card className="divide-y divide-slate-100">
            {data.accepted_students.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-slate-800">{r.student}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {r.proposed_title}
                  </p>
                </div>
                <Badge tone="green">accepted</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Dept Admin --- */

function DeptAdminDashboard({
  data,
  reload,
}: {
  data: any;
  reload: () => void;
}) {
  const s = data.stats ?? {};
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function approve(id: number) {
    setActionId(id);
    setActionError(null);
    try {
      await apiPatch(`/projects/${id}/approve`, {});
      reload();
    } catch {
      setActionError("Could not approve this project.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending approvals"
          value={s.pending_approvals ?? 0}
          tone="yellow"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Approved projects"
          value={s.approved_projects ?? 0}
          tone="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Supervisors"
          value={s.supervisors ?? 0}
          tone="indigo"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Students"
          value={s.students ?? 0}
          tone="blue"
          icon={<GraduationCap className="h-4 w-4" />}
        />
      </div>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <Divider />

      {/* Pending approvals with inline approve */}
      <div>
        <SectionTitle
          title="Awaiting moderation"
          href="/moderation"
          linkLabel="Full queue"
        />
        {(data.pending_projects ?? []).length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="No projects are awaiting your review."
            icon={<ShieldCheck className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {data.pending_projects.map((p: any) => (
              <Card
                key={p.id}
                hover
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    by {p.uploader} &middot; {p.graduation_year}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    loading={actionId === p.id}
                    onClick={() => approve(p.id)}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Link href="/moderation">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Supervisor roster */}
      <div>
        <SectionTitle title="Department supervisor roster" />
        <Card className="divide-y divide-slate-100">
          {(data.supervisor_roster ?? []).map((sup: any) => (
            <div key={sup.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{sup.name}</p>
                <Badge tone={sup.available_slots > 0 ? "green" : "red"}>
                  {sup.current_load}/{sup.max_capacity} students
                </Badge>
              </div>
              <ProgressBar
                value={sup.current_load}
                max={sup.max_capacity}
                className="mt-2"
              />
              {sup.interest_tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sup.interest_tags.slice(0, 6).map((t: string) => (
                    <Badge key={t} tone="gray">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Super Admin -- */

function SuperAdminDashboard({ data }: { data: any }) {
  const s = data.stats ?? {};
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Departments"
          value={s.departments ?? 0}
          tone="indigo"
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Total users"
          value={s.users ?? 0}
          tone="blue"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Projects"
          value={s.projects ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Pending review"
          value={s.pending_projects ?? 0}
          tone="yellow"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={s.students ?? 0}
          tone="blue"
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <StatCard
          label="Supervisors"
          value={s.supervisors ?? 0}
          tone="purple"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Approved projects"
          value={s.approved_projects ?? 0}
          tone="green"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Supervision requests"
          value={s.total_requests ?? 0}
          tone="indigo"
          icon={<Inbox className="h-4 w-4" />}
        />
      </div>

      <Divider />

      {/* Per-department breakdown */}
      <div>
        <SectionTitle title="Faculty breakdown by department" />
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Students</th>
                <th className="px-4 py-3 text-center">Supervisors</th>
                <th className="px-4 py-3 text-center">Approved</th>
                <th className="px-4 py-3 text-center">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.departments ?? []).map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.faculty}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{d.students}</td>
                  <td className="px-4 py-3 text-center">{d.supervisors}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone="green">{d.approved_projects}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      tone={d.pending_projects > 0 ? "yellow" : "gray"}
                    >
                      {d.pending_projects}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Divider />

      <QuickLinks
        links={[
          { href: "/moderation", title: "Moderation Queue", icon: CheckCircle2 },
          { href: "/projects", title: "Repository", icon: BookOpen },
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------- shared --- */

function SectionTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function QuickLinks({
  links,
}: {
  links: {
    href: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="group">
          <Card
            hover
            className="flex items-center gap-3 p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <l.icon className="h-5 w-5" />
            </span>
            <span className="font-medium text-slate-800">{l.title}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
