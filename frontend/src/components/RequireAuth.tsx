"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageSpinner, Alert, Card } from "./ui";
import { ShieldAlert } from "lucide-react";
import type { Role } from "@/lib/types";

export default function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) return <PageSpinner label="Checking your session…" />;
  if (!user) return <PageSpinner label="Redirecting to login…" />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
          <p className="mt-2 text-sm text-slate-500">
            This section isn't available for your role. You are signed in as{" "}
            <span className="font-medium text-slate-700">{user.role_label}</span>.
            Use the navigation to reach the tools available to you.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
