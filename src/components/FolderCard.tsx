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
import ShareModal from "./ShareModal";

interface FolderCardProps {
  name: string;
  color: string;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
  onClick: () => void;
  id: string;
  ownerName?: string | null;
  ownerEmail: string;
}

export default function FolderCard({
  name,
  color,
  onRename,
  onChangeColor,
  onDelete,
  onClick,
  id,
  ownerName,
  ownerEmail,
}: FolderCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newColor, setNewColor] = useState(color);

  return (
    <>
      <div
        className="relative min-w-[200px] max-w-[240px] h-[80px] rounded-xl flex items-center px-4 cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.03] border border-gray-200 m-1"
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
            <DropdownMenuItem onSelect={onChangeColor}>
              <Palette className="w-4 h-4 mr-2" /> Change Color
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShareOpen(true)}>
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12h.01M12 12h.01M9 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"
                  />
                </svg>
                Share
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ShareModal
        type="folder"
        id={id}
        owner={{ name: ownerName, email: ownerEmail }}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
