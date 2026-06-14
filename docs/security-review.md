# Security Review

A security-focused review of the full implementation (Laravel API trust
boundary + Next.js client). Methodology: file-by-file trace of request input →
validation → query/file operation across every controller, policy, middleware,
form request, model and raw-SQL site.

**Result: no high-confidence exploitable vulnerabilities found.** The summary
below documents the controls that close each common attack class — useful
evidence for the report's security/evaluation chapters.

## Verified controls

| Attack class | Status | Where / why |
|---|---|---|
| **SQL injection** | Safe | All raw SQL is parameterised or constant. FULLTEXT search binds `q` via `?` placeholders (`ProjectController::index`); analytics `DB::raw` uses only `COUNT/SUM`; `year`/`department_id` cast to `int`. Everything else is Eloquent. |
| **Path traversal (file upload/download)** | Safe | Upload path is server-generated (`Str::uuid().'.pdf'`) on the private `local` disk (`storage/app/private`, outside web root). Download derives the path from the DB record, never request input, and is gated by the `download` policy. |
| **Broken access control / IDOR** | Safe | RBAC enforced server-side on every route via the `role` middleware **and** model policies. Admin user CRUD is double-gated (`role:super_admin` + `authorize()`). Request accept/decline require `user->id === supervisor_id`; project view/moderate scoped to owner/department. `canActOnDepartment` returns false for foreign/null departments. |
| **Privilege escalation (mass assignment)** | Safe | Self-registration hard-restricts `role` to `student\|supervisor` (`RegisterRequest`). Role/department changes occur only through super-admin-gated controllers. `department_id` always validated `exists:departments,id`. |
| **Auth / session** | Safe | Sanctum SPA cookie auth; session regenerated on login/register (fixation protection), invalidated on logout. CSRF enforced. CORS uses an explicit origin allow-list with credentials (no wildcard). |
| **Sensitive data exposure** | Safe | `password`/`remember_token` hidden on `User`; `pdf_path` hidden on `Project`. No resource serialises a hash or on-disk path. Notifications are queried through the owning user (`user->notifications()->findOrFail`). |
| **Insecure deserialization / RCE** | Safe | No `unserialize`/`eval`/dynamic instantiation from input; no `dangerouslySetInnerHTML` in the client. |

## Defense-in-depth already applied

- Input validation on every write via Form Requests.
- File-upload validation: PDF mime + ≤ 20 MB.
- One-active-request and capacity invariants enforced transactionally **and** at
  the database level.
- Auth endpoints rate-limited (`throttle:10,1`).

## Notes (non-issues)

- Supervisor **email** is returned to authenticated users by design (it's a
  supervision-matching directory). Restrict the field if institutional policy
  requires it.
- Demo seed credentials (`password`) and the local dev `.env` are intentional
  for the demo; production deployments must set real secrets and `APP_DEBUG=false`.
