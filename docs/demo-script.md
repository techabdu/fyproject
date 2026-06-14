# Live Demo Script

A end-to-end walkthrough that exercises every module and all four roles. All
demo accounts use the password **`password`**. Start both servers (see the
README) and open http://localhost:3000.

> Tip: keep the seed pristine with `php artisan migrate:fresh --seed` before a
> formal demo.

---

## 1. Landing & authentication (Module 0)
1. Open the app → marketing landing page → **Sign in**.
2. On the login screen, use a **demo-account quick-fill** button (Student) →
   **Sign in**. You land on the role-aware **dashboard**.

## 2. Project Repository + moderation (Module 1)
*As the student `ahmad.dalhat@student.abu.edu.ng`:*
1. **Repository** → search `malaria` → the FULLTEXT match appears. Try the
   **year / department / topic** filters.
2. Open a project → read the abstract, see **Similar projects** (keyword
   overlap), click **Download PDF** (streamed from private storage).
3. **Upload Project** → fill the form, attach any PDF → submit. Note the
   **duplicate advisory** if keywords overlap. The project is now `pending`.

*As the CS dept admin `cs.admin@abu.edu.ng`:*
4. The **bell** shows a new "project awaiting review" notification.
5. **Moderation** → the queue shows the student's submission (scoped to CS).
   **Approve** it (or **Reject** with feedback).
6. Back as the student: the bell shows approved/rejected; a rejected project
   shows the moderator's **feedback**; an approved one is now searchable.

## 3. Supervisor Matching (Module 2)
*As the student:*
1. **Find Supervisors** → enter proposal keywords `computer vision, deep learning`.
2. Supervisors are **ranked by match %** — Dr. Aisha Bello tops at **67%**;
   matching interest tags are highlighted. See **live capacity** and filter to
   **available only**.
3. **Bookmark** a supervisor (♥) → it appears under **Bookmarks**.

## 4. Supervision Requests (Module 3)
*As the student:*
1. **My Requests** shows an existing **pending** request. Trying to submit
   another (**Request supervision** → send) is **blocked** ("one active request").
2. *(Optional)* Log in as `chioma.nwosu@student.abu.edu.ng` (free to request) and
   submit a new request to demonstrate the happy path.

*As the supervisor `yusuf.sani@abu.edu.ng`:*
3. The **bell** shows the incoming request. **Incoming Requests** → **Accept**
   (capacity ticks up, transactionally) or **Decline** (reason required).
4. The student's bell + dashboard reflect the outcome; a decline **frees** them
   to request again.

## 5. Role dashboards (Module 4)
Log in as each role and show its tailored dashboard:
- **Student** — upload stats, active request, my projects, saved supervisors.
- **Supervisor** — capacity bar, pending/accepted counts, **Accept** inline.
- **Dept Admin** — department stats, pending queue (**Approve** inline),
  supervisor roster with load bars.
- **Super Admin** — faculty totals + **per-department breakdown** table.

## 6. Notifications, user management & analytics (Module 5)
*As the super admin `superadmin@abu.edu.ng`:*
1. **Bell** → dropdown of notifications, **mark all read**, click one to jump
   to the resource.
2. **Users** → search/filter; **Add user** (e.g. a new dept admin); **edit** a
   user's role/department; note self-delete is blocked.
3. **Analytics** → projects by status/year, requests by status, the capacity
   dial, and top interest areas / topics.

## 7. Security & integrity (talking points)
- **RBAC** is server-side on every endpoint (try a student hitting
  `/moderation` → blocked). The UI only hides controls for convenience.
- **One-active-request** is enforced both in a transaction and by a DB-level
  unique generated column.
- **Capacity** updates are transactional and race-safe; over-filling is refused.
- PDFs are **never public** — they stream through an authenticated,
  permission-checked endpoint.

---

See `docs/api.md` for the endpoints behind each step and `docs/testing.md` for
the automated tests that back these behaviours.
