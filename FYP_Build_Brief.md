# Build Brief — FYP Repository & Supervisor Matching Platform

> **For:** Claude Code (planning + implementation)
> **From:** Ahmad Dalhat — Final Year Project, Dept. of Computer Science, Ahmadu Bello University, Zaria
> **Matric:** U22DLCS10604
> **Status:** Approved-scope build brief. This document supersedes the scope sections of the original proposal where they conflict (see §2).

---

## 0. How to use this document

You (Claude Code) are building a complete, demonstrable, multi-role web application as a single-developer final year project. This brief is the source of truth for **what** to build and **the constraints**; you own the detailed technical plan, file layout decisions within the stack, and implementation.

Before writing code: read this whole brief, then produce a **phased implementation plan** (see §11) and confirm it. Build in vertical slices that are demoable at each phase. Every feature must be backed by data that can be **seeded** so the system is presentable end-to-end without manual setup.

---

## 1. Project context & objective

Final-year students at ABU Zaria currently have no structured way to (a) explore past final year projects, or (b) find and formally request a project supervisor matched to their topic. Today this happens via physical library binders, word-of-mouth, and guesswork.

This platform digitises the project archive and formalises the supervision request workflow, with oversight at department and faculty level. It must demonstrate **end-to-end full-stack competency** for academic assessment, so code quality, a documented schema, documented API endpoints, and testability matter as much as the running features (these feed the written report and live demo — see §10).

---

## 2. Final scope decision (READ CAREFULLY)

The original proposal contains a contradiction: Sections 2–3 describe a full 4-role, 5-module system, while Section 5 narrows it to 2 roles and defers the rest. **The decision for this build is to construct the COMPLETE system** — all roles, all modules — i.e. follow Sections 2–3 of the proposal and pull in the items listed under "Future Updates."

### 2.1 In scope (build all of this)

- **Four roles:** Student, Supervisor, Department Admin, Super Admin (Faculty).
- **Module 1 — Project Repository** (upload, moderation queue, full-text search/filter, abstract preview, controlled PDF download).
- **Module 2 — Supervisor Matching** (interest-tag profiles, capacity, keyword-based match score, saved/bookmarked supervisors).
- **Module 3 — Supervision Request Workflow** (request submit, accept/decline with reason, status tracking, transactional capacity decrement, one-active-request constraint).
- **Module 4 — Role-Based Dashboards** (one tailored dashboard per role).
- **Module 5 — In-App Notification System** (event-driven, in-app only, read/unread).
- **Cross-cutting:** full authentication, role-based access control, department/faculty scoping, seed data.

### 2.2 Explicitly OUT of scope (do NOT build)

These are genuine exclusions — including them would change the nature of the project:

- Real-time chat or direct messaging between users.
- Native mobile app. **The web app must be fully responsive**, but it is web-only.
- Any payment or financial transaction feature.
- Integration with external university systems / student portals / SSO.
- AI/ML-based recommendations beyond the keyword-overlap match score defined in §7.2.

If a requirement seems to need one of the above, stop and flag it rather than building it.

---

## 3. Technology stack & architecture

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **Next.js (App Router)** + **Tailwind CSS** | React-based, SSR/file-based routing. Responsive (mobile→desktop). |
| Backend API | **Laravel (PHP), RESTful** | Eloquent ORM, migrations, validation, policies/gates for RBAC, PHPUnit for tests. |
| Database | **MySQL** | Relational; use `FULLTEXT` index for repository search (§7.1). |
| Auth | **Laravel Sanctum (cookie-based SPA auth)** | HTTP-only, CSRF-protected cookies carrying the session; role/permission resolved server-side. This satisfies the original "JWT in HTTP-only cookies" intent without hand-rolled tokens. If a token flow is preferred for any reason, Sanctum API tokens are the fallback — pick one and be consistent. |
| File storage | **Local server storage** | PDFs stored **outside** the public web root (Laravel `storage/`); never served by direct public URL — see §7.1 controlled access. |

### 3.1 Repository structure (monorepo)

One Git repo, two independently runnable apps:

