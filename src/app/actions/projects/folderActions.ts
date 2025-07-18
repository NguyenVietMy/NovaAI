"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Folder, FolderWithOwner } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new folder (optionally in a project)
export async function createFolder(
  name: string,
  ownerId: string,
  projectId?: string | null,
  color: string = "#e5e7eb"
): Promise<ApiResponse<Folder>> {
  const result = await supabaseAction(
    async () => {
      const supabase = await createClient();
      return await supabase
        .from("folders")
        .insert([
          { project_id: projectId ?? null, name, color, owner_id: ownerId },
        ])
        .select()
        .single();
    },
    projectId ? `/projects/${projectId}` : "/folders"
  );
  return {
    ...result,
    data: result.data ?? undefined,
  };
}

// List folders by context (global or project)
export async function listFolders(
  ownerId: string,
  projectId?: string | null
): Promise<FolderWithOwner[]> {
  const supabase = await createClient();
  let query = supabase
    .from("folders")
    .select("*, users:owner_id(name, email)")
    .eq("owner_id", ownerId);
  if (projectId !== undefined) {
    if (projectId === null) {
      query = query.is("project_id", null);
    } else {
      query = query.eq("project_id", projectId);
    }
  }
  query = query.order("created_at", { ascending: false });
  const { data } = await query;
  return data || [];
}

// Rename a folder
export async function renameFolder(
  folderId: string,
  newName: string,
  ownerId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .update({ name: newName })
      .eq("id", folderId)
      .eq("owner_id", ownerId);
  }, "/folders");
  return {
    ...result,
    data: undefined,
  };
}

// Change folder color
export async function updateFolderColor(
  folderId: string,
  color: string,
  ownerId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .update({ color })
      .eq("id", folderId)
      .eq("owner_id", ownerId);
  }, "/folders");
  return {
    ...result,
    data: undefined,
  };
}

// Delete a folder (items will have folder_id set to null)
export async function deleteFolder(
  folderId: string,
  ownerId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("owner_id", ownerId);
  }, "/folders");
  return {
    ...result,
    data: undefined,
  };
}

// --- Folder Sharing Actions ---

// Share a folder with a user by email
export async function shareFolder(
  folderId: string,
  userEmail: string,
  permission: string = "view"
) {
  const supabase = await createClient();
  // Look up user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .ilike("email", userEmail.trim())
    .single();
  if (userError || !user) {
    return { success: false, error: "User not found" };
  }
  // Insert into folder_shares
  const { error } = await supabase
    .from("folder_shares")
    .insert([{ folder_id: folderId, user_id: user.id, permission }]);
  if (error) {
    return { success: false, error: error.message };
  }

  // --- Share all items in the folder (optimized) ---
  // 1. Get all item IDs in the folder
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id")
    .eq("folder_id", folderId);

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  if (!items || items.length === 0) {
    return { success: true, message: "No items to share." };
  }

  // 2. Prepare item IDs list
  const itemIds = items.map((item) => item.id);

  // 3. Get already shared items for this user (single query)
  const { data: sharedItems, error: sharedError } = await supabase
    .from("item_shares")
    .select("item_id")
    .in("item_id", itemIds)
    .eq("user_id", user.id);

  if (sharedError) {
    return { success: false, error: sharedError.message };
  }

  const alreadySharedIds = new Set(sharedItems.map((s) => s.item_id));

  // 4. Determine which items still need to be shared
  const itemsToShare = itemIds.filter((id) => !alreadySharedIds.has(id));

  if (itemsToShare.length === 0) {
    return { success: true, message: "All items already shared." };
  }

  // 5. Insert sharing records in bulk
  const inserts = itemsToShare.map((id) => ({
    item_id: id,
    user_id: user.id,
    permission,
  }));

  const { error: insertError } = await supabase
    .from("item_shares")
    .insert(inserts);

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, message: `${itemsToShare.length} items shared.` };
}

// Unshare a folder with a user
export async function unshareFolder(folderId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("folder_shares")
    .delete()
    .eq("folder_id", folderId)
    .eq("user_id", userId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// List all users a folder is shared with
export async function listFolderShares(folderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folder_shares")
    .select("user_id, permission, users(name, email)")
    .eq("folder_id", folderId);
  if (error) {
    return { success: false, error: error.message, users: [] };
  }
  // Map to a friendlier format
  const users = (data || []).map((row: any) => ({
    user_id: row.user_id,
    permission: row.permission,
    name: row.users?.name,
    email: row.users?.email,
  }));
  return { success: true, users };
}

// Fetch a folder by its ID (with owner info)
export async function getFolderById(
  folderId: string
): Promise<FolderWithOwner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*, users:owner_id(name, email)")
    .eq("id", folderId)
    .single();
  if (error || !data) return null;
  return data;
}

// List all global folders owned by or shared with the user
export async function listOwnedAndSharedFolders(
  userId: string
): Promise<FolderWithOwner[]> {
  const supabase = await createClient();
  // 1. Get all folder_ids shared with the user
  const { data: sharedRows } = await supabase
    .from("folder_shares")
    .select("folder_id")
    .eq("user_id", userId);
  const sharedFolderIds = (sharedRows || []).map((row: any) => row.folder_id);

  // 2. Fetch all global folders owned by the user
  let ownedQuery = supabase
    .from("folders")
    .select("*, users:owner_id(name, email)")
    .is("project_id", null)
    .eq("owner_id", userId);
  const { data: ownedFolders } = await ownedQuery;

  // 3. Fetch all shared folders (regardless of project_id)
  let sharedFolders: FolderWithOwner[] = [];
  if (sharedFolderIds.length > 0) {
    const sharedQuery = supabase
      .from("folders")
      .select("*, users:owner_id(name, email)")
      .in("id", sharedFolderIds);
    const { data: sharedData } = await sharedQuery;
    sharedFolders = sharedData || [];
  }

  // 4. Merge and dedupe by id
  const allFolders = [...(ownedFolders || []), ...sharedFolders];
  const deduped = allFolders.filter(
    (folder, idx, arr) => arr.findIndex((f) => f.id === folder.id) === idx
  );
  return deduped;
}
