"use client";
import React, { useState, FormEvent } from "react";
import { createProject } from "../actions/projects/projectActions";
import { useRouter } from "next/navigation";

export default function NewProjectForm({ userId }: { userId: string }) {
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
    if (res.success) {
      setName("");
      router.refresh();
    } else {
      setError(res.error || "Failed to create project");
    }
  }

  return (
    <form
      className="mb-4 p-4 bg-gray-50 rounded border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="font-semibold mb-2">Create New Project</div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          placeholder="Project name"
          className="border rounded px-2 py-1 flex-1"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="px-3 py-1 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Project"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
