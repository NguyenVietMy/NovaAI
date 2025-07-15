import dynamic from "next/dynamic";
import {
  listItems,
  updateItem,
  deleteItem,
} from "../../../../actions/projects/itemActions";
import { listFolders } from "../../../../actions/projects/folderActions";
import { notFound, redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import type { Folder, Item } from "@/types/supabase";

const ItemEditForm = dynamic(() => import("./ItemEditForm"), { ssr: false });

interface ItemViewProps {
  params: { projectId: string; itemId: string };
  searchParams?: { sourceFolder?: string };
}

export default async function ItemViewPage({
  params,
  searchParams,
}: ItemViewProps) {
  const { projectId, itemId } = params;
  const { sourceFolder } = searchParams || {};

  // Fetch all items in the project and find the one we want
  const items: Item[] = await listItems(projectId);
  const item = items.find((i) => i.id === itemId);
  if (!item) return notFound();

  // Fetch all folders for the move dropdown
  const folders: Folder[] = await listFolders(projectId);

  // Determine the back navigation target
  // If sourceFolder is provided, use it; otherwise fall back to item's current folder
  const backTarget =
    sourceFolder === "uncategorized" ? null : sourceFolder || item.folder_id;

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Back button */}
        <div className="mb-4">
          {backTarget ? (
            <a
              href={`/projects/${projectId}/folders/${backTarget}`}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Folder
            </a>
          ) : (
            <a
              href={`/projects/${projectId}`}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Project
            </a>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-6">Edit Item</h1>
        <ItemEditForm
          item={item}
          folders={folders}
          projectId={projectId}
          sourceFolder={sourceFolder}
        />
      </div>
    </>
  );
}
