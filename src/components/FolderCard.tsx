"use client";
import React, { useState } from "react";
import { Folder, MoreVertical, Pencil, Palette, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Dialog } from "./ui/dialog";

interface FolderCardProps {
  name: string;
  color: string;
  onRename: () => void;
  onChangeColor: (newColor: string) => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function FolderCard({
  name,
  color,
  onRename,
  onChangeColor,
  onDelete,
  onClick,
}: FolderCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newColor, setNewColor] = useState(color);

  return (
    <div
      className="relative min-w-[200px] max-w-[240px] h-[80px] rounded-xl flex items-center px-4 cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.03] border border-gray-200"
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      <Folder className="w-7 h-7 mr-3 text-gray-700" />
      <span className="font-semibold text-base truncate flex-1 text-gray-900">
        {name}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none z-10"
            onClick={(e) => e.stopPropagation()}
            aria-label="Folder options"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onRename}>
            <Pencil className="w-4 h-4 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setColorOpen(true)}>
            <Palette className="w-4 h-4 mr-2" /> Change Color
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Change Color Popover */}
      {colorOpen && (
        <div
          className="absolute z-20 top-12 right-0 bg-white border rounded shadow p-3 flex flex-col gap-2 min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="color"
            className="w-10 h-10 border rounded"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => {
                onChangeColor(newColor);
                setColorOpen(false);
              }}
            >
              Save
            </button>
            <button
              className="px-2 py-1 bg-gray-200 rounded text-sm"
              onClick={() => setColorOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Delete Confirm Dialog */}
      {deleteOpen && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <div className="fixed inset-0 bg-black/30 z-30 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[260px]">
              <div className="font-semibold mb-2">Delete folder?</div>
              <div className="text-gray-600 mb-4 text-sm">
                This action cannot be undone.
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  onClick={() => {
                    onDelete();
                    setDeleteOpen(false);
                  }}
                >
                  Delete
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded text-sm"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
