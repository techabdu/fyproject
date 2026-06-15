"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Card, PageSpinner } from "@/components/ui";
import {
  BookOpen,
  Users,
  GitPullRequest,
  ShieldCheck,
  GraduationCap,
  UserPlus,
  Search,
  CheckCircle2,
  FileText,
  Building2,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) return <PageSpinner />;
  if (user) return <PageSpinner label="Taking you to your dashboard..." />;

  const features = [
    {
      icon: BookOpen,
      title: "Project Repository",
      body: "Browse and search past final-year projects, with duplicate detection on new uploads.",
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      icon: Users,
      title: "Supervisor Matching",
      body: "Rank supervisors by how well their interests match your proposal keywords.",
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      icon: GitPullRequest,
      title: "Supervision Requests",
      body: "Send, track and respond to supervision requests in one place.",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: ShieldCheck,
      title: "Moderation",
      body: "Department admins review and approve submissions before they go live.",
      iconBg: "bg-amber-100 text-amber-600",
    },
  ];

  const steps = [
    {
      num: "1",
      icon: UserPlus,
      title: "Create Account",
      desc: "Register as a student or supervisor with your university email.",
    },
    {
      num: "2",
      icon: Search,
      title: "Find Your Match",
      desc: "Browse supervisors and projects. Our matching algorithm ranks the best fits.",
    },
    {
      num: "3",
      icon: CheckCircle2,
      title: "Get Supervised",
      desc: "Send a request, get accepted, and start your final year project.",
    },
  ];

  const stats = [
    { icon: FileText, label: "10+ Projects", sublabel: "In repository" },
    { icon: Users, label: "8+ Supervisors", sublabel: "Available" },
    { icon: Building2, label: "4 Departments", sublabel: "Participating" },
    { icon: GraduationCap, label: "ABU Faculty", sublabel: "University-wide" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─── */}
      <section className="bg-[#1e3a5f]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:gap-16 lg:py-28">
          {/* Left copy */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              Ahmadu Bello University
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              Final Year Project Repository &amp; Supervisor Matching
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              A single platform for students to explore past projects, find the
              right supervisor, and manage supervision requests — with moderation
              built in for departments.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-[#1e3a5f] hover:bg-slate-100 focus-visible:ring-white"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="border border-white/40 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Right decorative cards */}
          <div className="hidden flex-1 lg:block" aria-hidden>
            <div className="relative mx-auto h-80 w-full max-w-md">
              {/* Card 1 */}
              <div className="absolute left-4 top-0 h-44 w-56 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-none">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-3/4 rounded bg-white/20" />
                  <div className="h-2 w-1/2 rounded bg-white/15" />
                </div>
              </div>
              {/* Card 2 */}
              <div className="absolute right-0 top-10 h-44 w-56 rounded-2xl border border-white/10 bg-white/[0.08] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Users className="h-5 w-5" />
                </span>
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-2/3 rounded bg-white/20" />
                  <div className="h-2 w-1/2 rounded bg-white/15" />
                </div>
              </div>
              {/* Card 3 */}
              <div className="absolute bottom-0 left-16 h-40 w-56 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-3/5 rounded bg-white/20" />
                  <div className="h-2 w-2/5 rounded bg-white/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Built for your final year
            </h2>
            <p className="mt-3 text-base text-slate-500">
              Everything you need to navigate your final year project, in one
              place.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card
                key={f.title}
                className="p-6 transition-shadow duration-200 hover:shadow-md"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${f.iconBg}`}
                >
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {f.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            How it works
          </h2>
          <p className="mt-3 text-center text-base text-slate-500">
            Three simple steps to get started
          </p>

          <div className="relative mt-14">
            {/* Dashed connector line */}
            <div
              className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] border-l-2 border-dashed border-slate-300 sm:block"
              aria-hidden
            />

            <div className="space-y-10">
              {steps.map((s) => (
                <div key={s.num} className="relative flex items-start gap-5">
                  <span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div className="pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Step {s.num}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-lg font-bold text-slate-900">{s.label}</p>
              <p className="text-sm text-slate-500">{s.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-[#1e3a5f] py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to start your project journey?
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Join students and supervisors already using the platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-[#1e3a5f] hover:bg-slate-100 focus-visible:ring-white"
              >
                Register Now
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="border border-white/40 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} FYP Platform &mdash; Ahmadu Bello
            University, Zaria
          </p>
        </div>
      </footer>
    </div>
  );
}
