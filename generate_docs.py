#!/usr/bin/env python3
"""Generate FYP Documentation Word Document (.docx) for the
FYP Repository & Supervisor Matching Platform."""

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
import os

doc = Document()

# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5

for level in range(1, 5):
    h = doc.styles[f'Heading {level}']
    h.font.name = 'Times New Roman'
    h.font.color.rgb = RGBColor(0, 0, 0)
    if level == 1:
        h.font.size = Pt(16)
    elif level == 2:
        h.font.size = Pt(14)
    elif level == 3:
        h.font.size = Pt(13)
    else:
        h.font.size = Pt(12)


def add_table(headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for p in cell.paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(10)
                r.font.name = 'Times New Roman'
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = table.rows[ri + 1].cells[ci]
            cell.text = str(val)
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(10)
                    r.font.name = 'Times New Roman'
    doc.add_paragraph()
    return table


def bullet(text, level=0):
    p = doc.add_paragraph(text, style='List Bullet')
    p.paragraph_format.left_indent = Cm(1.27 * (level + 1))
    return p


# =========================================================================
# TITLE PAGE
# =========================================================================
for _ in range(6):
    doc.add_paragraph()

tp = doc.add_paragraph()
tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = tp.add_run('FYP Repository & Supervisor Matching Platform')
run.bold = True
run.font.size = Pt(22)
run.font.name = 'Times New Roman'

doc.add_paragraph()

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub.add_run('Technical Documentation & System Report')
run.font.size = Pt(16)
run.font.name = 'Times New Roman'

doc.add_paragraph()
doc.add_paragraph()

details = [
    ('Student:', 'Ahmad Dalhat'),
    ('Matric No:', 'U22DLCS10604'),
    ('Department:', 'Computer Science'),
    ('Faculty:', 'Faculty of Physical Sciences'),
    ('University:', 'Ahmadu Bello University, Zaria'),
    ('Session:', '2024/2025'),
]
for label, value in details:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p.add_run(f'{label} ')
    r1.bold = True
    r1.font.size = Pt(13)
    r1.font.name = 'Times New Roman'
    r2 = p.add_run(value)
    r2.font.size = Pt(13)
    r2.font.name = 'Times New Roman'

doc.add_page_break()

# =========================================================================
# TABLE OF CONTENTS placeholder
# =========================================================================
doc.add_heading('Table of Contents', level=1)
doc.add_paragraph(
    '[Generate Table of Contents in Microsoft Word: '
    'References > Table of Contents > Automatic Table]'
)
doc.add_page_break()

# =========================================================================
# CHAPTER 1: INTRODUCTION
# =========================================================================
doc.add_heading('Chapter 1: Introduction', level=1)

doc.add_heading('1.1 Background of the Study', level=2)
doc.add_paragraph(
    'Final-year students at Ahmadu Bello University (ABU), Zaria, currently '
    'have no structured digital mechanism to explore past final year projects '
    'or to find and formally request a project supervisor matched to their '
    'research topic. The existing process relies on physical library binders, '
    'word-of-mouth recommendations, and guesswork, leading to inefficiencies, '
    'mismatched supervision, and limited access to institutional knowledge.'
)
doc.add_paragraph(
    'This project addresses these challenges by developing a web-based platform '
    'that digitises the FYP project archive and formalises the supervision '
    'request workflow, with oversight at both department and faculty levels. '
    'The platform serves four distinct user roles (Student, Supervisor, '
    'Department Admin, and Super Admin) with tailored interfaces and '
    'permissions.'
)

doc.add_heading('1.2 Problem Statement', level=2)
doc.add_paragraph(
    'The Department of Computer Science at ABU Zaria lacks a centralised '
    'digital repository for past final year projects and has no formal system '
    'for matching students with suitable project supervisors. Students must '
    'physically visit the library to browse previous work, and supervisor '
    'selection is largely informal. This leads to:'
)
bullet('Difficulty discovering relevant prior work and avoiding topic duplication')
bullet('Inefficient and opaque supervisor allocation')
bullet('No structured mechanism to track supervision capacity or request status')
bullet('Limited administrative oversight of the FYP process at department and faculty level')

doc.add_heading('1.3 Aim and Objectives', level=2)
doc.add_paragraph(
    'The aim of this project is to design and implement a multi-role web '
    'application that serves as a digital FYP repository and supervisor '
    'matching platform for the Department of Computer Science, ABU Zaria.'
)
doc.add_paragraph('The specific objectives are:')
bullet('To develop a searchable digital repository for past final year projects with full-text search and moderation workflow')
bullet('To implement a keyword-based supervisor matching algorithm using Jaccard similarity scoring')
bullet('To build a formal supervision request workflow with capacity management and integrity constraints')
bullet('To create role-based dashboards providing tailored views for students, supervisors, department admins, and faculty admins')
bullet('To implement an in-app notification system for workflow events')
bullet('To enforce server-side role-based access control (RBAC) across all system operations')

doc.add_heading('1.4 Scope of the Study', level=2)
doc.add_paragraph('The system encompasses five core modules:')
bullet('Module 1: Project Repository and Moderation - Upload, search, and moderate FYP projects')
bullet('Module 2: Supervisor Matching - Interest-tag profiles, capacity tracking, keyword-based match scoring')
bullet('Module 3: Supervision Request Workflow - Request submission, accept/decline with reasons, one-active-request constraint')
bullet('Module 4: Role-Based Dashboards - Tailored dashboards for each of the four user roles')
bullet('Module 5: In-App Notification System - Event-driven notifications with read/unread tracking')
doc.add_paragraph()
doc.add_paragraph('The following are explicitly out of scope:')
bullet('Real-time chat or direct messaging between users')
bullet('Native mobile applications (the web app is fully responsive)')
bullet('Payment or financial transaction features')
bullet('Integration with external university systems or SSO')
bullet('AI/ML-based recommendations beyond keyword overlap matching')

doc.add_heading('1.5 Significance of the Study', level=2)
doc.add_paragraph(
    'This project demonstrates end-to-end full-stack competency through a '
    'production-quality web application that solves a real institutional '
    'problem. Its significance includes:'
)
bullet('Providing students with digital access to past projects for reference and inspiration')
bullet('Enabling data-driven supervisor matching based on research interest alignment')
bullet('Automating the supervision request workflow, reducing administrative overhead')
bullet('Offering department and faculty-level analytics for informed decision-making')
bullet('Serving as a reference implementation for full-stack web development using modern frameworks')

doc.add_page_break()

# =========================================================================
# CHAPTER 2: SYSTEM ARCHITECTURE & TECHNOLOGY STACK
# =========================================================================
doc.add_heading('Chapter 2: System Architecture & Technology Stack', level=1)

doc.add_heading('2.1 High-Level Architecture', level=2)
doc.add_paragraph(
    'The system follows a decoupled client-server architecture with a clear '
    'separation between the frontend single-page application (SPA) and the '
    'backend RESTful API. Communication occurs over HTTP/HTTPS using JSON '
    'payloads, with authentication managed through secure HTTP-only session '
    'cookies via Laravel Sanctum.'
)
doc.add_paragraph(
    'Architecture Overview:\n'
    '\n'
    '  [Browser / Next.js SPA]  <-->  [Laravel REST API]  <-->  [MySQL Database]\n'
    '        (Port 3000)                (Port 8000)              (Port 3306)\n'
    '             |                          |\n'
    '        Tailwind CSS              Private File Storage\n'
    '        React 19                  (PDF uploads)\n'
    '        TypeScript\n'
)
doc.add_paragraph(
    'The frontend communicates with the backend exclusively through RESTful '
    'API endpoints. The backend handles all business logic, data validation, '
    'authentication, authorisation, and database operations. File uploads '
    '(PDFs) are stored on the server\'s private filesystem, outside the '
    'public web root, and served only through authenticated endpoints.'
)

doc.add_heading('2.2 Technology Stack', level=2)
add_table(
    ['Layer', 'Technology', 'Version', 'Justification'],
    [
        ['Frontend Framework', 'Next.js (App Router)', 'v16.2', 'React-based with file-based routing, server-side rendering support, and excellent developer experience'],
        ['UI Library', 'React', 'v19.2', 'Component-based architecture, declarative UI, large ecosystem'],
        ['Language', 'TypeScript', 'v5', 'Static typing for better code quality and developer tooling'],
        ['Styling', 'Tailwind CSS', 'v4', 'Utility-first CSS framework for rapid, consistent UI development'],
        ['Icons', 'Lucide React', 'v1.18', 'Lightweight, tree-shakeable icon library'],
        ['Backend Framework', 'Laravel', 'v13.8', 'Full-featured PHP framework with ORM, migrations, validation, and testing built-in'],
        ['Language', 'PHP', 'v8.4', 'Modern PHP with enums, union types, and named arguments'],
        ['Authentication', 'Laravel Sanctum', 'v4.0', 'SPA cookie-based auth with CSRF protection; simpler than JWT for same-origin SPAs'],
        ['Database', 'MySQL / MariaDB', '10.11', 'Relational database with FULLTEXT indexing for search; ACID-compliant transactions'],
        ['ORM', 'Eloquent', 'Built-in', 'Active Record pattern with relationships, eager loading, and query builder'],
        ['Testing', 'PHPUnit', 'v12.5', 'PHP standard testing framework; integrated with Laravel for feature and unit tests'],
        ['Containerisation', 'Docker Compose', 'v2', 'Reproducible development environment; one-command startup for all services'],
    ]
)

doc.add_heading('2.3 Repository Structure', level=2)
doc.add_paragraph('The project follows a monorepo structure with two independently runnable applications:')
doc.add_paragraph(
    'fyproject/\n'
    '  backend/                    # Laravel 13 API\n'
    '    app/\n'
    '      Http/Controllers/Api/   # 10 REST controllers\n'
    '      Models/                 # 8 Eloquent models\n'
    '      Policies/               # RBAC authorisation policies\n'
    '      Services/               # Business logic services\n'
    '      Enums/                  # Role and status enums\n'
    '      Notifications/          # Notification definitions\n'
    '    database/\n'
    '      migrations/             # 13 database migrations\n'
    '      seeders/                # Demo data seeders\n'
    '      factories/              # Model factories for testing\n'
    '    routes/api.php            # API route definitions\n'
    '    tests/                    # PHPUnit test suite\n'
    '  frontend/                   # Next.js 16 SPA\n'
    '    src/\n'
    '      app/                    # Pages (App Router file-based routing)\n'
    '      components/             # Reusable UI components\n'
    '      lib/                    # Utilities, API client, auth context, types\n'
    '  docs/                       # Schema, API reference, setup guides\n'
    '  compose.yaml                # Docker Compose configuration\n'
)

doc.add_page_break()

# =========================================================================
# CHAPTER 3: DATABASE DESIGN
# =========================================================================
doc.add_heading('Chapter 3: Database Design', level=1)

doc.add_heading('3.1 Entity-Relationship Overview', level=2)
doc.add_paragraph(
    'The database schema consists of 10 tables managed through 13 Laravel '
    'migrations. The schema implements a relational model that enforces '
    'referential integrity through foreign keys, unique constraints, and '
    'application-level transaction safety.'
)
doc.add_paragraph('Key relationships:')
bullet('A Department has many Users and many Projects')
bullet('A User (supervisor) has one SupervisorProfile (one-to-one)')
bullet('A SupervisorProfile has many InterestTags (many-to-many via pivot table)')
bullet('A User (student) uploads many Projects (one-to-many)')
bullet('A Project has many ProjectKeywords (one-to-many)')
bullet('A User (student) sends many SupervisionRequests (one-to-many)')
bullet('A User (supervisor) receives many SupervisionRequests (one-to-many)')
bullet('A User (student) bookmarks many Supervisors via SavedSupervisors (many-to-many)')
bullet('A User receives many Notifications (polymorphic one-to-many)')

doc.add_heading('3.2 Table Definitions', level=2)

doc.add_heading('3.2.1 departments', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['name', 'VARCHAR(255)', 'NOT NULL', 'Department name (e.g., Computer Science)'],
        ['faculty', 'VARCHAR(255)', 'NOT NULL', 'Faculty name (e.g., Physical Sciences)'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)

doc.add_heading('3.2.2 users', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['name', 'VARCHAR(255)', 'NOT NULL', 'Full name'],
        ['email', 'VARCHAR(255)', 'NOT NULL, UNIQUE', 'Login email address'],
        ['password', 'VARCHAR(255)', 'NOT NULL', 'Bcrypt-hashed password'],
        ['role', 'ENUM', 'NOT NULL', 'student | supervisor | dept_admin | super_admin'],
        ['department_id', 'BIGINT UNSIGNED', 'NULLABLE, FK -> departments', 'NULL for super_admin (faculty-wide)'],
        ['email_verified_at', 'TIMESTAMP', 'NULLABLE', 'Email verification timestamp'],
        ['remember_token', 'VARCHAR(100)', 'NULLABLE', 'Remember-me token'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)

doc.add_heading('3.2.3 supervisor_profiles', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['user_id', 'BIGINT UNSIGNED', 'NOT NULL, UNIQUE, FK -> users', 'One-to-one with user'],
        ['bio', 'TEXT', 'NULLABLE', 'Supervisor biography / research summary'],
        ['max_capacity', 'INT UNSIGNED', 'NOT NULL, DEFAULT 5', 'Maximum students the supervisor can accept'],
        ['current_load', 'INT UNSIGNED', 'NOT NULL, DEFAULT 0', 'Number of currently accepted students'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)

doc.add_heading('3.2.4 interest_tags', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['name', 'VARCHAR(255)', 'NOT NULL, UNIQUE', 'Normalised interest tag name'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)

doc.add_heading('3.2.5 supervisor_interest_tag (Pivot)', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['supervisor_profile_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> supervisor_profiles', 'Supervisor profile reference'],
        ['interest_tag_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> interest_tags', 'Interest tag reference'],
    ]
)
doc.add_paragraph('UNIQUE constraint on (supervisor_profile_id, interest_tag_id).')

doc.add_heading('3.2.6 projects', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['title', 'VARCHAR(255)', 'NOT NULL', 'Project title (FULLTEXT indexed with abstract)'],
        ['abstract', 'TEXT', 'NOT NULL', 'Project abstract'],
        ['department_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> departments', 'Owning department'],
        ['graduation_year', 'YEAR', 'NOT NULL', 'Year of graduation'],
        ['uploaded_by', 'BIGINT UNSIGNED', 'NOT NULL, FK -> users', 'Student who uploaded'],
        ['pdf_path', 'VARCHAR(255)', 'NULLABLE', 'Private storage path to the PDF file'],
        ['status', 'ENUM', 'NOT NULL, DEFAULT pending', 'pending | approved | rejected'],
        ['rejection_feedback', 'TEXT', 'NULLABLE', 'Admin feedback when rejected'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)
doc.add_paragraph('FULLTEXT index on (title, abstract) for MySQL natural language search.')

doc.add_heading('3.2.7 project_keywords', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['project_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> projects', 'Parent project'],
        ['keyword', 'VARCHAR(255)', 'NOT NULL', 'Normalised keyword string'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)
doc.add_paragraph('UNIQUE constraint on (project_id, keyword).')

doc.add_heading('3.2.8 supervision_requests', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['student_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> users', 'Requesting student'],
        ['supervisor_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> users', 'Target supervisor'],
        ['proposed_title', 'VARCHAR(255)', 'NOT NULL', 'Proposed project title'],
        ['proposal_summary', 'TEXT', 'NOT NULL', 'Proposal description'],
        ['proposal_keywords', 'TEXT', 'NULLABLE', 'Comma-separated keywords for matching'],
        ['status', 'ENUM', 'NOT NULL, DEFAULT pending', 'pending | accepted | declined'],
        ['decision_reason', 'TEXT', 'NULLABLE', 'Required when declined; optional on accept'],
        ['active_lock', 'BIGINT', 'GENERATED STORED, UNIQUE', 'student_id when active, else NULL'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)
doc.add_paragraph(
    'The active_lock column is a STORED generated column: '
    'CASE WHEN status IN (\'pending\',\'accepted\') THEN student_id ELSE NULL END. '
    'Combined with a UNIQUE index, this enforces the one-active-request-per-student '
    'constraint at the database level. MySQL allows multiple NULLs in a UNIQUE index, '
    'so declined requests do not block new ones.'
)

doc.add_heading('3.2.9 saved_supervisors', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'BIGINT UNSIGNED', 'PRIMARY KEY, AUTO_INCREMENT', 'Unique identifier'],
        ['student_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> users', 'Bookmarking student'],
        ['supervisor_id', 'BIGINT UNSIGNED', 'NOT NULL, FK -> users', 'Bookmarked supervisor'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
    ]
)
doc.add_paragraph('UNIQUE constraint on (student_id, supervisor_id).')

doc.add_heading('3.2.10 notifications', level=3)
add_table(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
        ['id', 'UUID', 'PRIMARY KEY', 'Unique identifier'],
        ['type', 'VARCHAR(255)', 'NOT NULL', 'Notification class name'],
        ['notifiable_type', 'VARCHAR(255)', 'NOT NULL', 'Polymorphic type (App\\Models\\User)'],
        ['notifiable_id', 'BIGINT UNSIGNED', 'NOT NULL', 'Polymorphic ID (user ID)'],
        ['data', 'TEXT (JSON)', 'NOT NULL', 'JSON payload: type, message, payload'],
        ['read_at', 'TIMESTAMP', 'NULLABLE', 'When the notification was read'],
        ['created_at', 'TIMESTAMP', 'NULLABLE', 'Record creation timestamp'],
        ['updated_at', 'TIMESTAMP', 'NULLABLE', 'Record update timestamp'],
    ]
)

doc.add_heading('3.3 Integrity Mechanisms', level=2)

doc.add_heading('3.3.1 One Active Request Per Student', level=3)
doc.add_paragraph(
    'A stored generated column (active_lock) on the supervision_requests table contains the '
    'student_id when the request status is "pending" or "accepted", and NULL otherwise. '
    'A UNIQUE index on this column ensures that at most one non-NULL value exists per student, '
    'preventing concurrent active requests at the database level. The application also checks '
    'this constraint inside a transaction, providing a user-friendly error message before the '
    'database constraint is triggered.'
)

doc.add_heading('3.3.2 Transactional Capacity Management', level=3)
doc.add_paragraph(
    'When a supervisor accepts a request, the system uses a database transaction with a '
    'row-level lock (SELECT ... FOR UPDATE) on the supervisor_profiles table. It verifies '
    'that current_load < max_capacity before incrementing the load. If the capacity would '
    'be exceeded (e.g., due to a race condition with concurrent accepts), the transaction '
    'is rolled back and a 422 error is returned.'
)

doc.add_heading('3.3.3 Full-Text Search Index', level=3)
doc.add_paragraph(
    'A MySQL FULLTEXT index on the projects table\'s title and abstract columns enables '
    'natural language mode search. Queries are parameterised (bound via ? placeholders) to '
    'prevent SQL injection while leveraging MySQL\'s built-in relevance ranking.'
)

doc.add_page_break()

# =========================================================================
# CHAPTER 4: API DESIGN
# =========================================================================
doc.add_heading('Chapter 4: API Design', level=1)

doc.add_heading('4.1 Authentication Flow', level=2)
doc.add_paragraph(
    'The API uses Laravel Sanctum SPA cookie authentication. The flow is:'
)
bullet('1. The client sends GET /sanctum/csrf-cookie (with credentials) to obtain an XSRF-TOKEN cookie')
bullet('2. The URL-decoded XSRF-TOKEN value is sent as the X-XSRF-TOKEN header on every state-changing request (POST/PUT/PATCH/DELETE)')
bullet('3. All requests include credentials: \'include\' and Accept: application/json headers')
bullet('4. On successful login (POST /api/login), a session cookie is set')
bullet('5. The session is HTTP-only, CSRF-protected, and stored in the database')

doc.add_heading('4.2 Common Response Codes', level=2)
add_table(
    ['Code', 'Meaning'],
    [
        ['200', 'OK - Request succeeded'],
        ['201', 'Created - Resource created successfully'],
        ['401', 'Unauthenticated - No valid session'],
        ['403', 'Forbidden - Insufficient role/permission'],
        ['404', 'Not Found - Resource does not exist'],
        ['422', 'Unprocessable - Validation or business rule error'],
    ]
)

doc.add_heading('4.3 Auth & Meta Endpoints', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['POST', '/api/register', 'Public', 'Register a new student or supervisor account'],
        ['POST', '/api/login', 'Public', 'Authenticate and start a session'],
        ['POST', '/api/logout', 'Any', 'End the current session'],
        ['GET', '/api/me', 'Any', 'Get the authenticated user\'s profile'],
        ['GET', '/api/departments', 'Public', 'List all departments'],
        ['GET', '/api/interest-tags', 'Any', 'List all interest tag names'],
        ['GET', '/api/topics', 'Any', 'List all unique project topics/keywords'],
    ]
)

doc.add_heading('4.4 Module 1: Project Endpoints', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['GET', '/api/projects', 'Any', 'List approved projects; supports q (FULLTEXT), keyword, topic, year, department_id filters. Paginated.'],
        ['GET', '/api/projects/{id}', 'Any (policy)', 'Get project details with similar_projects. Non-approved visible only to owner/admin.'],
        ['POST', '/api/projects', 'Student', 'Upload project: title, abstract, department_id, graduation_year, keywords[], pdf (<=20MB). Returns duplicate_advisory.'],
        ['GET', '/api/projects/{id}/download', 'Any (policy)', 'Stream PDF from private storage (permission-checked).'],
        ['GET', '/api/moderation/projects', 'Dept Admin / Super Admin', 'Pending projects queue, scoped to admin\'s department.'],
        ['PATCH', '/api/projects/{id}/approve', 'Dept Admin / Super Admin', 'Approve a pending project (department-scoped).'],
        ['PATCH', '/api/projects/{id}/reject', 'Dept Admin / Super Admin', 'Reject with required rejection_feedback.'],
    ]
)

doc.add_heading('4.5 Module 2: Supervisor Endpoints', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['GET', '/api/supervisors', 'Any', 'List supervisors; optional proposal_keywords[] for match scoring and ranking.'],
        ['GET', '/api/supervisors/{id}', 'Any', 'Supervisor profile with optional match score.'],
        ['PUT', '/api/supervisor/profile', 'Supervisor', 'Update own profile: bio, max_capacity, interest_tags[].'],
        ['GET', '/api/saved-supervisors', 'Student', 'List bookmarked supervisors.'],
        ['POST', '/api/supervisors/{id}/save', 'Student', 'Bookmark a supervisor.'],
        ['DELETE', '/api/supervisors/{id}/save', 'Student', 'Remove a bookmark.'],
    ]
)

doc.add_heading('4.6 Module 3: Request Endpoints', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['GET', '/api/requests', 'Student / Supervisor', 'Role-scoped: students see sent, supervisors see received.'],
        ['POST', '/api/requests', 'Student', 'Submit request: supervisor_id, proposed_title, proposal_summary, proposal_keywords[]. 422 if student has an active request.'],
        ['PATCH', '/api/requests/{id}/accept', 'Supervisor (owner)', 'Accept; increments capacity transactionally. 422 if supervisor is full.'],
        ['PATCH', '/api/requests/{id}/decline', 'Supervisor (owner)', 'Decline with required decision_reason. Frees student to request again.'],
    ]
)

doc.add_heading('4.7 Module 4: Dashboard Endpoint', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['GET', '/api/dashboard', 'Any', 'Returns role-tailored payload: student stats, supervisor capacity, admin approvals, or faculty-wide analytics.'],
    ]
)

