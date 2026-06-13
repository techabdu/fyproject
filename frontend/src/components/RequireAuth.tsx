"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageSpinner, Alert } from "./ui";
import type { Role } from "@/lib/types";

/**
 * Guards a page: while auth is loading, shows a spinner; if the user is not
 * authenticated, redirects to /login; if `roles` is provided and the user's
 * role is not allowed, shows a friendly "not authorised" notice (the backend
 * enforces security regardless).
 */
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
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert tone="warning">
          <p className="font-semibold">This section isn’t available for your role.</p>
          <p className="mt-1">
            You are signed in as <strong>{user.role_label}</strong>. Use the
            navigation to reach the tools available to you.
          </p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
