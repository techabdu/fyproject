"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiGet, downloadProjectPdf, ApiError } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { Container } from "@/components/Container";
import {
  Card,
  Badge,
  Button,
  StatusBadge,
  PageSpinner,
  Alert,
  Avatar,
} from "@/components/ui";
import {
  ArrowLeft,
  Download,
  Calendar,
  Building2,
  User as UserIcon,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Project, SimilarProject } from "@/lib/types";

function ProjectDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [similar, setSimilar] = useState<SimilarProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet(`/projects/${id}`)
      .then((res) => {
        setProject(res?.data ?? null);
        setSimilar(res?.similar_projects ?? []);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("This project could not be found.");
        } else {
          setError("Could not load this project.");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    if (!project) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadProjectPdf(
        project.id,
        `${project.title.slice(0, 60).replace(/[^\w\- ]+/g, "")}.pdf`
      );
    } catch {
      setDownloadError("Could not download the PDF for this project.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <PageSpinner label="Loading project..." />;

  if (error || !project) {
    return (
      <Container>
        <BackLink />
        <Alert tone="error">{error ?? "Project not found."}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            {/* Header with status badge top-right */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-slate-900">
                {project.title}
              </h1>
              <StatusBadge status={project.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {project.department?.name ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {project.graduation_year}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {project.uploader ? (
                  <Avatar name={project.uploader.name} role={project.uploader.role} size="sm" />
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
                {project.uploader?.name ?? "Unknown"}
              </span>
            </div>

            {project.keywords?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.keywords.slice(0, 6).map((k) => (
                  <Badge key={k} tone="blue">
                    {k}
                  </Badge>
                ))}
              </div>
            )}

            <hr className="my-6 border-slate-200" />

            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Abstract
            </h2>
            <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-slate-700">
              {project.abstract}
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Button onClick={handleDownload} loading={downloading}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
            {downloadError && (
              <Alert tone="error" className="mt-3">
                {downloadError}
              </Alert>
            )}

            {project.status === "rejected" && project.rejection_feedback && (
              <Alert tone="warning" className="mt-6">
                <span className="font-semibold">Moderator feedback: </span>
                {project.rejection_feedback}
              </Alert>
            )}
          </Card>
        </div>

        {/* Similar projects sidebar */}
        <div>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-indigo-600" />
              Similar Projects
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Existing projects with overlapping keywords.
            </p>

            <div className="mt-4 space-y-2">
              {similar.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  No closely related projects found.
                </p>
              ) : (
                similar.map((s) => (
                  <Link
                    key={s.id}
                    href={`/projects/${s.id}`}
                    className="block rounded-lg border border-slate-200 p-3 transition-colors hover:border-indigo-300 hover:bg-slate-50"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">
                      {s.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {s.graduation_year}
                      </span>
                      <Badge tone="purple">
                        {Math.round((s.overlap_ratio ?? 0) * 100)}% overlap
                      </Badge>
                    </div>
                    {s.matching_keywords?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.matching_keywords.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}

function BackLink() {
  return (
    <Link
      href="/projects"
      className="mb-5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to repository
    </Link>
  );
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth>
      <ProjectDetailInner />
    </RequireAuth>
  );
}
