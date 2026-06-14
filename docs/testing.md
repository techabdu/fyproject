# Testing

Automated tests for the critical logic, doubling as evidence for the report's
testing chapter. They run against a dedicated MySQL database (`fyp_test`) so the
real `FULLTEXT` index and the generated-column integrity lock are exercised.

```bash
cd backend
php artisan test                 # whole suite
php artisan test --filter=SupervisionRequestTest
```

**Current status: 45 passing (118 assertions).**

## Coverage map (brief §9 targets)

| Area | Test file | Key scenarios |
|---|---|---|
| **Match-score algorithm** | `Unit/MatchScoreServiceTest` | tokenise/normalise + de-dup; Jaccard for partial/identical/disjoint sets; the 67% seeded case; empty-set guard (no division by zero); overlap ratio |
| **Auth & registration** | `Feature/AuthTest` | student & supervisor self-registration (supervisor gets a profile); admin self-registration blocked; bad-credential rejection; `/me` requires auth |
| **RBAC & moderation** | `Feature/ModerationTest` | student upload → `pending`; supervisor cannot upload (403); dept-admin approve → searchable; reject requires feedback; **admin cannot moderate another department**; student cannot view the queue |
| **Request state machine + integrity** | `Feature/SupervisionRequestTest` | submit; **one-active-request blocked** at app level *and* by the DB unique lock; accept increments `current_load`; accept blocked when full; decline requires a reason and frees the student; only the receiving supervisor may decide |
| **Dashboards** | `Feature/DashboardTest` | guest 401; per-role payload shape; supervisor capacity %; **dept-admin scoped to own department**; super-admin faculty breakdown |
| **Notifications** | `Feature/NotificationTest` | each event notifies the right user (request→supervisor, accept→student, upload→dept admin); unread-count + mark-read; per-user isolation |
| **User management & analytics** | `Feature/AdminUserTest` | super-admin lists/creates/reassigns users; non-super-admin forbidden (403); cannot delete self; analytics RBAC + aggregate shape |

## Notes

- Feature tests authenticate with `Sanctum::actingAs(...)`; CSRF is bypassed
  automatically under test, while the real SPA cookie flow is exercised
  separately by the Node integration harness (see below).
- The `fyp_test` database is migrated fresh per run via `RefreshDatabase`.

## Manual / integration verification

Beyond PHPUnit, the frontend↔API contract (CSRF cookie → credentialed
cross-origin requests → session auth) was verified end-to-end with a Node
harness that replays the client's exact request flow against the live API:
auth, FULLTEXT search, match-score ranking, bookmarking, the one-active-request
422, notifications, RBAC, user management and analytics.
