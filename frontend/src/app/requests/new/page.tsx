"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Button,
  Label,
  Input,
  Textarea,
  Select,
  FieldError,
  Alert,
  Badge,
  PageSpinner,
} from "@/components/ui";
import { parseKeywords } from "@/lib/utils";
import { ArrowLeft, Send } from "lucide-react";
import type { Supervisor } from "@/lib/types";

function NewRequestInner() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedId = params.get("supervisor_id") ?? "";
  const prefillKeywords = params.get("keywords") ?? "";

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);

  const [supervisorId, setSupervisorId] = useState(preselectedId);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState(prefillKeywords);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/supervisors");
        setSupervisors(res?.data ?? []);
      } catch {
        setFormError("Could not load the list of supervisors.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => supervisors.find((s) => String(s.id) === String(supervisorId)),
    [supervisors, supervisorId]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    const parsedKeywords = parseKeywords(keywords);

    try {
      await apiPost("/requests", {
        supervisor_id: Number(supervisorId),
        proposed_title: title,
        proposal_summary: summary,
        proposal_keywords: parsedKeywords,
      });
      router.push("/requests");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.errors)) flat[k] = v[0];
          setErrors(flat);
        }
        // Business-rule errors (e.g. one active request) arrive as 422 message.
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSpinner label="Loading supervisors…" />;

  return (
    <Container className="max-w-3xl">
      <Link
        href="/supervisors"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to supervisors
      </Link>

      <PageHeader
        title="Request supervision"
        description="Send a formal supervision request with your proposed topic. You may hold only one active request at a time."
      />

      {formError && (
        <Alert tone="error" className="mb-5">
          {formError}
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="supervisor">Supervisor</Label>
            <Select
              id="supervisor"
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              required
            >
              <option value="">Select a supervisor…</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.department ? ` — ${s.department.name}` : ""}
                  {s.has_capacity ? "" : " (full)"}
                </option>
              ))}
            </Select>
            <FieldError message={errors.supervisor_id} />

            {selected && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {selected.name}
                  </span>
                  <Badge tone={selected.has_capacity ? "green" : "red"}>
                    {selected.available_slots}/{selected.max_capacity} slots
                  </Badge>
                  {selected.match && (
                    <Badge tone="indigo">{selected.match.percentage}% match</Badge>
                  )}
                </div>
                {selected.interest_tags.length > 0 && (
                  <p className="mt-2 text-slate-500">
                    Interests: {selected.interest_tags.join(", ")}
                  </p>
                )}
                {!selected.has_capacity && (
                  <p className="mt-2 text-red-600">
                    This supervisor is at full capacity and may be unable to
                    accept new students.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="title">Proposed title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A Deep Learning Approach to Crop Disease Detection"
              required
            />
            <FieldError message={errors.proposed_title} />
          </div>

          <div>
            <Label htmlFor="summary">Proposal summary</Label>
            <Textarea
              id="summary"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Briefly describe your proposed project, its objectives and approach."
              required
            />
            <FieldError message={errors.proposal_summary} />
          </div>

          <div>
            <Label htmlFor="keywords">Topic keywords</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma separated, e.g. machine learning, computer vision"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used to compute your match score with the supervisor’s interests.
            </p>
            <FieldError message={errors["proposal_keywords.0"] || errors.proposal_keywords} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Link href="/supervisors">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={submitting} disabled={!supervisorId}>
              <Send className="h-4 w-4" />
              Send request
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}

export default function NewRequestPage() {
  return (
    <RequireAuth roles={["student"]}>
      <Suspense fallback={<PageSpinner />}>
        <NewRequestInner />
      </Suspense>
    </RequireAuth>
  );
}
