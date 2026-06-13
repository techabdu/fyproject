"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, PageSpinner } from "@/components/ui";
import { BookOpen, Users, GitPullRequest, ShieldCheck } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) return <PageSpinner />;
  if (user) return <PageSpinner label="Taking you to your dashboard…" />;

  const features = [
    {
      icon: BookOpen,
      title: "Project Repository",
      body: "Browse and search past final-year projects, with duplicate detection on new uploads.",
    },
    {
      icon: Users,
      title: "Supervisor Matching",
      body: "Rank supervisors by how well their interests match your proposal keywords.",
    },
    {
      icon: GitPullRequest,
      title: "Supervision Requests",
      body: "Send, track and respond to supervision requests in one place.",
    },
    {
      icon: ShieldCheck,
      title: "Moderation",
      body: "Department admins review and approve submissions before they go live.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="py-16 text-center sm:py-24">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          Ahmadu Bello University
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Final Year Project Repository &amp; Supervisor Matching
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          A single platform for students to explore past projects, find the
          right supervisor, and manage supervision requests — with moderation
          built in for departments.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="md">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="md">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
