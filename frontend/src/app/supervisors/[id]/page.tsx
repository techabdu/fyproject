"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import { Container } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  PageSpinner,
  Alert,
} from "@/components/ui";
import {
  ArrowLeft,
  Building2,
  Users as UsersIcon,
  Mail,
  Send,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import type { Supervisor } from "@/lib/types";

function SupervisorDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();

  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet(`/supervisors/${id}`)
      .then((res) => setSupervisor(res?.data ?? null))
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 404
            ? "This supervisor could not be found."
            : "Could not load this supervisor."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!supervisor) return;
    setSaving(true);
    const prev = supervisor.is_saved;
    setSupervisor({ ...supervisor, is_saved: !prev });
    try {
      if (prev) await apiDelete(`/supervisors/${supervisor.id}/save`);
      else await apiPost(`/supervisors/${supervisor.id}/save`);
    } catch {
      setSupervisor({ ...supervisor, is_saved: prev });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner label="Loading supervisor…" />;

  if (error || !supervisor) {
    return (
      <Container>
        <BackLink />
        <Alert tone="error">{error ?? "Supervisor not found."}</Alert>
      </Container>
    );
  }

  const isStudent = user?.role === "student";

  return (
    <Container className="max-w-3xl">
      <BackLink />

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {supervisor.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {supervisor.department?.name ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {supervisor.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                {supervisor.current_load}/{supervisor.max_capacity} students
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {supervisor.match && (
              <Badge
                tone={supervisor.match.percentage >= 60 ? "green" : "yellow"}
              >
                {supervisor.match.percentage}% match
              </Badge>
            )}
            <Badge tone={supervisor.has_capacity ? "green" : "red"}>
              {supervisor.has_capacity
                ? `${supervisor.available_slots} slot${
                    supervisor.available_slots === 1 ? "" : "s"
                  } open`
                : "At capacity"}
            </Badge>
          </div>
        </div>

        <hr className="my-6 border-slate-200" />

        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          About
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {supervisor.bio || "This supervisor has not added a bio yet."}
        </p>

        {supervisor.interest_tags?.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Interest areas
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {supervisor.interest_tags.map((t) => {
                const matched = supervisor.match?.matching_tags?.includes(t);
                return (
                  <Badge key={t} tone={matched ? "indigo" : "gray"}>
                    {t}
                  </Badge>
                );
              })}
            </div>
          </>
        )}

        {isStudent && (
          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
            <Link href={`/requests/new?supervisor_id=${supervisor.id}`}>
              <Button>
                <Send className="h-4 w-4" />
                Request supervision
              </Button>
            </Link>
            <Button variant="outline" onClick={toggleSave} loading={saving}>
              {supervisor.is_saved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-indigo-600" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </Container>
  );
}

function BackLink() {
  return (
    <Link
      href="/supervisors"
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to supervisors
    </Link>
  );
}

export default function SupervisorDetailPage() {
  return (
    <RequireAuth>
      <SupervisorDetailInner />
    </RequireAuth>
  );
}
