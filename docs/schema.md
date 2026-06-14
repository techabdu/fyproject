# Database Schema & ER Diagram

Relational schema (MySQL/MariaDB) for the FYP Repository & Supervisor Matching
platform. All tables are created via Laravel migrations in
`backend/database/migrations`.

## Entity–Relationship Diagram

```mermaid
erDiagram
    departments ||--o{ users : "has"
    departments ||--o{ projects : "scopes"
    users ||--o| supervisor_profiles : "has (supervisor)"
    users ||--o{ projects : "uploads"
    users ||--o{ supervision_requests : "sends (student)"
    users ||--o{ supervision_requests : "receives (supervisor)"
    users ||--o{ saved_supervisors : "bookmarks"
    users ||--o{ notifications : "receives"
    supervisor_profiles ||--o{ supervisor_interest_tag : ""
    interest_tags ||--o{ supervisor_interest_tag : ""
    projects ||--o{ project_keywords : "has"

    departments {
        bigint id PK
        string name
        string faculty
    }
    users {
        bigint id PK
        string name
        string email UK
        string password
        enum role "student|supervisor|dept_admin|super_admin"
        bigint department_id FK "nullable (null for super_admin)"
    }
    supervisor_profiles {
        bigint id PK
        bigint user_id FK,UK
        text bio
        int max_capacity
        int current_load "derived/maintained"
    }
    interest_tags {
        bigint id PK
        string name UK "normalised"
    }
    supervisor_interest_tag {
        bigint id PK
        bigint supervisor_profile_id FK
        bigint interest_tag_id FK
    }
    projects {
        bigint id PK
        string title "FULLTEXT(title,abstract)"
        text abstract
        bigint department_id FK
        year graduation_year
        bigint uploaded_by FK
        string pdf_path "private storage path"
        enum status "pending|approved|rejected"
        text rejection_feedback "nullable"
    }
    project_keywords {
        bigint id PK
        bigint project_id FK
        string keyword "normalised"
    }
    supervision_requests {
        bigint id PK
        bigint student_id FK
        bigint supervisor_id FK
        string proposed_title
        text proposal_summary
        text proposal_keywords "for match scoring"
        enum status "pending|accepted|declined"
        text decision_reason "required on decline"
        bigint active_lock "generated: student_id while active, else NULL (UNIQUE)"
    }
    saved_supervisors {
        bigint id PK
        bigint student_id FK
        bigint supervisor_id FK
    }
    notifications {
        uuid id PK
        string type
        string notifiable_type
        bigint notifiable_id
        text data "json: type, message, payload"
        timestamp read_at "nullable"
    }
```

## Tables

| Table | Purpose | Key columns / constraints |
|---|---|---|
| `departments` | Departments grouped under a faculty | unique `(name, faculty)` |
| `users` | All accounts; one role each | `role` enum, `department_id` FK (nullable for super admin), `email` unique |
| `supervisor_profiles` | One-to-one extension of a supervisor user | `user_id` unique FK, `max_capacity`, `current_load` |
| `interest_tags` | Normalised research-interest tags | `name` unique |
| `supervisor_interest_tag` | M:N supervisors ↔ interest tags | unique `(supervisor_profile_id, interest_tag_id)` |
| `projects` | Uploaded FYPs + moderation state | `status` enum, `pdf_path` (private), **FULLTEXT** `(title, abstract)` |
| `project_keywords` | Normalised keywords per project | unique `(project_id, keyword)`; drives filters + duplicate indicator |
| `supervision_requests` | Supervision request workflow | `status` enum; **`active_lock`** generated column + unique index enforces one active (pending/accepted) request per student |
| `saved_supervisors` | Student bookmarks | unique `(student_id, supervisor_id)` |
| `notifications` | In-app notifications (Laravel database channel) | polymorphic `notifiable`, JSON `data` (`type`, `message`, `payload`), `read_at` |

## Notable integrity mechanisms

- **One active request per student** — a `STORED` generated column
  `active_lock = CASE WHEN status IN ('pending','accepted') THEN student_id ELSE NULL END`
  carries a `UNIQUE` index. MySQL allows many `NULL`s but only one non-null per
  student, so a student can hold at most one active request — race-safe even
  under concurrent submissions. Application code also checks this inside a
  transaction for a friendly error message.
- **Transactional capacity** — accepting a request increments
  `supervisor_profiles.current_load` under a row lock (`SELECT ... FOR UPDATE`)
  and refuses if it would exceed `max_capacity`.
- **Full-text search** — `MATCH(title, abstract) AGAINST (... IN NATURAL LANGUAGE MODE)`
  backs the repository free-text search.
