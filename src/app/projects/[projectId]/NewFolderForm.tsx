"use client";
import React, { useState, FormEvent } from "react";
import { createFolder } from "../../actions/projects/folderActions";
import { useRouter } from "next/navigation";

export default function NewFolderForm({ projectId }: { projectId: string }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#e5e7eb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createFolder(projectId, name, color);
    setLoading(false);
    if (res.success) {
      setName("");
      setColor("#e5e7eb");
      router.refresh();
    } else {
      setError(res.error || "Failed to create folder");
    }
  }

  return (
    <form
      id="new-folder-form"
      className="mb-4 p-4 bg-gray-50 rounded border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="font-semibold mb-2">Create New Folder</div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          placeholder="Folder name"
          className="border rounded px-2 py-1 flex-1"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 border rounded"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="px-3 py-1 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Folder"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