doc.add_heading('4.8 Module 5: Notifications, Admin & Analytics', level=2)
add_table(
    ['Method', 'Path', 'Auth', 'Description'],
    [
        ['GET', '/api/notifications', 'Any', 'List recent notifications with unread_count.'],
        ['GET', '/api/notifications/unread-count', 'Any', 'Get unread notification count.'],
        ['POST', '/api/notifications/{id}/read', 'Any', 'Mark a notification as read.'],
        ['POST', '/api/notifications/read-all', 'Any', 'Mark all notifications as read.'],
        ['GET', '/api/admin/users', 'Super Admin', 'List/paginate users with role, department_id, q filters.'],
        ['POST', '/api/admin/users', 'Super Admin', 'Create a user account (any role).'],
        ['PATCH', '/api/admin/users/{id}', 'Super Admin', 'Update user details, role, department.'],
        ['DELETE', '/api/admin/users/{id}', 'Super Admin', 'Delete user (cannot delete self or last super admin).'],
        ['GET', '/api/admin/analytics', 'Super Admin', 'Faculty-wide analytics: projects by status/year, requests, capacity, top interests.'],
    ]
)

doc.add_page_break()

# =========================================================================
# CHAPTER 5: SYSTEM MODULES
# =========================================================================
doc.add_heading('Chapter 5: System Modules', level=1)

