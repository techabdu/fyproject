"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Button,
  Input,
  Label,
  FieldError,
  Alert,
  Card,
} from "@/components/ui";
import { GraduationCap, Mail, Lock } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "superadmin@abu.edu.ng" },
  { label: "Dept Admin (CS)", email: "cs.admin@abu.edu.ng" },
  { label: "Supervisor", email: "aisha.bello@abu.edu.ng" },
  { label: "Student", email: "ahmad.dalhat@student.abu.edu.ng" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // If already authenticated, leave the login page.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrors({});
    try {
      await apiPost("/login", { email, password });
      await refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setError(
          err.status === 422
            ? "Please check the details below."
            : err.message || "Sign in failed.",
        );
      } else {
        setError("Could not reach the server. Is the backend running?");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password");
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
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          <Card className="p-6">
            {error && (
              <Alert tone="error" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@abu.edu.ng"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.email?.[0]} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pl-9"
                  />
                </div>
                <FieldError message={errors.password?.[0]} />
              </div>
              <Button type="submit" loading={submitting} className="w-full">
                Sign in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              No account?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:underline"
              >
                Register
              </Link>
            </p>
          </Card>

          {/* Demo accounts */}
          <Card className="mt-5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Demo accounts
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Password for all:{" "}
              <code className="rounded bg-slate-100 px-1">password</code>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="block font-semibold text-slate-700">
                    {a.label}
                  </span>
                  <span className="block truncate text-slate-400">
                    {a.email}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
