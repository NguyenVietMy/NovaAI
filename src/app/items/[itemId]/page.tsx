import dynamic from "next/dynamic";
import {
  listItems,
  updateItem,
  deleteItem,
  listItemShares,
} from "../../actions/projects/itemActions";
import { listFolders } from "../../actions/projects/folderActions";
import { notFound, redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import type { Folder, Item } from "@/types/supabase";
import { createClient } from "../../../../supabase/server";

const ItemEditForm = dynamic(() => import("./ItemEditForm"), { ssr: false });

interface ItemViewProps {
  params: { itemId: string };
  searchParams?: { sourceFolder?: string };
}

export default async function ItemViewPage({
  params,
  searchParams,
}: ItemViewProps) {
  const { itemId } = params;
  const { sourceFolder } = searchParams || {};

  // Fetch current user (ownerId)
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData?.user?.id;
  if (!ownerId) return notFound();

  // Fetch all items for the current user
  // Try to fetch the item by ID (regardless of owner)
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (!item) return notFound();

  // Check permission: owner or shared
  const isOwner = item.owner_id === ownerId;
  let isShared = false;
  if (!isOwner) {
    const shares = await listItemShares(itemId);
    isShared =
      shares.success && shares.users.some((u: any) => u.user_id === ownerId);
  }
  if (!isOwner && !isShared) return notFound();

  // Fetch all folders for the current user
  const folders: Folder[] = await listFolders(ownerId);

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
              href={`/folders/${backTarget}`}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Folder
            </a>
          ) : (
            <a
              href={"/projects"}
              className="inline-block text-blue-600 hover:underline"
            >
              ← Back to Projects
            </a>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-6">Edit Item</h1>
        <ItemEditForm
          item={item}
          folders={folders}
          projectId={item.project_id || ""}
          sourceFolder={sourceFolder}
        />
      </div>
    </>
  );
}
