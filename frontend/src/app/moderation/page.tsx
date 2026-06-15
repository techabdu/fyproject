"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch, ApiError, downloadProjectPdf } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Button,
  Badge,
  Label,
  Textarea,
  FieldError,
  Alert,
  Modal,
  EmptyState,
  PageSpinner,
} from "@/components/ui";
import { formatDate, timeAgo } from "@/lib/utils";
import { Check, X, FileDown, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import type { Project, Paginated } from "@/lib/types";

function ModerationInner() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<Paginated<Project>["meta"]>(undefined);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const [rejectTarget, setRejectTarget] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState("");

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const res: Paginated<Project> = await apiGet(`/moderation/projects?page=${p}`);
      setProjects(res?.data ?? []);
      setMeta(res?.meta);
    } catch {
      setError("Could not load the moderation queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function approve(project: Project) {
    setActionId(project.id);
    setActionError(null);
    try {
      await apiPatch(`/projects/${project.id}/approve`, {});
      await load();
    } catch {
      setActionError("Could not approve this project.");
    } finally {
      setActionId(null);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    setActionError(null);
    try {
      await apiPatch(`/projects/${rejectTarget.id}/reject`, {
        rejection_feedback: feedback,
      });
      setRejectTarget(null);
      setFeedback("");
      await load();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.fieldError("rejection_feedback") || err.message
          : "Could not reject this project."
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <Container>
      <PageHeader
        title="Moderation Queue"
        description="Review submitted projects awaiting approval."
      />

      {error && (
        <Alert tone="error" className="mb-4">{error}</Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">{actionError}</Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading queue…" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="All caught up"
          description="There are no projects pending approval in your scope right now."
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {meta?.total ?? projects.length} project
            {(meta?.total ?? projects.length) === 1 ? "" : "s"} awaiting review.
          </p>

          <div className="space-y-4">
            {projects.map((p) => (
              <Card key={p.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="yellow">
                        <Clock className="mr-1 h-3 w-3" />
                        pending
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {timeAgo(p.created_at)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {p.department?.name ?? "—"} · {p.graduation_year} · by{" "}
                      <span className="font-medium text-slate-700">
                        {p.uploader?.name ?? "Unknown"}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      loading={actionId === p.id}
                      onClick={() => approve(p)}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={actionId === p.id}
                      onClick={() => {
                        setRejectTarget(p);
                        setFeedback("");
                        setActionError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                  {p.abstract}
                </p>

                {p.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.keywords.map((k) => (
                      <Badge key={k} tone="blue">{k}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => downloadProjectPdf(p.id, `${p.title}.pdf`)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    Download PDF to review
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage((n) => n + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject project"
      >
        <p className="text-sm text-slate-500">
          Tell the student why this submission was rejected so they can revise
          and resubmit. Feedback is required.
        </p>
        <div className="mt-4">
          <Label htmlFor="rejection_feedback">Feedback</Label>
          <Textarea
            id="rejection_feedback"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. The abstract lacks methodology detail; please expand and resubmit."
          />
          <FieldError
            message={actionError && rejectTarget ? actionError : undefined}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={actionId === rejectTarget?.id}
            disabled={feedback.trim().length < 5}
            onClick={confirmReject}
          >
            Reject project
          </Button>
        </div>
      </Modal>
    </Container>
  );
}

export default function ModerationPage() {
  return (
    <RequireAuth roles={["dept_admin", "super_admin"]}>
      <ModerationInner />
    </RequireAuth>
  );
}
