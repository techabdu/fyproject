"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  PageSpinner,
  EmptyState,
  Alert,
} from "@/components/ui";
import { parseKeywords } from "@/lib/utils";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Building2,
  Users as UsersIcon,
  Send,
} from "lucide-react";
import type { Supervisor, Department } from "@/lib/types";

function SupervisorsInner() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);

  // Filters.
  const [proposalKeywords, setProposalKeywords] = useState("");
  const [interest, setInterest] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    apiGet("/departments")
      .then((res) => setDepartments(res?.data ?? []))
      .catch(() => {});
    apiGet("/interest-tags")
      .then((res) => setInterestTags(res?.data ?? []))
      .catch(() => {});
  }, []);

  function buildQuery() {
    const params = new URLSearchParams();
    for (const k of parseKeywords(proposalKeywords)) {
      params.append("proposal_keywords[]", k);
    }
    if (interest) params.set("interest", interest);
    if (departmentId) params.set("department_id", departmentId);
    if (availableOnly) params.set("available", "1");
    return params.toString();
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery();
      const res = await apiGet(`/supervisors${qs ? `?${qs}` : ""}`);
      setSupervisors(res?.data ?? []);
    } catch {
      setError("Could not load supervisors.");
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    load();
  }

  async function toggleSave(s: Supervisor) {
    setSavingId(s.id);
    // optimistic
    const prev = s.is_saved;
    setSupervisors((list) =>
      list.map((x) => (x.id === s.id ? { ...x, is_saved: !prev } : x))
    );
    try {
      if (prev) {
        await apiDelete(`/supervisors/${s.id}/save`);
      } else {
        await apiPost(`/supervisors/${s.id}/save`);
      }
    } catch (err) {
      // revert on failure
      setSupervisors((list) =>
        list.map((x) => (x.id === s.id ? { ...x, is_saved: prev } : x))
      );
      if (!(err instanceof ApiError && err.status === 409)) {
        setError("Could not update bookmark.");
      }
    } finally {
      setSavingId(null);
    }
  }

  const hasKeywords = parseKeywords(proposalKeywords).length > 0;

  return (
    <Container>
      <PageHeader
        title="Find Supervisors"
        description="Enter your proposal keywords to rank supervisors by how well their interests match."
      />

      <Card className="mb-6 p-4">
        <form onSubmit={onSearch} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Your proposal keywords
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={proposalKeywords}
                onChange={(e) => setProposalKeywords(e.target.value)}
                placeholder="e.g. machine learning, networks, security"
                className="pl-9"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Comma-separated. Supervisors are ranked by match when provided.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <Select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              >
                <option value="">Any interest area</option>
                {interestTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Available only
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">
                Search
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading supervisors…" />
      ) : supervisors.length === 0 ? (
        <EmptyState
          title="No supervisors found"
          description="Try removing some filters or broadening your keywords."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {supervisors.map((s) => (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/supervisors/${s.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-indigo-700"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
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
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {s.match && (
                    <Badge
                      tone={
                        s.match.percentage >= 60
                          ? "green"
                          : s.match.percentage >= 30
                          ? "yellow"
                          : "gray"
                      }
                    >
                      {s.match.percentage}% match
                    </Badge>
                  )}
                  <button
                    onClick={() => toggleSave(s)}
                    disabled={savingId === s.id}
                    title={s.is_saved ? "Remove bookmark" : "Save supervisor"}
                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-50"
                  >
                    {s.is_saved ? (
                      <BookmarkCheck className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {s.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {s.bio}
                </p>
              )}

              {/* Availability */}
              <div className="mt-3">
                <Badge tone={s.has_capacity ? "green" : "red"}>
                  {s.has_capacity
                    ? `${s.available_slots} slot${
                        s.available_slots === 1 ? "" : "s"
                      } open`
                    : "At capacity"}
                </Badge>
              </div>

              {/* Interests / matching tags */}
              {s.interest_tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.interest_tags.slice(0, 8).map((t) => {
                    const matched = s.match?.matching_tags?.includes(t);
                    return (
                      <Badge key={t} tone={matched ? "indigo" : "gray"}>
                        {t}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link href={`/supervisors/${s.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View profile
                  </Button>
                </Link>
                <Link
                  href={`/requests/new?supervisor_id=${s.id}${
                    hasKeywords
                      ? `&keywords=${encodeURIComponent(proposalKeywords)}`
                      : ""
                  }`}
                  className="flex-1"
                >
                  <Button size="sm" className="w-full">
                    <Send className="h-4 w-4" />
                    Request
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

export default function SupervisorsPage() {
  return (
    <RequireAuth>
      <SupervisorsInner />
    </RequireAuth>
  );
}
