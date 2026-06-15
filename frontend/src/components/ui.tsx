"use client";

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { Loader2, X as XIcon } from "lucide-react";

/* ---------------------------------------------------------------- cx ---- */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------- Spinner -- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("animate-spin", className)} aria-hidden />;
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <Spinner className="h-7 w-7" />
      <p className="mt-3 text-sm animate-pulse">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------- Button -- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  const variants = {
    primary:
      "bg-[var(--color-accent)] text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-blue-500",
  };
  return (
    <button
      className={cx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- Badge -- */
type BadgeTone =
  | "gray"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "indigo"
  | "purple";

const badgeTones: Record<BadgeTone, string> = {
  gray: "bg-slate-50 text-slate-600 border-slate-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-sky-50 text-sky-700 border-sky-200",
  indigo: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeTone> = {
    approved: "green",
    accepted: "green",
    pending: "yellow",
    rejected: "red",
    declined: "red",
  };
  return <Badge tone={map[status] ?? "gray"}>{status}</Badge>;
}

/* ---------------------------------------------------------------- Card -- */
export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        hover && "transition-all duration-150 hover:shadow-md hover:border-slate-300",
        className
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- Field -- */
export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

const fieldBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors duration-150 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cx(fieldBase, className)} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cx(fieldBase, className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select className={cx(fieldBase, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

/* ------------------------------------------------------------- Alerts --- */
export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "error" | "success" | "warning";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-sky-50 text-sky-800 border-sky-200 border-l-sky-500",
    error: "bg-red-50 text-red-800 border-red-200 border-l-red-500",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 border-l-emerald-500",
    warning: "bg-amber-50 text-amber-800 border-amber-200 border-l-amber-500",
  };
  return (
    <div
      className={cx(
        "rounded-lg border border-l-4 px-4 py-3 text-sm",
        tones[tone],
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- Empty ---- */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------- StatCard --- */
export function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: BadgeTone;
}) {
  const iconBg: Record<BadgeTone, string> = {
    gray: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-amber-100 text-amber-600",
    blue: "bg-sky-100 text-sky-600",
    indigo: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && (
          <span
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              iconBg[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

/* --------------------------------------------------------- ProgressBar -- */
export function ProgressBar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tone =
    pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cx("h-full rounded-full transition-all duration-300", tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- Modal ---- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className={cx(
        "relative z-10 w-full rounded-xl bg-white p-6 shadow-xl animate-scale",
        wide ? "max-w-2xl" : "max-w-lg"
      )}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Avatar --- */
const avatarColors: Record<string, string> = {
  student: "bg-sky-100 text-sky-700",
  supervisor: "bg-purple-100 text-purple-700",
  dept_admin: "bg-blue-100 text-blue-700",
  super_admin: "bg-emerald-100 text-emerald-700",
};

export function Avatar({
  name,
  role,
  size = "md",
  className,
}: {
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };
  const colorClass = (role && avatarColors[role]) || "bg-slate-100 text-slate-600";
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        colorClass,
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ----------------------------------------------------------- Divider ---- */
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-slate-200" />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
