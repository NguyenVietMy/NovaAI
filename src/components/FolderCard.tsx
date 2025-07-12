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
  onChangeColor: () => void;
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
          <DropdownMenuItem onSelect={onChangeColor}>
            <Palette className="w-4 h-4 mr-2" /> Change Color
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
