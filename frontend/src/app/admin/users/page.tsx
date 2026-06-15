"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Button,
  Input,
  Select,
  Label,
  Badge,
  FieldError,
  Alert,
  Modal,
  EmptyState,
  PageSpinner,
  Avatar,
} from "@/components/ui";
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api";
import type { Department } from "@/lib/types";
import { UserPlus, Pencil, Trash2, Search, Users } from "lucide-react";

const ROLE_TONES: Record<string, any> = {
  student: "blue",
  supervisor: "purple",
  dept_admin: "indigo",
  super_admin: "green",
};
const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  supervisor: "Supervisor",
  dept_admin: "Dept Admin",
  super_admin: "Super Admin",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  role: "student",
  department_id: "",
};

function UsersInner() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [q, setQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (roleFilter) params.set("role", roleFilter);
        if (q.trim()) params.set("q", q.trim());
        const res = await apiGet(`/admin/users?${params.toString()}`);
        setUsers(res?.data ?? []);
        setMeta(res?.meta ?? null);
        setPage(p);
      } catch {
        setError("Could not load users.");
      } finally {
        setLoading(false);
      }
    },
    [roleFilter, q]
  );

  useEffect(() => {
    apiGet("/departments").then((r) => setDepartments(r?.data ?? [])).catch(() => {});
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(u: any) {
    setEditing(u);
    setForm({
      ...emptyForm,
      name: u.name,
      email: u.email,
      role: u.role,
      department_id: u.department_id ? String(u.department_id) : "",
    });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormError(null);

    const body: any = {
      name: form.name,
      email: form.email,
      role: form.role,
      department_id: form.role === "super_admin" ? null : form.department_id ? Number(form.department_id) : null,
    };
    if (form.password) {
      body.password = form.password;
      body.password_confirmation = form.password_confirmation;
    }

    try {
      if (editing) {
        await apiPatch(`/admin/users/${editing.id}`, body);
      } else {
        await apiPost("/admin/users", body);
      }
      setFormOpen(false);
      load(editing ? page : 1);
    } catch (err) {
      if (err instanceof ApiError) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.errors ?? {})) flat[k] = (v as string[])[0];
        setFormErrors(flat);
        setFormError(err.status === 422 ? "Please fix the highlighted fields." : err.message);
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete user.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const needsDept = form.role !== "super_admin";

  return (
    <Container>
      <PageHeader
        title="User Management"
        description="Create and manage accounts across the faculty."
        action={
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      {error && <Alert tone="error" className="mb-4">{error}</Alert>}

      <Card className="mb-6 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1);
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-12"
        >
          <div className="sm:col-span-7">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-9" />
            </div>
          </div>
          <div className="sm:col-span-3">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="supervisor">Supervisors</option>
              <option value="dept_admin">Dept Admins</option>
              <option value="super_admin">Super Admins</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">Filter</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <PageSpinner label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try a different search or filter."
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} role={u.role} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONES[u.role] ?? "gray"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.department?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => load(page + 1)}>Next</Button>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit user" : "Add user"}>
        {formError && <Alert tone="error" className="mb-4">{formError}</Alert>}
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <Label htmlFor="u-name">Full name</Label>
            <Input id="u-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <FieldError message={formErrors.name} />
          </div>
          <div>
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <FieldError message={formErrors.email} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="u-role">Role</Label>
              <Select id="u-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
                <option value="dept_admin">Dept Admin</option>
                <option value="super_admin">Super Admin</option>
              </Select>
              <FieldError message={formErrors.role} />
            </div>
            <div>
              <Label htmlFor="u-dept">Department</Label>
              <Select id="u-dept" value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))} disabled={!needsDept}>
                <option value="">{needsDept ? "Select…" : "N/A (faculty-wide)"}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              <FieldError message={formErrors.department_id} />
            </div>
          </div>
          <div>
            <Label htmlFor="u-pass">{editing ? "New password (optional)" : "Password"}</Label>
            <Input id="u-pass" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!editing} placeholder={editing ? "Leave blank to keep current" : "At least 8 characters"} />
            <FieldError message={formErrors.password} />
          </div>
          {form.password && (
            <div>
              <Label htmlFor="u-pass2">Confirm password</Label>
              <Input id="u-pass2" type="password" value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))} />
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create user"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user">
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold">{deleteTarget?.name}</span> ({deleteTarget?.email})? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={doDelete}>Delete user</Button>
        </div>
      </Modal>
    </Container>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth roles={["super_admin"]}>
      <UsersInner />
    </RequireAuth>
  );
}
