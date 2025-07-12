"use client";
import React, { useState, FormEvent } from "react";
import { createProject } from "../actions/projects/projectActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProjectForm({
  userId,
  onProjectCreated,
}: {
  userId: string;
  onProjectCreated?: (project: any) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createProject(userId, name);
    setLoading(false);
    if (res.success && res.project) {
      setName("");
      if (onProjectCreated) onProjectCreated(res.project);
    } else {
      setError(res.error || "Failed to create project");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Label htmlFor="project-name">Project Name</Label>
      <Input
        id="project-name"
        type="text"
        placeholder="Project name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" disabled={loading} variant="default">
        {loading ? "Creating..." : "Create Project"}
      </Button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
