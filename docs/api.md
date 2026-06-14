# API Reference

RESTful JSON API. Base URL (dev): `http://localhost:8000`. All endpoints are
under `/api` except the Sanctum CSRF cookie route. Authentication is **Sanctum
SPA cookie** auth; RBAC is enforced server-side on every route via the `role`
middleware and model policies.

## Authentication flow (SPA)

1. `GET /sanctum/csrf-cookie` (with credentials) → sets the `XSRF-TOKEN` cookie.
2. Send the (URL-decoded) `XSRF-TOKEN` value as the `X-XSRF-TOKEN` header on every
   state-changing request (POST/PUT/PATCH/DELETE).
3. Always send `credentials: 'include'` and `Accept: application/json`.

Common status codes: `200` OK · `201` Created · `401` Unauthenticated ·
`403` Forbidden (role/policy) · `404` Not found · `422` Validation/business-rule
error (`{ "message": ..., "errors": { field: [..] } }`).

Roles: `student`, `supervisor`, `dept_admin`, `super_admin`.

---

## Auth & meta

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/register` | public | `name, email, password, password_confirmation, role(student\|supervisor), department_id` | `201 {data: user}` |
| POST | `/api/login` | public | `email, password` | `200 {data: user}` |
| POST | `/api/logout` | any | – | `200 {message}` |
| GET | `/api/me` | any | – | `200 {data: user}` |
| GET | `/api/departments` | public | – | `{data: [department]}` |
| GET | `/api/interest-tags` | any | – | `{data: [string]}` |
| GET | `/api/topics` | any | – | `{data: [string]}` |

**user** = `{id, name, email, role, role_label, department_id, department, supervisor_profile, created_at}`

---

## Module 1 — Projects / Repository

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/projects` | any | Approved only. Query: `q` (FULLTEXT), `keyword`, `topic`, `year`, `department_id`. Paginated. |
| GET | `/api/projects/{id}` | any (policy) | Returns `{data: project, similar_projects: [...]}`. Non-approved visible only to owner/admin. |
| POST | `/api/projects` | **student** | Multipart: `title, abstract, department_id, graduation_year, keywords[], pdf` (PDF ≤ 20 MB). Enters `pending`. Returns `{data: project, duplicate_advisory: [...]}`. |
| GET | `/api/projects/{id}/download` | any (policy) | Streams the PDF from private storage (permission-checked). |
| GET | `/api/moderation/projects` | **dept_admin / super_admin** | Pending queue, scoped to the admin's department (super admin: all). |
| PATCH | `/api/projects/{id}/approve` | **dept_admin / super_admin** | Dept-scoped. → `approved`. |
| PATCH | `/api/projects/{id}/reject` | **dept_admin / super_admin** | Body `rejection_feedback` (required). → `rejected`. |

**project** = `{id, title, abstract, department_id, department, graduation_year, status, rejection_feedback, uploaded_by, uploader, keywords[], created_at, download_url}`

---

## Module 2 — Supervisors / Matching

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/supervisors` | any | Query: `proposal_keywords[]` (drives match score + ranking), `interest`, `department_id`, `available`. |
| GET | `/api/supervisors/{id}` | any | Optional `proposal_keywords[]` for the match score. |
| PUT | `/api/supervisor/profile` | **supervisor** | Body `bio, max_capacity, interest_tags[]`. Maintains own profile. |
| GET | `/api/saved-supervisors` | **student** | The student's bookmarks. |
| POST | `/api/supervisors/{id}/save` | **student** | Bookmark a supervisor. `201`. |
| DELETE | `/api/supervisors/{id}/save` | **student** | Remove bookmark. |

**supervisor** = `{id, name, email, department, bio, max_capacity, current_load, available_slots, has_capacity, interest_tags[], match, is_saved}`
**match** = `{score (0–1), percentage, matching_tags[], matching_count}` (Jaccard) or `null`.

---

## Module 3 — Supervision Requests

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/requests` | student / supervisor | Role-scoped: students see sent, supervisors see received. |
| POST | `/api/requests` | **student** | Body `supervisor_id, proposed_title, proposal_summary, proposal_keywords[]`. `422` if the student already has an active request. |
| PATCH | `/api/requests/{id}/accept` | **supervisor** (owner) | Optional `decision_reason`. Increments capacity transactionally; `422` if full. |
| PATCH | `/api/requests/{id}/decline` | **supervisor** (owner) | `decision_reason` required. Frees the student to request again. |

**request** = `{id, status, proposed_title, proposal_summary, proposal_keywords, decision_reason, student_id, supervisor_id, student, supervisor, created_at, updated_at}`

---

## Module 4 — Dashboards

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/dashboard` | any | Returns a payload tailored to the caller's role (student / supervisor / dept_admin / super_admin), containing only data that role may see. |

---

## Module 5 — Notifications, user management & analytics

**Notifications (all roles):**

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications` | any | Recent notifications + `unread_count`. |
| GET | `/api/notifications/unread-count` | any | `{count}`. |
| POST | `/api/notifications/{id}/read` | any | Mark one read. |
| POST | `/api/notifications/read-all` | any | Mark all read. |

**notification** = `{id, type, message, payload, read_at, created_at}` · types: `project_submitted`, `project_approved`, `project_rejected`, `request_received`, `request_accepted`, `request_declined`.

**Super-admin user management & analytics:**

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admin/users` | **super_admin** | List/paginate users. Query: `role`, `department_id`, `q`. |
| POST | `/api/admin/users` | **super_admin** | Create a user (any role; supervisors get a profile). |
| PATCH | `/api/admin/users/{id}` | **super_admin** | Update name/email/role/department (+ optional password). |
| DELETE | `/api/admin/users/{id}` | **super_admin** | Delete (cannot delete self or the last super admin). |
| GET | `/api/admin/analytics` | **super_admin** | Faculty aggregates: projects by status/year, requests by status, capacity utilisation, top interest areas + topics. |

---

## Match score algorithm (Module 2)

Jaccard similarity over normalised tag sets (lowercased, trimmed, de-duplicated):

```
score = |student_keywords ∩ supervisor_tags| / |student_keywords ∪ supervisor_tags|
```

Surfaced as a percentage with the raw count of matching tags. Supervisors are
ranked by score descending; the `available` filter keeps only those with
`current_load < max_capacity`. No ML/embeddings (per brief §2.2).
