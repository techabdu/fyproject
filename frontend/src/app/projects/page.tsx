"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
import {
  Search,
  Upload,
  Calendar,
  Building2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react";
import type { Project, Department, Paginated } from "@/lib/types";

function ProjectsInner() {
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  // Filter inputs (controlled).
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [topic, setTopic] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Meta (departments + topics) once.
  useEffect(() => {
    apiGet("/departments")
      .then((res) => setDepartments(res?.data ?? []))
      .catch(() => {});
    apiGet("/topics")
      .then((res) => setTopics(res?.data ?? []))
      .catch(() => {});
  }, []);

  function buildQuery(targetPage: number) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (year) params.set("year", year);
    if (departmentId) params.set("department_id", departmentId);
    if (topic) params.set("topic", topic);
    params.set("page", String(targetPage));
    return params.toString();
  }

  async function load(targetPage: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/projects?${buildQuery(targetPage)}`);
      setResult(res);
      setPage(targetPage);
    } catch {
      setError("Could not load projects.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Initial load.
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    load(1);
  }

  const meta = result?.meta;
  const projects = result?.data ?? [];

  // Year options: current year back ~10 years.
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => thisYear - i);

  const hasActiveFilters = year || departmentId || topic;

  return (
    <Container>
      <PageHeader
        title="Project Repository"
        description="Browse and search approved final-year projects."
        action={
          user?.role === "student" ? (
            <Link href="/projects/upload">
              <Button>
                <Upload className="h-4 w-4" />
                Upload Project
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Search and filters */}
      <form onSubmit={onSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, abstract, or keyword..."
              className="h-11 pl-11 text-base"
            />
          </div>
          <Button type="submit" className="h-11 px-6">
            Search
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
              {[year, departmentId, topic].filter(Boolean).length}
            </span>
          )}
        </button>

        {filtersOpen && (
          <Card className="mt-3 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Year
                </label>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Any year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Department
                </label>
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
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Topic
                </label>
                <Select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  <option value="">Any topic</option>
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setYear("");
                  setDepartmentId("");
                  setTopic("");
                }}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </Card>
        )}
      </form>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10 text-slate-300" />}
          title="No projects found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {meta?.total ?? projects.length}
            </span>{" "}
            project{(meta?.total ?? projects.length) === 1 ? "" : "s"}
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const statusColor =
                p.status === "approved"
                  ? "text-emerald-500"
                  : p.status === "rejected"
                    ? "text-red-400"
                    : "text-amber-400";

              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="group">
                  <Card hover className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <Circle className={`h-2 w-2 fill-current ${statusColor}`} />
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {p.graduation_year}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                      {p.title}
                    </h3>
                    {p.uploader?.name && (
                      <p className="mt-1 text-xs text-slate-400">
                        by {p.uploader.name}
                      </p>
                    )}

                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                      {p.abstract}
                    </p>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {p.department?.name ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {p.graduation_year}
                        </span>
                      </div>
                      {p.keywords?.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {p.keywords.slice(0, 3).map((k) => (
                            <Badge key={k} tone="blue">
                              {k}
                            </Badge>
                          ))}
                          {p.keywords.length > 3 && (
                            <Badge tone="gray">+{p.keywords.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter((p) => {
                    if (meta.last_page <= 7) return true;
                    if (p === 1 || p === meta.last_page) return true;
                    return Math.abs(p - page) <= 1;
                  })
                  .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) {
                      acc.push("ellipsis");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => load(item as number)}
                        className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium ${
                          page === item
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => load(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default function ProjectsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<PageSpinner />}>
        <ProjectsInner />
      </Suspense>
    </RequireAuth>
  );
}
