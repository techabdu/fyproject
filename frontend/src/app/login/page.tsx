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
import { GraduationCap } from "lucide-react";

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
            : err.message || "Sign in failed."
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <GraduationCap className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to the FYP Platform
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
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@abu.edu.ng"
              required
            />
            <FieldError message={errors.email?.[0]} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <FieldError message={errors.password?.[0]} />
          </div>
          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </Card>

      {/* Demo accounts for the academic demo (password: "password"). */}
      <Card className="mt-5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Demo accounts
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Password for all: <code className="rounded bg-slate-100 px-1">password</code>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => fillDemo(a.email)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span className="block font-semibold text-slate-700">
                {a.label}
              </span>
              <span className="block truncate text-slate-400">{a.email}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
