"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Button,
  Input,
  Label,
  Select,
  FieldError,
  Alert,
  Card,
  cx,
} from "@/components/ui";
import { GraduationCap, UserCog, User, Mail, Lock } from "lucide-react";
import type { Department } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "student",
    department_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    apiGet("/departments")
      .then((res) => setDepartments(res?.data ?? []))
      .catch(() => setDepartments([]));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrors({});
    try {
      await apiPost("/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null,
      });
      // Backend logs the user in on register (session cookie). Refresh state.
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setError(
          err.status === 422
            ? "Please fix the highlighted fields."
            : err.message || "Registration failed.",
        );
      } else {
        setError("Could not reach the server. Is the backend running?");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Left brand panel (desktop only) ─── */}
      <div className="hidden w-[40%] flex-col items-center justify-center bg-[#1e3a5f] px-10 lg:flex">
        {/* Decorative dots */}
        <div className="absolute left-6 top-8 grid grid-cols-5 gap-2 opacity-20" aria-hidden>
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="block h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>

        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white">
          <GraduationCap className="h-9 w-9" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-white">FYP Platform</h1>
        <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-300">
          Your one-stop portal for final year projects, supervisor matching, and
          departmental moderation at Ahmadu Bello University.
        </p>

        {/* Decorative dots bottom */}
        <div className="absolute bottom-8 right-10 grid grid-cols-5 gap-2 opacity-20" aria-hidden>
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="block h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 text-center lg:hidden">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
              <GraduationCap className="h-7 w-7" />
            </span>
            <h1 className="mt-3 text-xl font-bold text-slate-900">
              FYP Platform
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Join the FYP Platform to get started
            </p>
          </div>

          <Card className="p-6">
            {error && (
              <Alert tone="error" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.name?.[0]} />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@abu.edu.ng"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.email?.[0]} />
              </div>

              {/* Role selector - card buttons */}
              <div>
                <Label>I am a...</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => set("role", "student")}
                    className={cx(
                      "flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      form.role === "student"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    <GraduationCap className="h-5 w-5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => set("role", "supervisor")}
                    className={cx(
                      "flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                      form.role === "supervisor"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    <UserCog className="h-5 w-5" />
                    Supervisor
                  </button>
                </div>
                <FieldError message={errors.role?.[0]} />
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select
                  id="department_id"
                  value={form.department_id}
                  onChange={(e) => set("department_id", e.target.value)}
                  required
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.department_id?.[0]} />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.password?.[0]} />
              </div>

              {/* Confirm password */}
              <div>
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) =>
                      set("password_confirmation", e.target.value)
                    }
                    placeholder="Re-enter password"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.password_confirmation?.[0]} />
              </div>

              <Button type="submit" loading={submitting} className="w-full">
                Create account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
