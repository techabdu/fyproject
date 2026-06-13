"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cx } from "./ui";
import {
  GraduationCap,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Users,
  Inbox,
  Bookmark,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[]; // which roles see this link
}

const LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["student", "supervisor", "dept_admin", "super_admin"],
  },
  {
    href: "/projects",
    label: "Repository",
    icon: BookOpen,
    roles: ["student", "supervisor", "dept_admin", "super_admin"],
  },
  {
    href: "/supervisors",
    label: "Find Supervisors",
    icon: Users,
    roles: ["student"],
  },
  {
    href: "/requests",
    label: "My Requests",
    icon: Inbox,
    roles: ["student"],
  },
  {
    href: "/requests",
    label: "Incoming Requests",
    icon: Inbox,
    roles: ["supervisor"],
  },
  {
    href: "/saved",
    label: "Bookmarks",
    icon: Bookmark,
    roles: ["student"],
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: UserCog,
    roles: ["supervisor"],
  },
  {
    href: "/moderation",
    label: "Moderation",
    icon: ShieldCheck,
    roles: ["dept_admin", "super_admin"],
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Hide the nav entirely on the auth pages.
  if (pathname === "/login" || pathname === "/register") return null;

  const links = user ? LINKS.filter((l) => l.roles.includes(user.role)) : [];

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight">
              FYP Platform
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={cx(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(l.href)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User / actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-800">
                  {user.name}
                </p>
                <p className="text-xs leading-tight text-slate-500">
                  {user.role_label}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 md:flex"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button
                className="md:hidden"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="space-y-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive(l.href)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout ({user.name})
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
