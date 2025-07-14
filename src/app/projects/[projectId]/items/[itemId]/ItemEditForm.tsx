"use client";
import { useState } from "react";
import type { Item, Folder, ItemType } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";
import {
  updateItem,
  deleteItem,
} from "../../../../actions/projects/itemActions";
import { useRouter } from "next/navigation";

interface ItemEditFormProps {
  item: Item;
  folders: Folder[];
  projectId: string;
  sourceFolder?: string;
}

export default function ItemEditForm({
  item,
  folders,
  projectId,
  sourceFolder,
}: ItemEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [type, setType] = useState<ItemType>(item.type);
  const [data, setData] = useState(JSON.stringify(item.data, null, 2));
  const [folderId, setFolderId] = useState(item.folder_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle save action
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateItem(item.id, projectId, {
        name,
        type,
        data: JSON.parse(data),
        folder_id: folderId || null,
      });

      // Redirect to the source folder if provided, otherwise to the project
      if (sourceFolder && sourceFolder !== "uncategorized") {
        router.push(`/projects/${projectId}/folders/${sourceFolder}`);
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  }

  // Handle delete action
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteItem(item.id, projectId);
      // Redirect to the source folder if provided, otherwise to the project
      if (sourceFolder && sourceFolder !== "uncategorized") {
        router.push(`/projects/${projectId}/folders/${sourceFolder}`);
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 bg-white rounded shadow p-6"
    >
      {/* Item name */}
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {/* Item type (readonly for now) */}
      <div>
        <label className="block font-medium mb-1">Type</label>
        <input
          className="w-full border rounded px-3 py-2 bg-gray-100"
          value={type === "transcript (custom)" ? "transcript (custom)" : type}
          readOnly
        />
      </div>
      {/* Item data as JSON */}
      <div>
        <label className="block font-medium mb-1">Data (JSON)</label>
        <textarea
          className="w-full border rounded px-3 py-2 font-mono"
          rows={8}
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>
      {/* Folder dropdown */}
      <div>
        <label className="block font-medium mb-1">Folder</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      {/* Error message */}
      {error && <div className="text-red-600">{error}</div>}
      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          Save
        </button>
        <button
          type="button"
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="bg-red-600 text-white px-4 py-2 rounded ml-auto"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </form>
  );
}
