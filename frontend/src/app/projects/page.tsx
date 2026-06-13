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
import { Search, Upload, Calendar, Building2 } from "lucide-react";
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

      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={onSearch} className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, abstract or keyword…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">All depts</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Any topic</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-1">
            <Button type="submit" className="w-full">
              Go
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <PageSpinner label="Loading projects…" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {meta?.total ?? projects.length} project
            {(meta?.total ?? projects.length) === 1 ? "" : "s"} found
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="group">
                <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md">
                  <h3 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-indigo-700">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">
                    {p.abstract}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {p.department?.name ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {p.graduation_year}
                    </span>
                  </div>
                  {p.keywords?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.keywords.slice(0, 4).map((k) => (
                        <Badge key={k} tone="blue">
                          {k}
                        </Badge>
                      ))}
                      {p.keywords.length > 4 && (
                        <Badge tone="gray">+{p.keywords.length - 4}</Badge>
                      )}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
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
                onClick={() => load(page + 1)}
              >
                Next
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