doc.add_heading('5.1 Module 1: Project Repository & Moderation', level=2)
doc.add_paragraph(
    'This module enables students to upload completed FYP projects to a digital '
    'repository. Each submission includes a title, abstract, keywords, department, '
    'graduation year, and a PDF document (maximum 20MB). Submissions enter a '
    '"pending" state and appear in the moderation queue for the relevant '
    'Department Admin (or Super Admin).'
)
doc.add_paragraph('Key features:')
bullet('Three-state moderation workflow: pending -> approved or pending -> rejected (with feedback)')
bullet('Full-text search over project titles and abstracts using MySQL FULLTEXT indexing in natural language mode')
bullet('Filtering by keyword, graduation year, department, and topic area')
bullet('Controlled PDF download: files are stored on the server\'s private filesystem (storage/app/private/) and served through an authenticated, permission-checked endpoint - never via public URL')
bullet('Duplicate/plagiarism advisory: when uploading or viewing a project, the system surfaces projects with high keyword overlap as an advisory indicator (not a hard block)')

doc.add_heading('5.2 Module 2: Supervisor Matching', level=2)
doc.add_paragraph(
    'This module implements a keyword-based supervisor matching system. Each supervisor '
    'maintains a profile with research interest tags, a biography, and a configurable '
    'maximum supervision capacity. Students can search for supervisors and see a match '
    'score based on the alignment between their proposal keywords and the supervisor\'s '
    'interest tags.'
)

