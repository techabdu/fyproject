// API client for the Laravel Sanctum SPA backend.
//
// Sanctum SPA cookie auth flow:
//  1. Before any state-changing request, hit GET /sanctum/csrf-cookie to set
//     the XSRF-TOKEN cookie (JS-readable, domain localhost).
//  2. Read XSRF-TOKEN from document.cookie, decode it, send as X-XSRF-TOKEN.
//  3. Every request uses credentials:'include' + Accept: application/json.
//  4. JSON bodies set Content-Type: application/json; file uploads use
//     FormData and must NOT set Content-Type (browser sets the boundary).

const API = process.env.NEXT_PUBLIC_API_URL!;

/** Error thrown for non-2xx responses. Carries the parsed body so forms can
 *  surface Laravel validation errors ({ message, errors: { field: [...] } }). */
export class ApiError extends Error {
  status: number;
  data: any;
  errors?: Record<string, string[]>;

  constructor(status: number, data: any) {
    super((data && data.message) || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.errors = data && data.errors ? data.errors : undefined;
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[2]) : null;
}

async function csrf(): Promise<void> {
  await fetch(`${API}/sanctum/csrf-cookie`, { credentials: "include" });
}

async function handle(r: Response): Promise<any> {
  // 204 No Content (e.g. DELETE) — nothing to parse.
  if (r.status === 204) return null;

  const ct = r.headers.get("content-type") || "";
  let body: any = null;
  if (ct.includes("application/json")) {
    body = await r.json().catch(() => null);
  } else {
    body = await r.text().catch(() => null);
  }

  if (!r.ok) throw new ApiError(r.status, body);
  return body;
}

export async function apiGet(path: string): Promise<any> {
  const r = await fetch(`${API}/api${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return handle(r);
}

export async function apiSend(
  method: string,
  path: string,
  body?: any,
  isForm = false
): Promise<any> {
  await csrf();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") ?? "",
  };

  let payload: any = undefined;
  if (isForm) {
    // FormData — let the browser set the multipart boundary.
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const r = await fetch(`${API}/api${path}`, {
    method,
    credentials: "include",
    headers,
    body: payload,
  });
  return handle(r);
}

export const apiPost = (path: string, body?: any, isForm = false) =>
  apiSend("POST", path, body, isForm);
export const apiPut = (path: string, body?: any) => apiSend("PUT", path, body);
export const apiPatch = (path: string, body?: any) =>
  apiSend("PATCH", path, body);
export const apiDelete = (path: string, body?: any) =>
  apiSend("DELETE", path, body);

/** Download a protected PDF via fetch + blob so the session cookie is sent
 *  reliably, then trigger a browser download. */
export async function downloadProjectPdf(
  projectId: number,
  filename?: string
): Promise<void> {
  const r = await fetch(`${API}/api/projects/${projectId}/download`, {
    credentials: "include",
    headers: { Accept: "application/pdf" },
  });
  if (!r.ok) {
    // Try to surface a useful message.
    const data = await r.json().catch(() => null);
    throw new ApiError(r.status, data);
  }
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `project-${projectId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke shortly after to let the download start.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export { API };
