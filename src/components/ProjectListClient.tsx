"use client";
import React, { useState } from "react";
import { MoreVertical, Pencil } from "lucide-react";
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
}

export default function ProjectListClient({
  projects: initialProjects,
}: ProjectListClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const supabase = createClient();

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

  return (
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
    </div>
  );
}
