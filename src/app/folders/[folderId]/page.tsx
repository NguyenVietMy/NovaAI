import dynamic from "next/dynamic";
import { getFolderById } from "../../actions/projects/folderActions";
import { listOwnedAndSharedItems } from "../../actions/projects/itemActions";
import { notFound } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { NewItemModalButton } from "../../projects/[projectId]/NewItemModalButton";
import type { Folder, Item } from "@/types/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FilePlus, Plus } from "lucide-react";
import { NewItemForm } from "../../projects/[projectId]/NewItemForm";
import { HistoryImportModal } from "../../projects/[projectId]/HistoryImportModal";
import { createClient } from "../../../../supabase/server";

interface FolderViewProps {
  params: { folderId: string };
  searchParams?: { sort?: string };
}

export default async function FolderViewPage({
  params,
  searchParams,
}: FolderViewProps) {
  const { folderId } = params;
  // Fetch folder info by ID
  const folder = await getFolderById(folderId);
  if (!folder) return notFound();

  // Fetch current user (ownerId)
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData?.user?.id;
  if (!ownerId) return notFound();

  // Fetch items in this folder by folderId only, for the current user
  const items: Item[] = await listOwnedAndSharedItems(
    ownerId,
    folder.project_id,
    folderId
  );

  // Sorting (default: created_at desc)
  const sort = searchParams?.sort || "created_desc";
  let sortedItems = [...items];
  if (sort === "created_asc")
    sortedItems.sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (sort === "name_asc")
    sortedItems.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name_desc")
    sortedItems.sort((a, b) => b.name.localeCompare(a.name));

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Back button */}
        <div className="mb-4">
          <a
            href={"/projects"}
            className="inline-block text-blue-600 hover:underline"
          >
            ← Back to Projects
          </a>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: folder.color }}
          />
          <h1 className="text-2xl font-bold">{folder.name}</h1>
        </div>
        {/* +New Button for items in this folder, now under the folder name */}
        <NewItemModalButton
          projectId={folder.project_id || ""}
          folderId={folderId}
        />
        {/* Sorting and items list */}
        <div className="flex gap-4 mb-8">
          <select
            className="ml-auto border rounded px-2 py-1"
            defaultValue={sort}
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
        <div className="space-y-2">
          {sortedItems.length === 0 && (
            <div className="text-gray-500">No items in this folder.</div>
          )}
          {sortedItems.map((item) => (
            <a
              key={item.id}
              href={`/items/${item.id}`}
              className="bg-gray-100 rounded p-3 flex items-center justify-between hover:bg-gray-200 transition-colors"
            >
              <span className="font-mono text-sm">{item.name}</span>
              <span className="text-xs text-gray-500">
                {item.type === "transcript (custom)"
                  ? "transcript (custom)"
                  : item.type}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
