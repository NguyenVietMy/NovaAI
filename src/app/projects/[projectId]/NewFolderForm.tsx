"use client";
import React, { useState, FormEvent } from "react";
import { createFolder } from "../../actions/projects/folderActions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/../supabase/client";

export default function NewFolderForm({ projectId }: { projectId: string }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#e5e7eb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createFolder(projectId, name, color);
    setLoading(false);
    if (res.success) {
      setName("");
      setColor("#e5e7eb");
      setTouched(false);
      router.refresh();
    } else {
      setError(res.error || "Failed to create folder");
    }
  }

  return (
    <form id="new-folder-form" className="space-y-4" onSubmit={handleSubmit}>
      <Label htmlFor="folder-name">Folder Name</Label>
      <Input
        id="folder-name"
        type="text"
        placeholder="Folder name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />
      <Label htmlFor="folder-color">Color</Label>
      <Input
        id="folder-color"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-16 h-10 p-0 border-none"
        disabled={loading}
      />
      <Button type="submit" disabled={loading} variant="default">
        {loading ? "Creating..." : "Create Folder"}
      </Button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