doc.add_heading('5.2.1 Matching Algorithm: Jaccard Similarity', level=3)
doc.add_paragraph(
    'The matching algorithm uses Jaccard similarity, a well-established set similarity '
    'measure. The algorithm is deliberately simple and explainable, using pure set '
    'arithmetic without any ML or embedding-based approaches.'
)
doc.add_paragraph('Algorithm steps:')
bullet('1. Tokenise: Both the student\'s proposal keywords and the supervisor\'s interest tags are normalised (lowercased, trimmed, de-duplicated)')
bullet('2. Compute intersection: Find the set of tags common to both sets')
bullet('3. Compute union: Find the total set of unique tags across both sets')
bullet('4. Calculate score: Jaccard coefficient = |intersection| / |union| (range: 0.0 to 1.0)')
bullet('5. Surface result: The score is displayed as a percentage along with the count and names of matching tags')
doc.add_paragraph()
doc.add_paragraph(
    'Formula: score = |student_keywords intersect supervisor_tags| / |student_keywords union supervisor_tags|'
)
doc.add_paragraph()
doc.add_paragraph(
    'Example: A student with keywords ["machine learning", "computer vision", "deep learning"] '
    'matched against a supervisor with interests ["computer vision", "deep learning", "image processing"] '
    'yields: intersection = {"computer vision", "deep learning"} (2 items), '
    'union = {"machine learning", "computer vision", "deep learning", "image processing"} (4 items), '
    'score = 2/4 = 0.50 (50%). Supervisors are ranked by score descending.'
)

doc.add_paragraph('Additional features:')
bullet('Real-time capacity indicator showing available slots (max_capacity - current_load)')
bullet('Filtering by interest area, available capacity, and department')
bullet('Bookmarking: students can save supervisors for later reference')

