"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiPut, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import RequireAuth from "@/components/RequireAuth";
import { Container, PageHeader } from "@/components/Container";
import {
  Card,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  FieldError,
  Alert,
  ProgressBar,
  Avatar,
  Divider,
} from "@/components/ui";
import { parseKeywords } from "@/lib/utils";
import { Save, Users, Lock, User as UserIcon } from "lucide-react";

function ProfileInner() {
  const { user, refresh } = useAuth();
  const profile = user?.supervisor_profile;
  const isSupervisor = user?.role === "supervisor";

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [bio, setBio] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [interestTags, setInterestTags] = useState("");

  const [basicSubmitting, setBasicSubmitting] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);
  const [basicErrors, setBasicErrors] = useState<Record<string, string[]>>({});
  const [basicSaved, setBasicSaved] = useState(false);

  const [supSubmitting, setSupSubmitting] = useState(false);
  const [supError, setSupError] = useState<string | null>(null);
  const [supErrors, setSupErrors] = useState<Record<string, string[]>>({});
  const [supSaved, setSupSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
    }
    if (profile) {
      setBio(profile.bio ?? "");
      setMaxCapacity(String(profile.max_capacity ?? ""));
      setInterestTags((profile.interest_tags ?? []).join(", "));
    }
  }, [user, profile]);

  async function handleBasicSubmit(e: FormEvent) {
    e.preventDefault();
    setBasicSubmitting(true);
    setBasicError(null);
    setBasicErrors({});
    setBasicSaved(false);

    const body: Record<string, string> = { name };
    if (newPassword) {
      body.current_password = currentPassword;
      body.password = newPassword;
      body.password_confirmation = confirmPassword;
    }

    try {
      await apiPut("/profile", body);
      await refresh();
      setBasicSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setBasicErrors(err.errors ?? {});
        setBasicError(
          err.status === 422
            ? "Please fix the highlighted fields."
            : err.message || "Could not save your profile."
        );
      } else {
        setBasicError("Could not reach the server.");
      }
    } finally {
      setBasicSubmitting(false);
    }
  }

  async function handleSupSubmit(e: FormEvent) {
    e.preventDefault();
    setSupSubmitting(true);
    setSupError(null);
    setSupErrors({});
    setSupSaved(false);
    try {
      await apiPut("/supervisor/profile", {
        bio,
        max_capacity: maxCapacity ? Number(maxCapacity) : 0,
        interest_tags: parseKeywords(interestTags),
      });
      await refresh();
      setSupSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSupErrors(err.errors ?? {});
        setSupError(
          err.status === 422
            ? "Please fix the highlighted fields."
            : err.message || "Could not save your profile."
        );
      } else {
        setSupError("Could not reach the server.");
      }
    } finally {
      setSupSubmitting(false);
    }
  }

  const pct =
    profile && profile.max_capacity > 0
      ? Math.round((profile.current_load / profile.max_capacity) * 100)
      : 0;

  return (
    <Container className="max-w-3xl">
      <PageHeader
        title="My Profile"
        description="Manage your account details and preferences."
      />

      {/* Header card */}
      <Card className="mb-6 p-5">
        <div className="flex items-center gap-4">
          {user && <Avatar name={user.name} role={user.role} size="lg" />}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">
              {user?.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">{user?.role_label}</Badge>
              {user?.department?.name && (
                <Badge tone="gray">{user.department.name}</Badge>
              )}
            </div>
            {isSupervisor && profile && (
              <div className="mt-3">
                <div className="mb-1.5 flex flex-wrap gap-2">
                  <Badge tone="indigo">
                    <Users className="mr-1 h-3 w-3" />
                    {profile.current_load}/{profile.max_capacity} students
                  </Badge>
                  <Badge tone={profile.has_capacity ? "green" : "yellow"}>
                    {profile.has_capacity
                      ? `${profile.available_slots} slots open`
                      : "At capacity"}
                  </Badge>
                </div>
                <ProgressBar
                  value={profile.current_load}
                  max={profile.max_capacity}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Basic info form — all roles */}
      <Card className="mb-6 p-6 sm:p-8">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Account Details</h2>
        <p className="mb-5 text-sm text-slate-500">Update your name or change your password.</p>

        {basicSaved && (
          <Alert tone="success" className="mb-5">
            Your profile has been updated.
          </Alert>
        )}
        {basicError && (
          <Alert tone="error" className="mb-5">
            {basicError}
          </Alert>
        )}

        <form onSubmit={handleBasicSubmit} className="space-y-5">
          <div>
            <Label htmlFor="prof-name">Full name</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FieldError message={basicErrors.name?.[0]} />
          </div>

          <div>
            <Label htmlFor="prof-email">Email</Label>
            <Input
              id="prof-email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="bg-slate-50 text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Contact an administrator to change your email.
            </p>
          </div>

          <Divider label="Change password" />

          <div>
            <Label htmlFor="prof-curpass">Current password</Label>
            <Input
              id="prof-curpass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required to set a new password"
            />
            <FieldError message={basicErrors.current_password?.[0]} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prof-newpass">New password</Label>
              <Input
                id="prof-newpass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <FieldError message={basicErrors.password?.[0]} />
            </div>
            <div>
              <Label htmlFor="prof-confpass">Confirm new password</Label>
              <Input
                id="prof-confpass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button type="submit" loading={basicSubmitting}>
              <Save className="h-4 w-4" />
              Update profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Supervisor settings — supervisor only */}
      {isSupervisor && (
        <Card className="p-6 sm:p-8">
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Supervisor Settings
          </h2>
          <p className="mb-5 text-sm text-slate-500">
            Manage your bio, capacity and interest areas visible to students.
          </p>

          {supSaved && (
            <Alert tone="success" className="mb-5">
              Supervisor settings saved.
            </Alert>
          )}
          {supError && (
            <Alert tone="error" className="mb-5">
              {supError}
            </Alert>
          )}

          <form onSubmit={handleSupSubmit} className="space-y-6">
            <div>
              <Label htmlFor="sup-bio">Bio</Label>
              <Textarea
                id="sup-bio"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your research areas, supervision style, and what you look for in a project…"
              />
              <FieldError message={supErrors.bio?.[0]} />
            </div>

            <Divider />

            <div className="max-w-xs">
              <Label htmlFor="sup-cap">Maximum capacity</Label>
              <Input
                id="sup-cap"
                type="number"
                min={0}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="e.g. 5"
              />
              <p className="mt-1 text-xs text-slate-400">
                The total number of students you can supervise.
              </p>
              <FieldError message={supErrors.max_capacity?.[0]} />
            </div>

            <Divider />

            <div>
              <Label htmlFor="sup-tags">Interest areas</Label>
              <Input
                id="sup-tags"
                value={interestTags}
                onChange={(e) => setInterestTags(e.target.value)}
                placeholder="machine learning, computer vision, NLP"
              />
              <p className="mt-1 text-xs text-slate-400">Separate with commas.</p>
              {parseKeywords(interestTags).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parseKeywords(interestTags).map((t) => (
                    <Badge key={t} tone="indigo">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              <FieldError message={supErrors.interest_tags?.[0]} />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" loading={supSubmitting}>
                <Save className="h-4 w-4" />
                Save supervisor settings
              </Button>
            </div>
          </form>
        </Card>
      )}
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileInner />
    </RequireAuth>
  );
}
