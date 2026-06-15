"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/lib/sidebar";
import { cx, Avatar } from "./ui";
import NotificationBell from "./NotificationBell";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  Inbox,
  Bookmark,
  UserCog,
  ShieldCheck,
  BarChart3,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  section: string;
}

const LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "supervisor", "dept_admin", "super_admin"], section: "Main" },
  { href: "/projects", label: "Repository", icon: BookOpen, roles: ["student", "supervisor", "dept_admin", "super_admin"], section: "Main" },
  { href: "/supervisors", label: "Find Supervisors", icon: Users, roles: ["student"], section: "Supervision" },
  { href: "/requests", label: "My Requests", icon: Inbox, roles: ["student"], section: "Supervision" },
  { href: "/requests", label: "Incoming Requests", icon: Inbox, roles: ["supervisor"], section: "Supervision" },
  { href: "/saved", label: "Bookmarks", icon: Bookmark, roles: ["student"], section: "Supervision" },
  { href: "/profile", label: "My Profile", icon: UserCog, roles: ["supervisor"], section: "Supervision" },
  { href: "/moderation", label: "Moderation", icon: ShieldCheck, roles: ["dept_admin", "super_admin"], section: "Management" },
  { href: "/admin/users", label: "Users", icon: UserCog, roles: ["super_admin"], section: "Management" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin"], section: "Management" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";

  if (isAuthPage || isLanding || !user) return null;

  const links = LINKS.filter((l) => l.roles.includes(user.role));

  const sections = links.reduce<Record<string, NavLink[]>>((acc, l) => {
    (acc[l.section] ??= []).push(l);
    return acc;
  }, {});

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
            <GraduationCap className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-bold text-slate-900 tracking-tight">
              FYP Platform
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? l.label : undefined}
                  className={cx(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-100",
                    isActive(l.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <l.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{l.label}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} role={user.role} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.role_label}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={user.name} role={user.role} size="sm" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg py-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title={`Logout (${user.name})`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          onClick={toggle}
          className="mt-2 hidden w-full items-center justify-center rounded-lg py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors md:flex"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-900">FYP Platform</span>
        </Link>
        <NotificationBell />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl animate-fade">
            <div className="absolute right-2 top-2 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cx(
          "fixed left-0 top-0 z-30 hidden h-screen border-r border-slate-200 bg-white transition-all duration-200 md:block",
          collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop top bar */}
      <div
        className={cx(
          "fixed top-0 right-0 z-30 hidden h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 md:flex transition-all duration-200",
          collapsed ? "left-[var(--sidebar-collapsed-width)]" : "left-[var(--sidebar-width)]"
        )}
      >
        <NotificationBell />
        {collapsed && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role_label}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
