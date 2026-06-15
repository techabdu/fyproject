"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, useSidebar } from "@/lib/sidebar";
import Sidebar from "./Sidebar";
import { cx } from "./ui";

function ShellInner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const hasSidebar = !!user && !isPublicPage;

  return (
    <>
      <Sidebar />
      <div
        className={cx(
          "flex min-h-screen flex-col transition-all duration-200",
          hasSidebar && !collapsed && "md:ml-[var(--sidebar-width)]",
          hasSidebar && collapsed && "md:ml-[var(--sidebar-collapsed-width)]"
        )}
      >
        {hasSidebar && <div className="h-14 shrink-0 hidden md:block" />}
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <ShellInner>{children}</ShellInner>
      </SidebarProvider>
    </AuthProvider>
  );
}
