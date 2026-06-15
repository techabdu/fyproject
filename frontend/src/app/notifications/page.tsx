"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import { Card, Button, EmptyState, PageSpinner, Alert, cx } from "@/components/ui";
import { apiGet, apiPost } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { CheckCheck, CheckCircle2, XCircle, Inbox, FileText, Bell } from "lucide-react";

const ICONS: Record<string, any> = {
  project_submitted: FileText,
  project_approved: CheckCircle2,
  project_rejected: XCircle,
  request_received: Inbox,
  request_accepted: CheckCircle2,
  request_declined: XCircle,
};
const TONES: Record<string, string> = {
  project_approved: "text-emerald-600",
  request_accepted: "text-emerald-600",
  project_rejected: "text-red-600",
  request_declined: "text-red-600",
};

function targetHref(n: any): string {
  if (n.payload?.project_id) return `/projects/${n.payload.project_id}`;
  if (String(n.type).startsWith("request")) return "/requests";
  if (n.type === "project_submitted") return "/moderation";
  return "/notifications";
}

function groupByDate(items: any[]): { label: string; items: any[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    let label: string;
    if (t >= today) label = "Today";
    else if (t >= yesterday) label = "Yesterday";
    else label = "Earlier";
    (groups[label] ??= []).push(item);
  }

  const order = ["Today", "Yesterday", "Earlier"];
  return order
    .filter((l) => groups[l]?.length)
    .map((label) => ({ label, items: groups[label] }));
}

function NotificationsInner() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiGet("/notifications");
      setItems(r?.data ?? []);
      setUnread(r?.unread_count ?? 0);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openItem(n: any) {
    if (!n.read_at) {
      try {
        await apiPost(`/notifications/${n.id}/read`);
      } catch {}
    }
    router.push(targetHref(n));
  }

  async function markAll() {
    try {
      await apiPost("/notifications/read-all");
      load();
    } catch {}
  }

  const grouped = groupByDate(items);

  return (
    <Container className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Updates on your projects, requests and reviews."
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAll}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      {loading ? (
        <PageSpinner label="Loading…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up."
          icon={<Bell className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <Card className="divide-y divide-slate-100">
                {group.items.map((n: any) => {
                  const Icon = ICONS[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n)}
                      className={cx(
                        "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50",
                        !n.read_at && "border-l-2 border-l-blue-500 bg-blue-50/30"
                      )}
                    >
                      <Icon className={cx("mt-0.5 h-5 w-5 shrink-0", TONES[n.type] ?? "text-slate-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-slate-700">{n.message}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                      </span>
                      {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsInner />
    </RequireAuth>
  );
}