doc.add_heading('5.3 Module 3: Supervision Request Workflow', level=2)
doc.add_paragraph(
    'This module implements the formal process for students to request supervision. '
    'A student submits a request to a chosen supervisor with a proposed title, '
    'proposal summary, and keywords. The supervisor can then accept or decline.'
)
doc.add_paragraph('State machine: pending -> accepted OR pending -> declined')
doc.add_paragraph('Key constraints:')
bullet('One-active-request rule: A student can hold at most one request with status "pending" or "accepted" at any time. Enforced both at the application level (transaction check) and the database level (UNIQUE index on generated column)')
bullet('Transactional capacity: When a supervisor accepts, current_load is incremented under a row lock (SELECT ... FOR UPDATE). If current_load would equal or exceed max_capacity, the accept is blocked')
bullet('Decline requires a reason: Supervisors must provide a decision_reason when declining, giving students constructive feedback')
bullet('When a request is declined, the student is freed to submit a new request to a different (or the same) supervisor')

doc.add_heading('5.4 Module 4: Role-Based Dashboards', level=2)
doc.add_paragraph(
    'Each user role has a tailored dashboard showing only the data and actions '
    'relevant to that role:'
)

doc.add_heading('Student Dashboard', level=3)
bullet('Active supervision request status with supervisor details')
bullet('Saved/bookmarked supervisors')
bullet('Uploaded projects with their approval status')
bullet('Quick-action buttons for uploading projects and finding supervisors')

doc.add_heading('Supervisor Dashboard', level=3)
bullet('Capacity progress bar (current_load / max_capacity)')
bullet('Pending incoming requests requiring action')
bullet('List of accepted students')
bullet('Quick-action button for updating profile')

doc.add_heading('Department Admin Dashboard', level=3)
bullet('Pending project approvals for their department')
bullet('Department supervisor roster with capacity overview')
bullet('Department statistics (total projects, students, supervisors)')

doc.add_heading('Super Admin (Faculty Admin) Dashboard', level=3)
bullet('Faculty-wide statistics across all departments')
bullet('Per-department breakdown table')
bullet('Capacity utilisation across all supervisors')
bullet('User management and analytics access')

doc.add_heading('5.5 Module 5: In-App Notifications', level=2)
doc.add_paragraph(
    'The notification system is event-driven and uses Laravel\'s built-in '
    'notification infrastructure with the database channel. Notifications are '
    'created automatically when key workflow events occur.'
)
doc.add_paragraph('Notification triggers:')
add_table(
    ['Event', 'Recipient', 'Notification Type'],
    [
        ['Student uploads a project', 'Department admins (same dept)', 'project_submitted'],
        ['Admin approves a project', 'Uploading student', 'project_approved'],
        ['Admin rejects a project', 'Uploading student', 'project_rejected'],
        ['Student submits a request', 'Target supervisor', 'request_received'],
        ['Supervisor accepts a request', 'Requesting student', 'request_accepted'],
        ['Supervisor declines a request', 'Requesting student', 'request_declined'],
    ]
)
doc.add_paragraph('UI features:')
bullet('Bell icon in the header with unread count badge')
bullet('Notification list page with read/unread status')
bullet('Mark individual or all notifications as read')

doc.add_page_break()

# =========================================================================
# CHAPTER 6: FRONTEND IMPLEMENTATION
# =========================================================================
doc.add_heading('Chapter 6: Frontend Implementation', level=1)

doc.add_heading('6.1 Application Structure (Next.js App Router)', level=2)
doc.add_paragraph(
    'The frontend is built with Next.js 16 using the App Router, which provides '
    'file-based routing. Each route corresponds to a page.tsx file within the '
    'src/app/ directory hierarchy.'
)

doc.add_heading('6.2 Page Routes', level=2)
add_table(
    ['Route', 'Access', 'Description'],
    [
        ['/', 'Public', 'Landing page with features, how-it-works, and call-to-action'],
        ['/login', 'Public', 'Email/password login with demo account quick-fill buttons'],
        ['/register', 'Public', 'Self-registration for students and supervisors'],
        ['/dashboard', 'All roles', 'Role-adaptive dashboard (4 variants)'],
        ['/projects', 'Authenticated', 'Browse approved projects with search and filters'],
        ['/projects/[id]', 'Authenticated', 'Single project view with duplicate advisory'],
        ['/projects/upload', 'Student', 'Upload a new project with PDF'],
        ['/supervisors', 'Authenticated', 'Find supervisors with keyword matching and ranking'],
        ['/supervisors/[id]', 'Authenticated', 'Supervisor profile with match percentage'],
        ['/requests', 'Student / Supervisor', 'View and manage supervision requests'],
        ['/requests/new', 'Student', 'Create a new supervision request'],
        ['/moderation', 'Dept Admin / Super Admin', 'Project approval queue'],
        ['/saved', 'Student', 'Bookmarked supervisors list'],
        ['/notifications', 'All roles', 'Notification centre'],
        ['/profile', 'All roles', 'Edit user profile and password'],
        ['/admin/users', 'Super Admin', 'User account management (CRUD)'],
        ['/analytics', 'Super Admin', 'Faculty-wide analytics and statistics'],
    ]
)

doc.add_heading('6.3 Key Components', level=2)
add_table(
    ['Component', 'File', 'Purpose'],
    [
        ['AppShell', 'components/AppShell.tsx', 'Root layout wrapper; provides AuthProvider and SidebarProvider context'],
        ['Sidebar', 'components/Sidebar.tsx', 'Navigation sidebar with role-based menu items; collapsible with persistence to localStorage'],
        ['RequireAuth', 'components/RequireAuth.tsx', 'Route guard component; checks authentication and optional role requirements; redirects to login if unauthenticated'],
        ['NotificationBell', 'components/NotificationBell.tsx', 'Header notification icon with live unread count badge'],
        ['UI Components', 'components/ui.tsx', 'Design system: Button, Input, Card, Badge, Modal, Select, Textarea, Avatar, StatusBadge, ProgressBar, Divider, and more'],
    ]
)

doc.add_heading('6.4 State Management', level=2)
doc.add_paragraph(
    'The frontend uses React\'s built-in Context API for global state, deliberately '
    'avoiding heavier state management libraries. This approach keeps the architecture '
    'simple and appropriate for the application\'s scope.'
)
bullet('AuthContext (lib/auth.tsx): Provides the current user object, loading state, refresh() to re-fetch user data, and logout() function. Calls GET /api/me on mount.')
bullet('SidebarContext (lib/sidebar.tsx): Manages sidebar collapsed/expanded state and mobile menu open/close. Persists collapse preference to localStorage.')
bullet('Local component state (useState): Each page manages its own form inputs, loading indicators, error states, and API results using React hooks.')

doc.add_heading('6.5 API Client', level=2)
doc.add_paragraph(
    'The frontend communicates with the backend through a centralised API client '
    '(lib/api.ts) that handles:'
)
bullet('CSRF token management: Fetches /sanctum/csrf-cookie before mutations and sends X-XSRF-TOKEN header')
bullet('Credential inclusion: All requests include credentials: \'include\' for cookie-based auth')
bullet('Type-safe methods: apiGet(), apiPost(), apiPut(), apiPatch(), apiDelete()')
bullet('Form upload support: isForm flag skips Content-Type header for multipart/form-data')
bullet('Error handling: ApiError class carries HTTP status and parsed Laravel validation errors')
bullet('PDF download: downloadProjectPdf() helper for authenticated blob downloads')

