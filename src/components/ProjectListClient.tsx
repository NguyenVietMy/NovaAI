"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/../supabase/client";
import { Dialog } from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface ProjectListClientProps {
  projects: Project[];
  userId: string;
}

export default function ProjectListClient({
  projects: initialProjects,
  userId,
}: ProjectListClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (newProjectModalOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [newProjectModalOpen]);

  async function handleCreateProject() {
    setCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert([{ name: newProjectName, user_id: userId }])
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      setProjects([data, ...projects]);
      setNewProjectModalOpen(false);
      setNewProjectName("");
    }
  }

  const handleRename = async (projectId: string) => {
    await supabase
      .from("projects")
      .update({ name: renameValue })
      .eq("id", projectId);
    setProjects((projects) =>
      projects.map((p) =>
        p.id === projectId ? { ...p, name: renameValue } : p
      )
    );
    setRenameModalOpen(false);
    setRenameTarget(null);
  };

  const handleDelete = async (projectId: string) => {
    await supabase.from("projects").delete().eq("id", projectId);
    setProjects((projects) => projects.filter((p) => p.id !== projectId));
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition font-medium text-gray-800">
                <Plus className="w-5 h-5" /> New
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setNewProjectModalOpen(true)}>
                <LayoutDashboard className="w-4 h-4 mr-2" /> New project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[340px] relative">
            <div className="text-lg font-semibold mb-4">New project</div>
            <input
              ref={inputRef}
              className="border-2 border-blue-600 rounded px-3 py-2 w-full text-base mb-4 outline-none focus:ring-2 focus:ring-blue-400"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
              }}
              placeholder="Project name"
            />
            <div className="flex gap-4 justify-end mt-2">
              <button
                className="text-gray-600 hover:underline text-base px-2"
                onClick={() => setNewProjectModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className="text-blue-600 hover:underline text-base px-2"
                onClick={handleCreateProject}
                disabled={creating || !newProjectName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 mt-8">
        {projects.length === 0 && (
          <div className="text-gray-500">No projects yet.</div>
        )}
        {projects.map((project) => (
          <div key={project.id} className="relative">
            <a
              href={`/projects/${project.id}`}
              className="block bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition"
            >
              <div className="font-semibold text-lg flex items-center justify-between">
                <span>{project.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none z-10"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Project options"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onSelect={() => {
                        setRenameTarget(project);
                        setRenameValue(project.name);
                        setRenameModalOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setDeleteTarget(project);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </div>
            </a>
          </div>
        ))}
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
                <div className="text-lg font-semibold mb-4">Rename project</div>
                <input
                  className="border-2 border-blue-600 rounded px-3 py-2 w-full text-base mb-4 outline-none focus:ring-2 focus:ring-blue-400"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(renameTarget.id);
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
                    onClick={() => handleRename(renameTarget.id)}
                    disabled={!renameValue.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        )}
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
                <div className="text-lg font-semibold mb-4">Delete project</div>
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
    </>
  );
}
