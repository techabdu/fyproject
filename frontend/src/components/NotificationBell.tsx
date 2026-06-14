"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { cx } from "./ui";
import { timeAgo } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Inbox,
  FileText,
} from "lucide-react";

type Notif = {
  id: string;
  type: string;
  message: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
};

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

function targetHref(n: Notif): string {
  if (n.payload?.project_id) return `/projects/${n.payload.project_id}`;
  if (n.type.startsWith("request")) return "/requests";
  if (n.type === "project_submitted") return "/moderation";
  return "/notifications";
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      const r = await apiGet("/notifications/unread-count");
      setUnread(r?.count ?? 0);
    } catch {
      /* ignore (e.g. logged out) */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiGet("/notifications");
      setItems(r?.data ?? []);
      setUnread(r?.unread_count ?? 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the unread count.
  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [loadCount]);

  // Load the list when the panel opens.
  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function open_(n: Notif) {
    setOpen(false);
    if (!n.read_at) {
      try {
        await apiPost(`/notifications/${n.id}/read`);
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        /* ignore */
      }
    }
    router.push(targetHref(n));
  }

  async function markAll() {
    try {
      await apiPost("/notifications/read-all");
      setItems((list) => list.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                You’re all caught up.
              </p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => open_(n)}
                    className={cx(
                      "flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50",
                      !n.read_at && "bg-indigo-50/40"
                    )}
                  >
                    <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", TONES[n.type] ?? "text-slate-400")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-700">{n.message}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                    {!n.read_at && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