```
fyp-platform/
  frontend/          # Next.js App Router app
  backend/           # Laravel API
  README.md          # run instructions for both
  docs/              # schema diagram, API reference, seed-data notes (deliverables)
```

### 3.2 Frontend ↔ backend integration

- Two dev servers: Next.js (e.g. :3000) and Laravel (`php artisan serve`, e.g. :8000).
- **Sanctum SPA auth requires same-site cookies.** Configure one of:
  1. Laravel `SANCTUM_STATEFUL_DOMAINS` + CORS to allow the Next.js origin with credentials, **or**
  2. A Next.js rewrite/proxy so the API is reached under the frontend origin (cleaner for cookies).
  Choose one in the plan and document it.
- All frontend API calls send credentials; CSRF token is fetched from Sanctum's `/sanctum/csrf-cookie` before state-changing requests.

---

## 4. Roles & permission matrix

Scoping rule: **Department Admin** acts only within their own department; **Super Admin** acts across all departments in the faculty.

| Capability | Student | Supervisor | Dept Admin | Super Admin |
|---|:--:|:--:|:--:|:--:|
| Browse/search approved repository | ✓ | ✓ | ✓ | ✓ |
| Upload a completed FYP | ✓ | — | — | — |
| Approve/reject project uploads | — | — | ✓ (own dept) | ✓ (all) |
| Maintain supervisor profile (interests, capacity) | — | ✓ | — | — |
| Search/filter supervisors + view match score | ✓ | — | — | — |
| Bookmark (save) supervisors | ✓ | — | — | — |
| Submit supervision request | ✓ | — | — | — |
| Accept/decline request (reason required on decline) | — | ✓ | — | — |
| Manage supervisor list within department | — | — | ✓ (own dept) | ✓ (all) |
| Manage user accounts | — | — | — | ✓ |
| View department-level statistics | — | — | ✓ (own dept) | ✓ (all) |
| View faculty-wide analytics | — | — | — | ✓ |
| Receive in-app notifications | ✓ | ✓ | ✓ | ✓ |

RBAC must be enforced **server-side on every endpoint** (Laravel policies/gates + middleware). The frontend hides controls for UX, but never relies on the UI for security.

---

## 5. Data model (entities & key relationships)

Design migrations from this. Names are indicative; refine as needed but keep relationships intact.

