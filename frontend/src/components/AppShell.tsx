"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import Navbar from "./Navbar";

/** Client wrapper: provides auth context + the top navigation to every page. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
    </AuthProvider>
  );
}