doc.add_page_break()

# =========================================================================
# CHAPTER 7: BACKEND IMPLEMENTATION
# =========================================================================
doc.add_heading('Chapter 7: Backend Implementation', level=1)

doc.add_heading('7.1 Controllers', level=2)
doc.add_paragraph(
    'The backend exposes 10 API controllers, each responsible for a specific '
    'domain area. All controllers are in the App\\Http\\Controllers\\Api namespace.'
)
add_table(
    ['Controller', 'Responsibility'],
    [
        ['AuthController', 'User registration, login, logout, profile retrieval and update'],
        ['ProjectController', 'Project CRUD, FULLTEXT search, PDF upload and download, moderation (approve/reject)'],
        ['SupervisorController', 'Supervisor listing with match scoring, profile management, interest tags'],
        ['SupervisionRequestController', 'Request submission, role-scoped listing, accept/decline with business rules'],
        ['DashboardController', 'Single endpoint returning role-tailored dashboard payload'],
        ['NotificationController', 'Notification listing, unread count, mark read/read all'],
        ['SavedSupervisorController', 'Student supervisor bookmarks (add/remove/list)'],
        ['AdminUserController', 'Super admin user management (CRUD)'],
        ['AnalyticsController', 'Faculty-wide analytics and aggregate statistics'],
        ['MetaController', 'Reference data: departments, interest tags, topics'],
    ]
)

doc.add_heading('7.2 Eloquent Models', level=2)
add_table(
    ['Model', 'Table', 'Key Relationships'],
    [
        ['User', 'users', 'belongsTo Department, hasOne SupervisorProfile, hasMany Projects/Requests/Notifications'],
        ['Department', 'departments', 'hasMany Users, hasMany Projects'],
        ['SupervisorProfile', 'supervisor_profiles', 'belongsTo User, belongsToMany InterestTags'],
        ['InterestTag', 'interest_tags', 'belongsToMany SupervisorProfiles'],
        ['Project', 'projects', 'belongsTo Department, belongsTo User (uploader), hasMany ProjectKeywords'],
        ['ProjectKeyword', 'project_keywords', 'belongsTo Project'],
        ['SupervisionRequest', 'supervision_requests', 'belongsTo User (student), belongsTo User (supervisor)'],
        ['SavedSupervisor', 'saved_supervisors', 'belongsTo User (student), belongsTo User (supervisor)'],
    ]
)

doc.add_heading('7.3 Business Logic Services', level=2)

doc.add_heading('7.3.1 MatchScoreService', level=3)
doc.add_paragraph(
    'Located at app/Services/MatchScoreService.php, this service implements the '
    'Jaccard similarity scoring and the duplicate overlap detection. It provides '
    'three static methods:'
)
bullet('tokenise(input): Normalises free-form keyword input into a clean, de-duplicated, lowercased set of tokens. Accepts strings (comma/semicolon/newline separated) or arrays.')
bullet('score(studentKeywords, supervisorTags): Computes Jaccard similarity, returning the score (0-1), percentage, matching tags list, and counts.')
bullet('overlap(candidate, existing): Computes the share of candidate keywords present in the existing set, used for the duplicate advisory indicator.')

doc.add_heading('7.3.2 NotificationService', level=3)
doc.add_paragraph(
    'Located at app/Services/NotificationService.php, this service creates '
    'in-app notifications for workflow events. It provides four static methods, '
    'each targeting the appropriate recipient(s):'
)
bullet('projectSubmitted(project): Notifies department admins of a new submission')
bullet('projectModerated(project): Notifies the uploader of approval or rejection')
bullet('requestReceived(request): Notifies the supervisor of a new request')
bullet('requestDecided(request): Notifies the student of acceptance or decline')

doc.add_heading('7.4 Authorisation Policies', level=2)
doc.add_paragraph(
    'Laravel policies enforce fine-grained RBAC on every operation beyond simple '
    'role checks. Two policies are defined:'
)
bullet('ProjectPolicy: Controls who can view, update, download, and moderate projects. Department admins can only moderate projects within their own department. Super admins can moderate all departments.')
bullet('SupervisionRequestPolicy: Controls who can view requests and make decisions. Only the receiving supervisor can accept or decline a request.')

doc.add_heading('7.5 Middleware', level=2)
bullet('EnsureRole: Custom middleware that checks the authenticated user\'s role against a list of allowed roles. Applied to route groups (e.g., moderation routes require dept_admin or super_admin).')
bullet('Sanctum auth:sanctum: Ensures the user has a valid session. Applied to all authenticated routes.')
bullet('Throttle: Rate-limiting on authentication endpoints (10 requests per minute) to prevent brute-force attacks.')

doc.add_page_break()

# =========================================================================
# CHAPTER 8: AUTHENTICATION & SECURITY
# =========================================================================
doc.add_heading('Chapter 8: Authentication & Security', level=1)

doc.add_heading('8.1 Authentication Mechanism', level=2)
doc.add_paragraph(
    'The system uses Laravel Sanctum\'s SPA (Single-Page Application) cookie '
    'authentication. This approach was chosen over JWT tokens because:'
)
bullet('HTTP-only session cookies cannot be accessed by JavaScript, protecting against XSS token theft')
bullet('CSRF protection is built-in via Sanctum\'s token mechanism')
bullet('Session management (invalidation, regeneration) is handled by Laravel\'s battle-tested session infrastructure')
bullet('Simpler implementation for same-origin/same-site SPAs compared to manual JWT management')

doc.add_paragraph('Security measures in the auth flow:')
bullet('Sessions are regenerated on login and registration (session fixation protection)')
bullet('Sessions are invalidated and the current access token is deleted on logout')
bullet('CORS is configured with an explicit origin allow-list (not wildcard) with credentials support')
bullet('Auth endpoints are rate-limited to 10 requests per minute')

doc.add_heading('8.2 Role-Based Access Control (RBAC)', level=2)
doc.add_paragraph(
    'RBAC is enforced server-side on every endpoint. The frontend hides controls '
    'for UX purposes but never relies on the UI for security.'
)
add_table(
    ['Capability', 'Student', 'Supervisor', 'Dept Admin', 'Super Admin'],
    [
        ['Browse/search approved projects', 'Yes', 'Yes', 'Yes', 'Yes'],
        ['Upload a completed FYP', 'Yes', 'No', 'No', 'No'],
        ['Approve/reject project uploads', 'No', 'No', 'Own dept', 'All depts'],
        ['Maintain supervisor profile', 'No', 'Yes', 'No', 'No'],
        ['Search supervisors / view match score', 'Yes', 'No', 'No', 'No'],
        ['Bookmark supervisors', 'Yes', 'No', 'No', 'No'],
        ['Submit supervision request', 'Yes', 'No', 'No', 'No'],
        ['Accept/decline requests', 'No', 'Yes', 'No', 'No'],
        ['Manage user accounts', 'No', 'No', 'No', 'Yes'],
        ['View department statistics', 'No', 'No', 'Own dept', 'All depts'],
        ['View faculty-wide analytics', 'No', 'No', 'No', 'Yes'],
        ['Receive notifications', 'Yes', 'Yes', 'Yes', 'Yes'],
    ]
)

