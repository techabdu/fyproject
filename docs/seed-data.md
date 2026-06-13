# Seed Data & Demo Accounts

`php artisan migrate:fresh --seed` builds a complete, demoable dataset. Every
seeded account uses the password **`password`**.

## Accounts

| Role | Name | Email | Department |
|---|---|---|---|
| Super Admin | Prof. Ibrahim Adekunle (Dean) | `superadmin@abu.edu.ng` | — (faculty-wide) |
| Dept Admin | CS Department Admin | `cs.admin@abu.edu.ng` | Computer Science |
| Dept Admin | Maths Department Admin | `maths.admin@abu.edu.ng` | Mathematics |
| Dept Admin | Stats Department Admin | `stats.admin@abu.edu.ng` | Statistics |
| Dept Admin | Physics Department Admin | `physics.admin@abu.edu.ng` | Physics |
| Supervisor | Dr. Aisha Bello | `aisha.bello@abu.edu.ng` | Computer Science |
| Supervisor | Dr. Musa Ibrahim | `musa.ibrahim@abu.edu.ng` | Computer Science |
| Supervisor | Dr. Grace Okoro | `grace.okoro@abu.edu.ng` | Computer Science |
| Supervisor | Dr. Yusuf Sani | `yusuf.sani@abu.edu.ng` | Computer Science |
| Supervisor | Dr. Hauwa Lawal | `hauwa.lawal@abu.edu.ng` | Mathematics |
| Supervisor | Dr. John Eze | `john.eze@abu.edu.ng` | Mathematics |
| Supervisor | Dr. Fatima Garba | `fatima.garba@abu.edu.ng` | Statistics |
| Supervisor | Dr. Sadiq Umar | `sadiq.umar@abu.edu.ng` | Physics |
| Student | Ahmad Dalhat | `ahmad.dalhat@student.abu.edu.ng` | Computer Science |
| Student | Bilal Yakubu | `bilal.yakubu@student.abu.edu.ng` | Computer Science |
| Student | Chioma Nwosu | `chioma.nwosu@student.abu.edu.ng` | Computer Science |
| Student | Daniel Achi | `daniel.achi@student.abu.edu.ng` | Computer Science |
| Student | Esther Bawa | `esther.bawa@student.abu.edu.ng` | Computer Science |
| Student | + Halima, Tunde, Ngozi | `*.student@abu.edu.ng` | Maths / Stats / Physics |

## What's seeded

- **4 departments** (Faculty of Physical Sciences): Computer Science,
  Mathematics, Statistics, Physics.
- **8 supervisors** with bios, interest tags and varied `max_capacity` (2–5).
- **10 projects** with keywords and real (streamable) demo PDFs:
  - 6 **approved** (searchable), spanning 2022–2024.
  - 3 **pending** (in moderation queues — e.g. CS admin sees 2).
  - 1 **rejected** with feedback.
- **Supervision requests — one in each state:**
  - *Accepted* — Bilal → Dr. Aisha Bello (consumes one of her capacity slots).
  - *Pending* — Ahmad → Dr. Yusuf Sani.
  - *Declined* — Chioma → Dr. Musa Ibrahim (with a reason; Chioma is free again).
- **Bookmarks** for several students.

## Quick demo paths

- **Repository + moderation:** log in as `ahmad.dalhat@student.abu.edu.ng`, upload
  a PDF → log in as `cs.admin@abu.edu.ng`, approve/reject from the moderation
  queue → the approved project becomes searchable and downloadable.
- **Matching:** as a student, open *Find Supervisors*, enter proposal keywords
  like `computer vision, deep learning` → Dr. Aisha Bello ranks top (~67% match).
- **Requests:** as `ahmad.dalhat@…` you already have a pending request — try to
  submit another (blocked). Log in as `yusuf.sani@abu.edu.ng` to accept/decline.
