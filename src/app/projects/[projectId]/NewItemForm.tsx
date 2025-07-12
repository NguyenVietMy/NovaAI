"use client";
import React, { useState, FormEvent } from "react";
import { createItem } from "../../actions/projects/itemActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function NewItemForm({
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
    <form id="new-item-form" className="space-y-4" onSubmit={handleSubmit}>
      <Label htmlFor="item-name">Item Name</Label>
      <Input
        id="item-name"
        type="text"
        placeholder="Item name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center gap-4">
        <Label htmlFor="item-type" className="mb-0">
          Type
        </Label>
        <select
          id="item-type"
          className="border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={loading}
        >
          <option value="transcript">Transcript</option>
          <option value="outline">Outline</option>
          <option value="script">Script</option>
        </select>
        <div className="flex-1" />
        <Button
          type="submit"
          disabled={loading}
          variant="default"
          className="ml-auto bg-black text-white"
        >
          {loading ? "Creating..." : "Create Item"}
        </Button>
      </div>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
