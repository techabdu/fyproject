// Shared API types for the FYP platform. Kept loose on purpose — the backend
// is the source of truth and this is a demo, so we favour resilience over
// exhaustive typing.

export type Role = "student" | "supervisor" | "dept_admin" | "super_admin";

export interface Department {
  id: number;
  name: string;
  faculty: string;
}

export interface SupervisorProfile {
  id: number;
  bio: string | null;
  max_capacity: number;
  current_load: number;
  available_slots: number;
  has_capacity: boolean;
  interest_tags: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  role_label: string;
  department_id: number | null;
  department: Department | null;
  supervisor_profile: SupervisorProfile | null;
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  abstract: string;
  department_id: number;
  department: Department | null;
  graduation_year: number;
  status: "pending" | "approved" | "rejected";
  rejection_feedback: string | null;
  uploaded_by: number;
  uploader: User | null;
  keywords: string[];
  created_at: string;
  download_url?: string;
}

export interface SimilarProject {
  id: number;
  title: string;
  graduation_year: number;
  overlap_count: number;
  overlap_ratio: number;
  matching_keywords: string[];
}

export interface SupervisorMatch {
  score: number;
  percentage: number;
  matching_tags: string[];
  matching_count: number;
}

export interface Supervisor {
  id: number;
  name: string;
  email: string;
  department: Department | null;
  bio: string | null;
  max_capacity: number;
  current_load: number;
  available_slots: number;
  has_capacity: boolean;
  interest_tags: string[];
  match: SupervisorMatch | null;
  is_saved: boolean;
}

export interface SupervisionRequest {
  id: number;
  status: "pending" | "accepted" | "declined";
  proposed_title: string;
  proposal_summary: string;
  proposal_keywords: string;
  decision_reason: string | null;
  student_id: number;
  supervisor_id: number;
  student: User | null;
  supervisor: User | null;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
    from?: number | null;
    to?: number | null;
  };
  links?: unknown;
}
