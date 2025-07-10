"use client";
import React, { useState, FormEvent } from "react";
import { createItem } from "../../actions/projects/itemActions";
import { useRouter } from "next/navigation";

export default function NewItemForm({
  projectId,
  folderId,
}: {
  projectId: string;
  folderId?: string;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("transcript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createItem(projectId, name, type, {}, folderId);
    setLoading(false);
    if (res.success) {
      setName("");
      setType("transcript");
      router.refresh();
    } else {
      setError(res.error || "Failed to create item");
    }
  }

  return (
    <form
      id="new-item-form"
      className="mb-4 p-4 bg-gray-50 rounded border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="font-semibold mb-2">Create New Item</div>
      <div className="flex gap-2 items-center mb-2">
        <input
          type="text"
          placeholder="Item name"
          className="border rounded px-2 py-1 flex-1"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <select
          className="border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={loading}
        >
          <option value="transcript">Transcript</option>
          <option value="outline">Outline</option>
          <option value="script">Script</option>
        </select>
      </div>
      <button
        type="submit"
        className="px-3 py-1 bg-green-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Item"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
