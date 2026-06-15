"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  StatusBadge,
  PageSpinner,
  EmptyState,
  Alert,
  Modal,
  Textarea,
  Label,
  FieldError,
  Avatar,
  cx,
} from "@/components/ui";
import { toKeywordArray, formatDate } from "@/lib/utils";
import { Plus, Check, X, Inbox, Users } from "lucide-react";
import type { SupervisionRequest } from "@/lib/types";

const statusDot: Record<string, string> = {
  pending: "bg-amber-400",
  accepted: "bg-emerald-400",
  declined: "bg-red-400",
};

function RequestsInner() {
  const { user } = useAuth();
  const isSupervisor = user?.role === "supervisor";

  const [requests, setRequests] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [declineTarget, setDeclineTarget] = useState<SupervisionRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/requests");
      setRequests(res?.data ?? []);
    } catch {
      setError("Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function accept(req: SupervisionRequest) {
    setActionId(req.id);
    setActionError(null);
    try {
      await apiPatch(`/requests/${req.id}/accept`, {});
      await load();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message || "Could not accept this request."
          : "Could not accept this request."
      );
    } finally {
      setActionId(null);
    }
  }

  async function confirmDecline() {
    if (!declineTarget) return;
    setActionId(declineTarget.id);
    setActionError(null);
    try {
      await apiPatch(`/requests/${declineTarget.id}/decline`, {
        decision_reason: declineReason,
      });
      setDeclineTarget(null);
      setDeclineReason("");
      await load();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.fieldError("decision_reason") ||
              err.message ||
              "Could not decline this request."
          : "Could not decline this request."
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <Container>
      <PageHeader
        title={isSupervisor ? "Incoming Requests" : "My Requests"}
        description={
          isSupervisor
            ? "Review and respond to supervision requests from students."
            : "Track the status of the supervision requests you have sent."
        }
        action={
          !isSupervisor ? (
            <Link href="/requests/new">
              <Button>
                <Plus className="h-4 w-4" />
                New request
              </Button>
            </Link>
          ) : undefined
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">{error}</Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">{actionError}</Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState
          title={isSupervisor ? "No requests yet" : "No requests sent"}
          icon={<Inbox className="h-6 w-6" />}
          description={
            isSupervisor
              ? "When students request your supervision, they will appear here."
              : "Find a supervisor and send your first supervision request."
          }
          action={
            !isSupervisor ? (
              <Link href="/supervisors">
                <Button>Find Supervisors</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const counterpart = isSupervisor ? req.student : req.supervisor;
            const keywords = toKeywordArray(req.proposal_keywords);
            return (
              <Card key={req.id} className="flex gap-4 p-5 sm:p-6">
                <div className="mt-1.5 flex flex-col items-center">
                  <span className={cx("h-3 w-3 rounded-full shrink-0", statusDot[req.status] ?? "bg-slate-300")} />
                  <div className="mt-1 w-px flex-1 bg-slate-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} />
                        <span className="text-xs text-slate-400">
                          {formatDate(req.created_at)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {req.proposed_title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        {counterpart && (
                          <Avatar name={counterpart.name ?? "?"} role={isSupervisor ? "student" : "supervisor"} size="sm" />
                        )}
                        <span>
                          {isSupervisor ? "From" : "To"}:{" "}
                          <span className="font-medium text-slate-700">
                            {counterpart?.name ?? "—"}
                          </span>
                          {counterpart?.department
                            ? ` · ${counterpart.department.name}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {isSupervisor && req.status === "pending" && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          loading={actionId === req.id}
                          onClick={() => accept(req)}
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={actionId === req.id}
                          onClick={() => {
                            setDeclineTarget(req);
                            setDeclineReason("");
                            setActionError(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                    {req.proposal_summary}
                  </p>

                  {keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {keywords.map((k) => (
                        <Badge key={k} tone="blue">{k}</Badge>
                      ))}
                    </div>
                  )}

                  {req.decision_reason && (
                    <Alert
                      tone={req.status === "accepted" ? "success" : "warning"}
                      className="mt-4"
                    >
                      <span className="font-semibold">
                        {req.status === "accepted"
                          ? "Acceptance note: "
                          : "Reason: "}
                      </span>
                      {req.decision_reason}
                    </Alert>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        title="Decline request"
      >
        <p className="text-sm text-slate-500">
          Let the student know why you're declining. A reason is required.
        </p>
        <div className="mt-4">
          <Label htmlFor="decision_reason">Reason</Label>
          <Textarea
            id="decision_reason"
            rows={4}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. I'm at full capacity this semester, or this topic is outside my area."
          />
          <FieldError
            message={actionError && declineTarget ? actionError : undefined}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => setDeclineTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={actionId === declineTarget?.id}
            disabled={!declineReason.trim()}
            onClick={confirmDecline}
          >
            Decline request
          </Button>
        </div>
      </Modal>
    </Container>
  );
}

export default function RequestsPage() {
  return (
    <RequireAuth roles={["student", "supervisor"]}>
      <RequestsInner />
    </RequireAuth>
  );
}
