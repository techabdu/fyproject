"use client";

import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { Container } from "@/components/Container";
import { Card, Badge } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Users,
  Inbox,
  Bookmark,
  UserCog,
  ShieldCheck,
  Upload,
  ArrowRight,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface QuickLink {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LINKS_BY_ROLE: Record<Role, QuickLink[]> = {
  student: [
    {
      href: "/projects",
      title: "Project Repository",
      description: "Browse and search approved final-year projects.",
      icon: BookOpen,
    },
    {
      href: "/projects/upload",
      title: "Upload a Project",
      description: "Submit your project with duplicate detection.",
      icon: Upload,
    },
    {
      href: "/supervisors",
      title: "Find Supervisors",
      description: "Match supervisors to your proposal keywords.",
      icon: Users,
    },
    {
      href: "/requests",
      title: "My Requests",
      description: "Track the status of your supervision requests.",
      icon: Inbox,
    },
    {
      href: "/saved",
      title: "My Bookmarks",
      description: "Supervisors you have saved for later.",
      icon: Bookmark,
    },
  ],
  supervisor: [
    {
      href: "/requests",
      title: "Incoming Requests",
      description: "Review and respond to supervision requests.",
      icon: Inbox,
    },
    {
      href: "/profile",
      title: "My Profile",
      description: "Edit your bio, capacity and interest areas.",
      icon: UserCog,
    },
    {
      href: "/projects",
      title: "Project Repository",
      description: "Browse approved final-year projects.",
      icon: BookOpen,
    },
  ],
  dept_admin: [
    {
      href: "/moderation",
      title: "Moderation Queue",
      description: "Approve or reject pending project submissions.",
      icon: ShieldCheck,
    },
    {
      href: "/projects",
      title: "Project Repository",
      description: "Browse approved final-year projects.",
      icon: BookOpen,
    },
  ],
  super_admin: [
    {
      href: "/moderation",
      title: "Moderation Queue",
      description: "Approve or reject pending project submissions.",
      icon: ShieldCheck,
    },
    {
      href: "/projects",
      title: "Project Repository",
      description: "Browse approved final-year projects.",
      icon: BookOpen,
    },
  ],
};

function DashboardInner() {
  const { user } = useAuth();
  if (!user) return null;

  const links = LINKS_BY_ROLE[user.role] ?? [];
  const profile = user.supervisor_profile;

  return (
    <Container>
      {/* Greeting */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-sm">
        <p className="text-sm font-medium text-indigo-100">
          {user.role_label}
          {user.department ? ` · ${user.department.name}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Welcome, {user.name}</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">
          Here are the tools available to you. Use the navigation above to move
          between sections at any time.
        </p>

        {/* Supervisor capacity summary */}
        {user.role === "supervisor" && profile && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="indigo" className="bg-white/15 text-white">
              Capacity: {profile.current_load}/{profile.max_capacity}
            </Badge>
            <Badge tone="indigo" className="bg-white/15 text-white">
              {profile.available_slots} slot
              {profile.available_slots === 1 ? "" : "s"} open
            </Badge>
            <Badge tone="indigo" className="bg-white/15 text-white">
              {profile.has_capacity ? "Accepting students" : "At capacity"}
            </Badge>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.title} href={l.href} className="group">
            <Card className="h-full p-6 transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <l.icon className="h-6 w-6" />
                </span>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-indigo-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {l.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{l.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
