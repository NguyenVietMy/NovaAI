"use client";
import React, { useState, useRef, useEffect } from "react";
import FolderCard from "./FolderCard";
import { useRouter } from "next/navigation";
import { createClient } from "@/../supabase/client";
import { Plus, FolderPlus, FilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Dialog } from "./ui/dialog";
import type { FolderWithOwner } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";
import { createFolder } from "@/app/actions/projects/folderActions";

interface FolderListClientProps {
  folders: FolderWithOwner[];
  projectId: string;
  hideNewButton?: boolean;
}

export default function FolderListClient({
  folders: initialFolders,
  projectId,
  hideNewButton = false,
}: FolderListClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [folders, setFolders] = useState<FolderWithOwner[]>(initialFolders);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("Untitled folder");
  const [newColor, setNewColor] = useState("#e5e7eb");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FolderWithOwner | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [colorTarget, setColorTarget] = useState<FolderWithOwner | null>(null);
  const [colorValue, setColorValue] = useState("#e5e7eb");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FolderWithOwner | null>(
    null
  );

  useEffect(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [modalOpen]);

  async function handleCreateFolder() {
    setCreating(true);
    const res = await createFolder(projectId, newName, newColor);
    setCreating(false);
    if (res.success && res.data) {
      setFolders([res.data, ...folders]);
      setModalOpen(false);
      setNewName("Untitled folder");
      setNewColor("#e5e7eb");
    }
  }

  async function handleRename(folderId: string, name: string) {
    let query = supabase.from("folders").update({ name }).eq("id", folderId);
    if (projectId === "") {
      query = query.is("project_id", null);
    } else {
      query = query.eq("project_id", projectId);
    }
    await query;
    setFolders((folders) =>
      folders.map((f) => (f.id === folderId ? { ...f, name } : f))
    );
    setRenameModalOpen(false);
    setRenameTarget(null);
  }
  async function handleChangeColor(folderId: string, color: string) {
    let query = supabase.from("folders").update({ color }).eq("id", folderId);
    if (projectId === "") {
      query = query.is("project_id", null);
    } else {
      query = query.eq("project_id", projectId);
    }
    await query;
    setFolders((folders) =>
      folders.map((f) => (f.id === folderId ? { ...f, color } : f))
    );
    setColorModalOpen(false);
    setColorTarget(null);
  }
  async function handleDelete(folderId: string) {
    let query = supabase.from("folders").delete().eq("id", folderId);
    if (projectId === "") {
      query = query.is("project_id", null);
    } else {
      query = query.eq("project_id", projectId);
    }
    await query;
    setFolders((folders) => folders.filter((f) => f.id !== folderId));
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mb-10">
      {!hideNewButton && (
        <div className="flex items-center mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition font-medium text-gray-800">
                <Plus className="w-5 h-5" /> New
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setModalOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" /> New folder
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FilePlus className="w-4 h-4 mr-2" /> New item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {/* New Folder Modal */}
      {!hideNewButton && modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[340px] relative">
            <div className="text-lg font-semibold mb-4">New folder</div>
            <input
              ref={inputRef}
              className="border-2 border-blue-600 rounded px-3 py-2 w-full text-base mb-4 outline-none focus:ring-2 focus:ring-blue-400"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <input
                type="color"
                className="w-10 h-10 border rounded"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                title="Choose folder color"
              />
              <div className="flex gap-4 ml-auto">
                <button
                  className="text-gray-600 hover:underline text-base px-2"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  className="text-blue-600 hover:underline text-base px-2"
                  onClick={handleCreateFolder}
                  disabled={creating || !newName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {projectId === "" ? (
        <div className="flex flex-row gap-x-4">
          {folders.length === 0 && (
            <div className="text-gray-500">No folders yet.</div>
          )}
          {folders.map((folder: FolderWithOwner) => (
            <FolderCard
              key={folder.id}
              id={folder.id}
              name={folder.name}
              color={folder.color}
              ownerName={folder.users?.name}
              ownerEmail={folder.users?.email || folder.owner_id || "unknown"}
              onRename={() => {
                setRenameTarget(folder);
                setRenameValue(folder.name);
                setRenameModalOpen(true);
              }}
              onChangeColor={() => {
                setColorTarget(folder);
                setColorValue(folder.color);
                setColorModalOpen(true);
              }}
              onDelete={() => {
                setDeleteTarget(folder);
                setDeleteModalOpen(true);
              }}
              onClick={() => {
                router.push(`/folders/${folder.id}`);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-4">
          {folders.length === 0 && (
            <div className="text-gray-500">No folders yet.</div>
          )}
          {folders.map((folder: FolderWithOwner) => (
            <FolderCard
              key={folder.id}
              id={folder.id}
              name={folder.name}
              color={folder.color}
              ownerName={folder.users?.name}
              ownerEmail={folder.users?.email || folder.owner_id || "unknown"}
              onRename={() => {
                setRenameTarget(folder);
                setRenameValue(folder.name);
                setRenameModalOpen(true);
              }}
              onChangeColor={() => {
                setColorTarget(folder);
                setColorValue(folder.color);
                setColorModalOpen(true);
              }}
              onDelete={() => {
                setDeleteTarget(folder);
                setDeleteModalOpen(true);
              }}
              onClick={() => {
                router.push(`/folders/${folder.id}`);
              }}
            />
          ))}
        </div>
      )}
      {/* Rename Modal */}
      {renameModalOpen && renameTarget && (
        <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
          <div
            className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center"
            onClick={() => setRenameModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-4">Rename folder</div>
              <input
                className="border-2 border-blue-600 rounded px-3 py-2 w-full text-base mb-4 outline-none focus:ring-2 focus:ring-blue-400"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    handleRename(renameTarget.id, renameValue);
                  if (e.key === "Escape") setRenameModalOpen(false);
                }}
              />
              <div className="flex gap-4 justify-end mt-2">
                <button
                  className="text-gray-600 hover:underline text-base px-2"
                  onClick={() => setRenameModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="text-blue-600 hover:underline text-base px-2"
                  onClick={() => handleRename(renameTarget.id, renameValue)}
                  disabled={!renameValue.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {/* Change Color Modal */}
      {colorModalOpen && colorTarget && (
        <Dialog open={colorModalOpen} onOpenChange={setColorModalOpen}>
          <div
            className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center"
            onClick={() => setColorModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-4">
                Change folder color
              </div>
              <input
                type="color"
                className="w-16 h-16 border rounded mb-4"
                value={colorValue}
                onChange={(e) => setColorValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    handleChangeColor(colorTarget.id, colorValue);
                  if (e.key === "Escape") setColorModalOpen(false);
                }}
              />
              <div className="flex gap-4 justify-end mt-2">
                <button
                  className="text-gray-600 hover:underline text-base px-2"
                  onClick={() => setColorModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="text-blue-600 hover:underline text-base px-2"
                  onClick={() => handleChangeColor(colorTarget.id, colorValue)}
                  disabled={!colorValue}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && (
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <div
            className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center"
            onClick={() => setDeleteModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-lg font-semibold mb-4">Delete folder</div>
              <p className="text-gray-800 mb-4">
                Are you sure you want to delete "{deleteTarget.name}"? This
                action cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  className="text-gray-600 hover:underline text-base px-2"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="text-red-600 hover:underline text-base px-2"
                  onClick={() => handleDelete(deleteTarget.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