- **departments** — `id`, `name`, `faculty` (string/ref). A faculty has many departments.
- **users** — `id`, `name`, `email`, `password`, `role` (enum: student|supervisor|dept_admin|super_admin), `department_id` (nullable for super_admin). One role per user.
- **supervisor_profiles** — `id`, `user_id` (→ users), `bio`, `max_capacity` (int), `current_load` (int, derived/maintained). One-to-one with a supervisor user.
- **interest_tags** — `id`, `name` (normalised, unique). Many-to-many with supervisor_profiles via **supervisor_interest_tag**.
- **projects** — `id`, `title`, `abstract`, `department_id`, `graduation_year`, `uploaded_by` (→ users), `pdf_path`, `status` (enum: pending|approved|rejected), `rejection_feedback` (nullable), timestamps.
- **project_keywords** — `id`, `project_id`, `keyword` (normalised). Used for filtering + the duplicate/overlap indicator. (Repository free-text search uses a `FULLTEXT` index on `projects.title` + `projects.abstract`.)
- **supervision_requests** — `id`, `student_id` (→ users), `supervisor_id` (→ users), `proposed_title`, `proposal_summary`, `proposal_keywords` (for match scoring), `status` (enum: pending|accepted|declined), `decision_reason` (nullable; required when declined), timestamps. **Constraint:** at most one row per student with status in {pending, accepted}.
- **saved_supervisors** — `id`, `student_id`, `supervisor_id`. Bookmarks; unique pair.
- **notifications** — `id`, `user_id`, `type`, `payload` (json), `read_at` (nullable), `created_at`. (Laravel's built-in `notifications` table is acceptable.)

Provide an ER diagram in `docs/` as part of the deliverables.

---

## 6. Authentication & authorization

- Registration/login for all roles. Decide and document how privileged accounts are created (recommended: Super Admin and Dept Admins are seeded; Super Admin can create/assign other admins; students/supervisors self-register and are assigned a department).
- Sanctum cookie session as in §3. Passwords hashed (Laravel default bcrypt/argon).
- Every protected route guarded by middleware + policy. Department-scoped resources must verify the actor's `department_id` matches.
- Validation on every input (Laravel form requests). File upload validation: PDF mime type + size cap (e.g. ≤ 20 MB — confirm a sensible cap).

---

## 7. Feature module specifications

Each module below lists behaviour + acceptance criteria. Treat acceptance criteria as the definition of done.

### 7.1 Module 1 — Project Repository + Moderation

Students upload a completed FYP: title, abstract, department, graduation year, keywords, and a PDF. Submission enters a **moderation queue** for the relevant Department Admin (Super Admin may also moderate any department). On approval the project becomes searchable to all users; on rejection the uploader sees the **feedback reason**.

- Moderation states: `pending → approved` or `pending → rejected (with feedback)`.
- Search: free-text over title + abstract via MySQL `FULLTEXT`; filters by keyword, graduation year, department, topic area.
- Abstract is previewable to authenticated users; **PDF download is controlled** — served through an authenticated Laravel endpoint that checks permission and streams from `storage/`, never a public file URL.
- **Duplicate/plagiarism-awareness indicator:** when viewing/uploading, surface projects with high keyword overlap (compute overlap against `project_keywords`; show as an advisory indicator, not a hard block).

**Acceptance:** a student can upload → it appears in the correct dept admin's queue → admin approves → it becomes searchable and its PDF downloadable by permitted users; admin rejects with feedback → uploader sees status + reason and the project stays private.

### 7.2 Module 2 — Supervisor Matching

Each supervisor maintains a profile: interest tags, current load, max capacity. Students browse/filter supervisors by interest and see a **match score** against their proposed topic.

**Match score algorithm (keep it simple and explainable for the report):**
1. Normalise both sides: lowercase, trim, de-duplicate. Student side = keywords from their proposal/topic; supervisor side = their interest tags.
2. Compute overlap = set intersection of the two tag sets.
3. Score = a normalised ratio, e.g. **Jaccard** `|intersection| / |union|` (0–1), surfaced as a percentage; also show the raw count of matching tags.
4. Rank supervisors by score descending; allow filtering to those with available capacity (`current_load < max_capacity`).

Do **not** introduce ML/embeddings — keyword overlap only (per §2.2).

- Real-time capacity indicator (available slots = max − current).
- Students can bookmark supervisors (`saved_supervisors`).

**Acceptance:** given a student proposal, the supervisor list is ranked by a correctly computed match score, shows live capacity, supports filtering, and bookmarking persists.

### 7.3 Module 3 — Supervision Request Workflow

A student submits a formal request to a chosen supervisor: proposed title + proposal summary (+ keywords used for matching). Supervisor accepts or declines, with a reason **required on decline** (optional/allowed on accept).

- **State machine:** `pending → accepted` or `pending → declined`.
- **Integrity rule:** a student may hold **only one** request with status in {pending, accepted} at a time. Enforce in a DB transaction at submission.
- On **accept**: increment supervisor `current_load` **transactionally**, and reject the action if it would exceed `max_capacity` (guard against race conditions).
- Student dashboard tracks status (pending/accepted/declined) with the supervisor's reason.

**Acceptance:** a student with no active request can submit one; a second concurrent submission is blocked; supervisor accept decrements available capacity atomically and cannot over-fill; decline requires a reason and frees the student to request again.

### 7.4 Module 4 — Role-based dashboards

- **Student:** request status, saved supervisors, their uploaded projects (+ approval status).
- **Supervisor:** incoming requests, accepted students, capacity progress indicator.
- **Dept Admin:** pending project approvals (own dept), department supervisor roster, department usage statistics.
- **Super Admin:** faculty-wide view across all departments, user account management, aggregate analytics.

**Acceptance:** each role lands on its own dashboard showing only permitted data, with working action items (e.g. admin can approve from the dashboard).

### 7.5 Module 5 — In-app notifications

In-app only (no email/push). Bell with unread count + list; mark read.

Trigger events:
- Supervisor: new supervision request received.
- Student: request accepted/declined; uploaded project's approval status changed.
- Dept Admin: new project submission awaiting review.

**Acceptance:** each event creates a notification for the right user(s); unread count updates; opening marks read.

---

## 8. API surface (high level)

RESTful, JSON, versioned under `/api`. Indicative groupings (you finalise exact routes + document them in `docs/`):

- **Auth:** register, login, logout, current-user, csrf-cookie.
- **Projects:** list/search (filters), show, upload, download (controlled), moderation list, approve, reject.
- **Supervisors:** list/search (with match score for a given proposal), show profile, update own profile, capacity; saved-supervisors add/remove/list.
- **Requests:** create, list (role-scoped), accept, decline.
- **Admin:** department supervisor roster, department stats; (super admin) user management, faculty analytics.
- **Notifications:** list, unread-count, mark-read.

Every route documents: method, path, auth/role required, request body, response shape.

---

## 9. Non-functional requirements

- **Security:** server-side RBAC on every endpoint; input validation everywhere; parameterised queries via Eloquent (no raw string SQL); HTTP-only cookies + CSRF; PDF served only through authenticated, permission-checked endpoint; file-type/size validation on upload.
- **Data integrity:** the one-active-request constraint and capacity decrement must be transaction-safe and race-safe.
- **Seed data:** realistic demo data so the whole system is demoable without manual setup — multiple departments, a super admin, dept admins, supervisors (with interests + varied capacity), students, approved + pending projects with keywords, and at least one request in each state.
- **Responsiveness:** usable from mobile width up to desktop.
- **Testing:** PHPUnit feature/unit tests for the critical logic (auth/RBAC, moderation transitions, request state machine + integrity rule, match-score computation). These tests double as evidence for the report's testing chapter.

---

## 10. Deliverables (assessment targets)

The build must produce / support:

1. A working multi-role web platform, browser-accessible, seeded with realistic demo data.
2. A relational MySQL schema with documented tables + relationships (migrations + an ER diagram in `docs/`).
3. A RESTful Laravel API with documented endpoints (`docs/api.md`).
4. Material that supports the written report's chapters: **system analysis, design, implementation, testing, evaluation** (the schema, API docs, and tests feed these directly).
5. A live demonstration covering every feature end-to-end.

---

## 11. Suggested phased plan (vertical slices)

Confirm/adjust this before building. Each phase ends demoable.

- **Phase 0 — Foundation:** monorepo scaffold; Laravel + Sanctum auth + Next.js login/register; roles + RBAC middleware/policies; departments + users migrations + seed (super admin, dept admins).
- **Phase 1 — Repository + moderation:** project upload (PDF to `storage/`), moderation queue, approve/reject-with-feedback, controlled download, FULLTEXT search + filters.
- **Phase 2 — Supervisor profiles + matching:** interest tags, capacity, profile management, match-score ranking, filtering, bookmarks.
- **Phase 3 — Request workflow:** submit, one-active-request constraint, accept/decline with reason, transactional capacity decrement.
- **Phase 4 — Dashboards:** the four role dashboards wired to real data + actions.
- **Phase 5 — Notifications + admin/analytics:** notification events + bell; department stats; super-admin user management + faculty analytics.
- **Phase 6 — Hardening + deliverables:** seed completeness, PHPUnit tests for critical logic, `docs/` (ER diagram, API reference, run instructions), responsive polish.

---

## 12. Open items to confirm in your plan

1. Auth approach: **Sanctum SPA cookie** (recommended) vs Sanctum API tokens — pick one, justify briefly.
2. Frontend↔API integration: CORS+stateful-domains vs Next.js proxy (§3.2).
3. Privileged-account provisioning: which admins are seeded vs created in-app (§6).
4. PDF size cap and accepted file types (§6).
5. "Topic area" filter — is it a fixed taxonomy or derived from keywords? (Recommend: derive from keywords / a small seeded category list.)

Raise any other ambiguity before implementing rather than guessing.
