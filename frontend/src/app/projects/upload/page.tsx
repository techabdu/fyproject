"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Label,
  FieldError,
  Alert,
  Badge,
} from "@/components/ui";
import { parseKeywords } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, FileUp } from "lucide-react";
import type { Department } from "@/lib/types";

function UploadInner() {
  const router = useRouter();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    department_id: "",
    graduation_year: String(new Date().getFullYear()),
    keywords: "",
  });
  const [pdf, setPdf] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<{
    projectId: number;
    advisory: any[];
  } | null>(null);

  useEffect(() => {
    apiGet("/departments")
      .then((res) => setDepartments(res?.data ?? []))
      .catch(() => {});
  }, []);

  // Default the department to the student's own department when known.
  useEffect(() => {
    if (user?.department_id && !form.department_id) {
      setForm((f) => ({ ...f, department_id: String(user.department_id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrors({});
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("abstract", form.abstract);
      fd.append("department_id", form.department_id);
      fd.append("graduation_year", form.graduation_year);
      // keywords[] — one append per item.
      for (const k of parseKeywords(form.keywords)) {
        fd.append("keywords[]", k);
      }
      if (pdf) fd.append("pdf", pdf);

      const res = await apiPost("/projects", fd, true);
      setSuccess({
        projectId: res?.data?.id,
        advisory: res?.duplicate_advisory ?? [],
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setError(
          err.status === 422
            ? "Please fix the highlighted fields."
            : err.message || "Upload failed."
        );
      } else {
        setError("Could not reach the server.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => thisYear - i);

  // Success view.
  if (success) {
    return (
      <Container className="max-w-3xl">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Project submitted
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your project has been submitted and is now awaiting moderation by a
            department admin.
          </p>

          {success.advisory.length > 0 && (
            <Alert tone="warning" className="mt-6 text-left">
              <p className="font-semibold">
                Possible duplicates detected ({success.advisory.length})
              </p>
              <p className="mt-1 text-xs">
                Your submission shares keywords with existing projects. A
                moderator will review it.
              </p>
              <ul className="mt-3 space-y-2">
                {success.advisory.map((d: any, i: number) => (
                  <li
                    key={d.id ?? i}
                    className="rounded-md border border-amber-200 bg-white/60 p-2 text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {d.title ?? `Project #${d.id}`}
                    </span>
                    {typeof d.overlap_ratio === "number" && (
                      <Badge tone="purple" className="ml-2">
                        {Math.round(d.overlap_ratio * 100)}% overlap
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/projects">
              <Button variant="outline">Back to repository</Button>
            </Link>
            <Button
              onClick={() => {
                setSuccess(null);
                setForm((f) => ({
                  ...f,
                  title: "",
                  abstract: "",
                  keywords: "",
                }));
                setPdf(null);
              }}
            >
              Upload another
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl">
      <Link
        href="/projects"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to repository
      </Link>

      <PageHeader
        title="Upload a Project"
        description="Submit your final-year project for moderation."
      />

      <Card className="p-6 sm:p-8">
        {error && (
          <Alert tone="error" className="mb-5">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Project title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. A Deep Learning Approach to Crop Disease Detection"
              required
            />
            <FieldError message={errors.title?.[0]} />
          </div>

          <div>
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              rows={6}
              value={form.abstract}
              onChange={(e) => set("abstract", e.target.value)}
              placeholder="Summarise the problem, approach and findings…"
              required
            />
            <FieldError message={errors.abstract?.[0]} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="department_id">Department</Label>
              <Select
                id="department_id"
                value={form.department_id}
                onChange={(e) => set("department_id", e.target.value)}
                required
              >
                <option value="">Select…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.department_id?.[0]} />
            </div>
            <div>
              <Label htmlFor="graduation_year">Graduation year</Label>
              <Select
                id="graduation_year"
                value={form.graduation_year}
                onChange={(e) => set("graduation_year", e.target.value)}
                required
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.graduation_year?.[0]} />
            </div>
          </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              placeholder="machine learning, agriculture, image classification"
            />
            <p className="mt-1 text-xs text-slate-400">
              Separate with commas.
            </p>
            {parseKeywords(form.keywords).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parseKeywords(form.keywords).map((k) => (
                  <Badge key={k} tone="blue">
                    {k}
                  </Badge>
                ))}
              </div>
            )}
            <FieldError message={errors["keywords"]?.[0]} />
            <FieldError message={errors["keywords.0"]?.[0]} />
          </div>

          <div>
            <Label htmlFor="pdf">Project PDF</Label>
            <label
              htmlFor="pdf"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 hover:border-indigo-400 hover:bg-indigo-50/40"
            >
              <FileUp className="h-5 w-5 text-slate-400" />
              {pdf ? (
                <span className="font-medium text-slate-700">{pdf.name}</span>
              ) : (
                <span>Click to choose a PDF file</span>
              )}
            </label>
            <input
              id="pdf"
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            />
            <FieldError message={errors.pdf?.[0]} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/projects">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              Submit project
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}

export default function UploadPage() {
  return (
    <RequireAuth roles={["student"]}>
      <UploadInner />
    </RequireAuth>
  );
}
