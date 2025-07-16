"use client";
import React, { useState, FormEvent } from "react";
import { createItem } from "../../actions/projects/itemActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/../supabase/client";
import type { Item, ItemType } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

export function NewItemForm({
  projectId,
  folderId,
}: {
  projectId: string;
  folderId?: string;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("transcript (custom)");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Fetch userId from supabase client
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in to create an item.");
      setLoading(false);
      return;
    }
    const ownerId = user.id;
    // Use new createItem signature: name, type, data, ownerId, projectId, folderId
    const res = await createItem(
      name,
      type,
      {},
      ownerId,
      projectId ? projectId : null,
      folderId ? folderId : null
    );
    setLoading(false);
    if (res.success) {
      setName("");
      setType("transcript (custom)");
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
          onChange={(e) => setType(e.target.value as ItemType)}
          disabled={loading}
        >
          <option value="transcript (custom)">Transcript (custom)</option>
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
