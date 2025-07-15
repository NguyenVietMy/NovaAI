import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import {
  shareFolder,
  unshareFolder,
  listFolderShares,
} from "@/app/actions/projects/folderActions";
import {
  shareItem,
  unshareItem,
  listItemShares,
} from "@/app/actions/projects/itemActions";

interface ShareModalProps {
  type: "folder" | "item";
  id: string;
  owner: { name?: string | null; email: string };
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({
  type,
  id,
  owner,
  open,
  onClose,
}: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  // Fetch shared users
  useEffect(() => {
    if (!open) return;
    async function fetchShares() {
      let res;
      if (type === "folder") {
        res = await listFolderShares(id);
      } else {
        res = await listItemShares(id);
      }
      if (res.success) {
        setSharedUsers(res.users);
      } else {
        setSharedUsers([]);
      }
    }
    fetchShares();
  }, [open, id, type, refresh]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    let res;
    if (type === "folder") {
      res = await shareFolder(id, email, permission);
    } else {
      res = await shareItem(id, email, permission);
    }
    setLoading(false);
    if (res.success) {
      setSuccess("User added!");
      setEmail("");
      setPermission("view");
      setRefresh((r) => r + 1);
    } else {
      setError(res.error || "Failed to share");
    }
  }

  async function handleUnshare(userId: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    let res;
    if (type === "folder") {
      res = await unshareFolder(id, userId);
    } else {
      res = await unshareItem(id, userId);
    }
    setLoading(false);
    if (res.success) {
      setSuccess("User removed");
      setRefresh((r) => r + 1);
    } else {
      setError(res.error || "Failed to unshare");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <div className="mb-4">
          <div className="font-semibold text-lg mb-1">Share settings</div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Owner:</span>{" "}
            {owner.name ? `${owner.name} (${owner.email})` : owner.email}
          </div>
        </div>
        <form className="flex gap-2 mb-4" onSubmit={handleShare}>
          <Input
            type="email"
            placeholder="Add people by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
            disabled={loading}
          />
          <select
            className="border rounded px-2 py-1"
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            disabled={loading}
          >
            <option value="view">Viewer</option>
            <option value="edit">Editor</option>
          </select>
          <Button type="submit" disabled={loading || !email.trim()}>
            Share
          </Button>
        </form>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm mb-2">{success}</div>
        )}
        <div className="mb-2 font-medium">People with access</div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
            <span className="font-semibold">{owner.name || owner.email}</span>
            <span className="text-xs text-gray-500 ml-2">(Owner)</span>
          </div>
          {sharedUsers.length === 0 && (
            <div className="text-gray-500 text-sm">
              No one else has access yet.
            </div>
          )}
          {sharedUsers.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <span>{user.name || user.email}</span>
              <span className="text-xs text-gray-500 ml-2">{user.email}</span>
              <span className="ml-auto text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                {user.permission === "edit" ? "Editor" : "Viewer"}
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnshare(user.user_id)}
                disabled={loading}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
