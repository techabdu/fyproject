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
import { Save, Users, Briefcase } from "lucide-react";

function ProfileInner() {
  const { user, refresh } = useAuth();
  const profile = user?.supervisor_profile;

  const [bio, setBio] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [interestTags, setInterestTags] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      setMaxCapacity(String(profile.max_capacity ?? ""));
      setInterestTags((profile.interest_tags ?? []).join(", "));
    }
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrors({});
    setSaved(false);
    try {
      await apiPut("/supervisor/profile", {
        bio,
        max_capacity: maxCapacity ? Number(maxCapacity) : 0,
        interest_tags: parseKeywords(interestTags),
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setError(
          err.status === 422
            ? "Please fix the highlighted fields."
            : err.message || "Could not save your profile."
        );
      } else {
        setError("Could not reach the server.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const pct = profile && profile.max_capacity > 0
    ? Math.round((profile.current_load / profile.max_capacity) * 100)
    : 0;

  return (
    <Container className="max-w-3xl">
      <PageHeader
        title="My Profile"
        description="Update your bio, supervision capacity and interest areas."
      />

      {profile && (
        <Card className="mb-6 p-5">
          <div className="flex items-center gap-4">
            {user && <Avatar name={user.name} role="supervisor" size="lg" />}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.department?.name ?? "No department"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="indigo">
                  <Users className="mr-1 h-3 w-3" />
                  {profile.current_load}/{profile.max_capacity} students
                </Badge>
                <Badge tone={profile.has_capacity ? "green" : "yellow"}>
                  {profile.has_capacity ? `${profile.available_slots} slots open` : "At capacity"}
                </Badge>
              </div>
              <ProgressBar value={profile.current_load} max={profile.max_capacity} className="mt-3" />
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 sm:p-8">
        {saved && (
          <Alert tone="success" className="mb-5">
            Your profile has been updated.
          </Alert>
        )}
        {error && (
          <Alert tone="error" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your research areas, supervision style, and what you look for in a project…"
            />
            <FieldError message={errors.bio?.[0]} />
          </div>

          <Divider />

          <div className="max-w-xs">
            <Label htmlFor="max_capacity">Maximum capacity</Label>
            <Input
              id="max_capacity"
              type="number"
              min={0}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="e.g. 5"
            />
            <p className="mt-1 text-xs text-slate-400">
              The total number of students you can supervise.
            </p>
            <FieldError message={errors.max_capacity?.[0]} />
          </div>

          <Divider />

          <div>
            <Label htmlFor="interest_tags">Interest areas</Label>
            <Input
              id="interest_tags"
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
            <FieldError message={errors.interest_tags?.[0]} />
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button type="submit" loading={submitting}>
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth roles={["supervisor"]}>
      <ProfileInner />
    </RequireAuth>
  );
}