doc.add_heading('8.3 Security Controls', level=2)
add_table(
    ['Attack Class', 'Status', 'Control'],
    [
        ['SQL Injection', 'Protected', 'All queries use Eloquent ORM or parameterised bindings. FULLTEXT search binds user input via ? placeholders.'],
        ['Path Traversal', 'Protected', 'Upload paths are server-generated (UUID + .pdf) on the private disk. Download paths are derived from the database, never from user input.'],
        ['Broken Access Control / IDOR', 'Protected', 'Every endpoint is double-gated: role middleware + model policies. Department scoping prevents cross-department access.'],
        ['Privilege Escalation', 'Protected', 'Self-registration hard-restricts role to student or supervisor. Role changes only via super admin endpoints.'],
        ['Cross-Site Scripting (XSS)', 'Protected', 'React auto-escapes output. No dangerouslySetInnerHTML usage. Session cookies are HTTP-only.'],
        ['Cross-Site Request Forgery', 'Protected', 'Sanctum CSRF token required on all state-changing requests. CORS uses explicit origin, not wildcard.'],
        ['Sensitive Data Exposure', 'Protected', 'Password and remember_token hidden on User model. PDF paths hidden on Project model. Notifications scoped to owning user.'],
        ['File Upload Attacks', 'Protected', 'PDF MIME type validation + 20MB size limit. Files stored outside web root.'],
    ]
)

doc.add_page_break()

# =========================================================================
# CHAPTER 9: TESTING
# =========================================================================
doc.add_heading('Chapter 9: Testing', level=1)

doc.add_heading('9.1 Test Suite Overview', level=2)
doc.add_paragraph(
    'The system includes a comprehensive PHPUnit test suite with 45 passing tests '
    'and 118 assertions. Tests run against a dedicated MySQL database (fyp_test) '
    'which is migrated fresh per run using Laravel\'s RefreshDatabase trait, '
    'ensuring that real database features (FULLTEXT index, generated columns) are '
    'exercised.'
)
doc.add_paragraph('To run the test suite:')
doc.add_paragraph('  cd backend')
doc.add_paragraph('  php artisan test')

doc.add_heading('9.2 Test Coverage Map', level=2)
add_table(
    ['Area', 'Test File', 'Key Scenarios Tested'],
    [
        ['Match Score Algorithm', 'Unit/MatchScoreServiceTest', 'Token normalisation and de-duplication; Jaccard for partial/identical/disjoint sets; the 67% seeded case; empty-set guard (no division by zero); overlap ratio'],
        ['Authentication', 'Feature/AuthTest', 'Student and supervisor registration (supervisor gets a profile); admin self-registration blocked; bad-credential rejection; /me requires auth'],
        ['RBAC & Moderation', 'Feature/ModerationTest', 'Student upload creates pending project; supervisor cannot upload (403); dept admin approve makes project searchable; reject requires feedback; admin cannot moderate another department; student cannot access queue'],
        ['Request Workflow', 'Feature/SupervisionRequestTest', 'Submit request; one-active-request blocked at app level AND by DB unique lock; accept increments current_load; accept blocked when full; decline requires reason and frees student; only receiving supervisor may decide'],
        ['Dashboards', 'Feature/DashboardTest', 'Guest gets 401; per-role payload shape verification; supervisor capacity percentage; dept admin scoped to own department; super admin sees faculty breakdown'],
        ['Notifications', 'Feature/NotificationTest', 'Each event notifies the right user; unread count and mark-read work correctly; per-user notification isolation'],
        ['Admin User Management', 'Feature/AdminUserTest', 'Super admin can list/create/reassign users; non-super-admin forbidden (403); cannot delete self; analytics RBAC and aggregate shape validation'],
    ]
)

doc.add_heading('9.3 Integration Verification', level=2)
doc.add_paragraph(
    'Beyond PHPUnit, the frontend-to-API contract (CSRF cookie, credentialed '
    'cross-origin requests, session auth) was verified end-to-end with a Node.js '
    'integration harness that replays the client\'s exact request flow against '
    'the live API: authentication, FULLTEXT search, match-score ranking, '
    'bookmarking, the one-active-request 422 error, notifications, RBAC, '
    'user management, and analytics.'
)

doc.add_page_break()

# =========================================================================
# CHAPTER 10: DEPLOYMENT
# =========================================================================
doc.add_heading('Chapter 10: Deployment & Setup', level=1)

doc.add_heading('10.1 Docker Compose Setup (Recommended)', level=2)
doc.add_paragraph(
    'The entire system can be started with a single command using Docker Compose. '
    'The compose.yaml file defines three services:'
)
add_table(
    ['Service', 'Image/Build', 'Port', 'Purpose'],
    [
        ['db', 'MariaDB 10.11', '3306', 'Database server with persistent volume (db_data)'],
        ['backend', 'Dockerfile (backend/)', '8000', 'Laravel API with persistent storage volume (backend_storage)'],
        ['frontend', 'Dockerfile (frontend/)', '3000', 'Next.js SPA with build-time API URL configuration'],
    ]
)
doc.add_paragraph('To start: docker compose up --build')
doc.add_paragraph(
    'The backend container automatically runs migrations and seeds the database '
    'on first start via the docker/start.sh entrypoint script.'
)

doc.add_heading('10.2 Manual Local Setup', level=2)
doc.add_paragraph('Prerequisites: PHP 8.4+, Composer, Node.js 18+, MySQL/MariaDB.')
doc.add_paragraph()
doc.add_paragraph('Backend setup:')
bullet('1. Create MySQL databases: fyp (main) and fyp_test (testing)')
bullet('2. cd backend && composer install')
bullet('3. cp .env.example .env && php artisan key:generate')
bullet('4. Configure database credentials in .env')
bullet('5. php artisan migrate:fresh --seed')
bullet('6. php artisan serve (starts on port 8000)')
doc.add_paragraph()
doc.add_paragraph('Frontend setup:')
bullet('1. cd frontend && npm install')
bullet('2. Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000')
bullet('3. npm run dev (starts on port 3000)')

doc.add_heading('10.3 Environment Configuration', level=2)
doc.add_paragraph('Key backend environment variables (.env):')
add_table(
    ['Variable', 'Purpose', 'Example Value'],
    [
        ['APP_URL', 'Backend URL', 'http://localhost:8000'],
        ['FRONTEND_URL', 'CORS allowed origin', 'http://localhost:3000'],
        ['DB_CONNECTION', 'Database driver', 'mysql'],
        ['DB_DATABASE', 'Database name', 'fyp'],
        ['SESSION_DRIVER', 'Session storage', 'database'],
        ['SESSION_DOMAIN', 'Cookie domain', 'localhost'],
        ['SANCTUM_STATEFUL_DOMAINS', 'Sanctum SPA domains', 'localhost:3000,localhost:8000'],
        ['FILESYSTEM_DISK', 'File storage disk', 'local (private)'],
    ]
)

doc.add_page_break()

# =========================================================================
# CHAPTER 11: USER GUIDE
# =========================================================================
doc.add_heading('Chapter 11: User Guide', level=1)

