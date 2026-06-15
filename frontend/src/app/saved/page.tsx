"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiDelete } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  PageSpinner,
  EmptyState,
  Alert,
  Avatar,
  ProgressBar,
} from "@/components/ui";
import { Building2, Users as UsersIcon, Send, BookmarkX, Bookmark } from "lucide-react";
import type { Supervisor } from "@/lib/types";

function SavedInner() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/saved-supervisors");
      setSupervisors(res?.data ?? []);
    } catch {
      setError("Could not load your bookmarks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(s: Supervisor) {
    setRemovingId(s.id);
    try {
      await apiDelete(`/supervisors/${s.id}/save`);
      setSupervisors((list) => list.filter((x) => x.id !== s.id));
    } catch {
      setError("Could not remove this bookmark.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Container>
      <PageHeader
        title="My Bookmarks"
        description="Supervisors you have saved for later."
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading bookmarks…" />
      ) : supervisors.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          description="Save supervisors from the Find Supervisors page to see them here."
          icon={<Bookmark className="h-6 w-6" />}
          action={
            <Link href="/supervisors">
              <Button>Find Supervisors</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {supervisors.map((s) => (
            <Card key={s.id} hover className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={s.name} role="supervisor" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/supervisors/${s.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {s.department?.name ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {s.current_load}/{s.max_capacity} students
                    </span>
                  </div>
                </div>
                <Badge tone={s.has_capacity ? "green" : "red"}>
                  {s.has_capacity ? "Available" : "Full"}
                </Badge>
              </div>

              <div className="mt-3">
                <ProgressBar value={s.current_load} max={s.max_capacity} />
              </div>

              {s.interest_tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.interest_tags.slice(0, 6).map((t) => (
                    <Badge key={t} tone="gray">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={`/requests/new?supervisor_id=${s.id}`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full">
                    <Send className="h-4 w-4" />
                    Request
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  loading={removingId === s.id}
                  onClick={() => remove(s)}
                >
                  <BookmarkX className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function SavedPage() {
  return (
    <RequireAuth roles={["student"]}>
      <SavedInner />
    </RequireAuth>
  );
}