doc.add_heading('11.1 Demo Accounts', level=2)
doc.add_paragraph('All seeded accounts use the password: password')
add_table(
    ['Role', 'Name', 'Email'],
    [
        ['Super Admin', 'Prof. Ibrahim Adekunle (Dean)', 'superadmin@abu.edu.ng'],
        ['Dept Admin (CS)', 'CS Department Admin', 'cs.admin@abu.edu.ng'],
        ['Dept Admin (Maths)', 'Maths Department Admin', 'maths.admin@abu.edu.ng'],
        ['Supervisor', 'Dr. Aisha Bello', 'aisha.bello@abu.edu.ng'],
        ['Supervisor', 'Dr. Musa Ibrahim', 'musa.ibrahim@abu.edu.ng'],
        ['Supervisor', 'Dr. Grace Okoro', 'grace.okoro@abu.edu.ng'],
        ['Student', 'Ahmad Dalhat', 'ahmad.dalhat@student.abu.edu.ng'],
        ['Student', 'Bilal Yakubu', 'bilal.yakubu@student.abu.edu.ng'],
        ['Student', 'Chioma Nwosu', 'chioma.nwosu@student.abu.edu.ng'],
    ]
)

doc.add_heading('11.2 Student Workflow', level=2)
bullet('1. Register or log in as a student')
bullet('2. Browse the project repository (/projects) - search by keyword, filter by year/department')
bullet('3. Upload a completed FYP project (/projects/upload) with title, abstract, keywords, and PDF')
bullet('4. Find supervisors (/supervisors) - enter proposal keywords to see match scores')
bullet('5. Bookmark interesting supervisors (/saved) for later')
bullet('6. Submit a supervision request (/requests/new) with proposed title and summary')
bullet('7. Track request status on the dashboard (/dashboard)')
bullet('8. Check notifications (/notifications) for approval/rejection updates')

doc.add_heading('11.3 Supervisor Workflow', level=2)
bullet('1. Log in as a supervisor')
bullet('2. Update profile (/profile) with bio, research interests, and max capacity')
bullet('3. Review incoming requests on the dashboard or requests page (/requests)')
bullet('4. Accept requests (capacity is decremented automatically) or decline with a reason')
bullet('5. Monitor accepted students and capacity on the dashboard')

doc.add_heading('11.4 Department Admin Workflow', level=2)
bullet('1. Log in as a department admin')
bullet('2. Review pending project submissions in the moderation queue (/moderation)')
bullet('3. Download and review PDFs before making a decision')
bullet('4. Approve projects (they become searchable in the repository) or reject with feedback')
bullet('5. View department statistics on the dashboard')

doc.add_heading('11.5 Super Admin (Faculty Admin) Workflow', level=2)
bullet('1. Log in as the super admin')
bullet('2. View faculty-wide statistics and per-department breakdowns on the dashboard')
bullet('3. Manage user accounts (/admin/users) - create, update roles, or delete users')
bullet('4. Access faculty analytics (/analytics) for aggregate insights')
bullet('5. Moderate projects from any department via the moderation queue')

doc.add_page_break()

# =========================================================================
# APPENDICES
# =========================================================================
doc.add_heading('Appendices', level=1)

doc.add_heading('Appendix A: Complete File Structure', level=2)
doc.add_paragraph(
    'backend/\n'
    '  app/\n'
    '    Enums/Role.php, ProjectStatus.php, RequestStatus.php\n'
    '    Http/Controllers/Api/\n'
    '      AuthController.php, ProjectController.php,\n'
    '      SupervisorController.php, SupervisionRequestController.php,\n'
    '      DashboardController.php, NotificationController.php,\n'
    '      SavedSupervisorController.php, AdminUserController.php,\n'
    '      AnalyticsController.php, MetaController.php\n'
    '    Models/\n'
    '      User.php, Department.php, SupervisorProfile.php,\n'
    '      InterestTag.php, Project.php, ProjectKeyword.php,\n'
    '      SupervisionRequest.php, SavedSupervisor.php\n'
    '    Notifications/SystemNotification.php\n'
    '    Policies/ProjectPolicy.php, SupervisionRequestPolicy.php\n'
    '    Services/MatchScoreService.php, NotificationService.php\n'
    '  database/migrations/ (13 migration files)\n'
    '  database/seeders/DatabaseSeeder.php\n'
    '  database/factories/ (model factories)\n'
    '  routes/api.php\n'
    '  tests/Feature/ (7 test files)\n'
    '  tests/Unit/ (1 test file)\n'
    '\n'
    'frontend/\n'
    '  src/app/\n'
    '    layout.tsx, page.tsx (landing)\n'
    '    login/page.tsx, register/page.tsx\n'
    '    dashboard/page.tsx\n'
    '    projects/page.tsx, [id]/page.tsx, upload/page.tsx\n'
    '    supervisors/page.tsx, [id]/page.tsx\n'
    '    requests/page.tsx, new/page.tsx\n'
    '    moderation/page.tsx\n'
    '    saved/page.tsx\n'
    '    notifications/page.tsx\n'
    '    profile/page.tsx\n'
    '    admin/users/page.tsx\n'
    '    analytics/page.tsx\n'
    '  src/components/\n'
    '    AppShell.tsx, Sidebar.tsx, RequireAuth.tsx,\n'
    '    NotificationBell.tsx, ui.tsx\n'
    '  src/lib/\n'
    '    api.ts, auth.tsx, sidebar.tsx, types.ts, utils.ts\n'
    '\n'
    'docs/\n'
    '  schema.md, api.md, local-setup.md,\n'
    '  seed-data.md, demo-script.md,\n'
    '  testing.md, security-review.md\n'
    '\n'
    'compose.yaml, README.md, FYP_Build_Brief.md\n'
)

doc.add_heading('Appendix B: Seeded Data Summary', level=2)
bullet('4 departments (Faculty of Physical Sciences): Computer Science, Mathematics, Statistics, Physics')
bullet('8 supervisors with bios, interest tags, and varied max_capacity (2-5)')
bullet('10 projects with keywords and demo PDFs: 6 approved, 3 pending, 1 rejected')
bullet('Supervision requests in all states: 1 accepted, 1 pending, 1 declined')
bullet('Student bookmarks for several supervisors')

doc.add_heading('Appendix C: Development Phases', level=2)
add_table(
    ['Phase', 'Description', 'Status'],
    [
        ['Phase 0', 'Foundation: Monorepo scaffold, auth, RBAC, departments, seed data', 'Complete'],
        ['Phase 1', 'Repository + Moderation: Upload, FULLTEXT search, approve/reject workflow', 'Complete'],
        ['Phase 2', 'Supervisor Profiles + Matching: Interest tags, capacity, Jaccard scoring, bookmarks', 'Complete'],
        ['Phase 3', 'Request Workflow: Submit, one-active-request, accept/decline, transactional capacity', 'Complete'],
        ['Phase 4', 'Dashboards: Four role-tailored dashboards with real data', 'Complete'],
        ['Phase 5', 'Notifications + Admin: Event-driven notifications, user management, analytics', 'Complete'],
        ['Phase 6', 'Hardening: Auth throttling, docs, security review, responsive polish', 'Complete'],
    ]
)

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'FYP_Documentation.docx')
doc.save(output_path)
print(f'Document saved to {output_path}')
