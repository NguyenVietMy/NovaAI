"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Item, ItemType } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new item (optionally in a project or folder)
export async function createItem(
  name: string,
  type: ItemType,
  data: any,
  ownerId: string,
  projectId?: string | null,
  folderId?: string | null
): Promise<ApiResponse<Item>> {
  const result = await supabaseAction(
    async () => {
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.getUser();
      const owner_id = userData?.user?.id;
      if (!owner_id) throw new Error("User not authenticated");

      // Create the item
      const { data: newItem, error: insertError } = await supabase
        .from("items")
        .insert([
          {
            project_id: projectId ?? null,
            folder_id: folderId ?? null,
            type,
            name,
            data,
            owner_id: ownerId,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!newItem) {
        throw new Error("Failed to create item");
      }

      // Auto-share the new item with users who have access to the parent folder
      if (folderId) {
        try {
          // Get the folder owner
          const { data: folderData, error: folderError } = await supabase
            .from("folders")
            .select("owner_id")
            .eq("id", folderId)
            .single();

          if (!folderError && folderData) {
            const folderOwnerId = folderData.owner_id;
            const isItemOwnerAlsoFolderOwner = ownerId === folderOwnerId;

            // Get all users who have access to this folder (not including owner)
            const { data: folderShares, error: sharesError } = await supabase
              .from("folder_shares")
              .select("user_id, permission")
              .eq("folder_id", folderId);

            if (!sharesError) {
              const itemShares = [];

              // If the item creator is NOT the folder owner, share with the folder owner
              if (!isItemOwnerAlsoFolderOwner && folderOwnerId) {
                itemShares.push({
                  item_id: newItem.id,
                  user_id: folderOwnerId,
                  permission: "view", // Default permission for folder owner
                });
              }

              // Share with all other users who have access to the folder
              if (folderShares && folderShares.length > 0) {
                folderShares.forEach((share) => {
                  // Don't duplicate if we already added the folder owner
                  if (
                    share.user_id !== folderOwnerId ||
                    isItemOwnerAlsoFolderOwner
                  ) {
                    itemShares.push({
                      item_id: newItem.id,
                      user_id: share.user_id,
                      permission: share.permission,
                    });
                  }
                });
              }

              // Insert item shares in bulk if there are any
              if (itemShares.length > 0) {
                const { error: shareInsertError } = await supabase
                  .from("item_shares")
                  .insert(itemShares);

                if (shareInsertError) {
                  console.error(
                    "Failed to auto-share item with folder users:",
                    shareInsertError
                  );
                  // Don't throw error here - item creation succeeded, sharing is secondary
                }
              }
            }
          }
        } catch (shareError) {
          console.error("Error in auto-sharing logic:", shareError);
          // Don't throw error here - item creation succeeded, sharing is secondary
        }
      }

      return { data: newItem, error: null };
    },
    projectId ? `/projects/${projectId}` : "/items"
  );
  return {
    ...result,
    data: result.data ?? undefined,
  };
}

// List items by context (global, project, or folder)
export async function listItems(
  ownerId: string,
  projectId?: string | null,
  folderId?: string | null,
  type?: ItemType
): Promise<Item[]> {
  const supabase = await createClient();
  let query = supabase.from("items").select("*").eq("owner_id", ownerId);
  if (projectId !== undefined) {
    if (projectId === null) {
      query = query.is("project_id", null);
    } else {
      query = query.eq("project_id", projectId);
    }
  }
  if (folderId !== undefined) {
    if (folderId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", folderId);
    }
  }
  if (type) {
    query = query.eq("type", type);
  }
  query = query.order("created_at", { ascending: false });
  const { data } = await query;
  return data || [];
}

// Update an item (name, data, type, folder, project)
export async function updateItem(
  itemId: string,
  ownerId: string,
  updates: Partial<
    Pick<Item, "name" | "data" | "type" | "folder_id" | "project_id">
  >
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("items")
      .update(updates)
      .eq("id", itemId)
      .eq("owner_id", ownerId);
  }, "/items");
  return {
    ...result,
    data: undefined,
  };
}

// Delete an item
export async function deleteItem(
  itemId: string,
  ownerId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("items")
      .delete()
      .eq("id", itemId)
      .eq("owner_id", ownerId);
  }, "/items");
  return {
    ...result,
    data: undefined,
  };
}

// Move an item to a different project/folder/global
export async function moveItem(
  itemId: string,
  ownerId: string,
  newProjectId?: string | null,
  newFolderId?: string | null
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(
    async () => {
      const supabase = await createClient();
      return await supabase
        .from("items")
        .update({
          project_id: newProjectId ?? null,
          folder_id: newFolderId ?? null,
        })
        .eq("id", itemId)
        .eq("owner_id", ownerId);
    },
    newProjectId ? `/projects/${newProjectId}` : "/items"
  );
  return {
    ...result,
    data: undefined,
  };
}

// List items owned by or shared with the user (optionally filtered by project or folder)
export async function listOwnedAndSharedItems(
  userId: string,
  projectId?: string | null,
  folderId?: string | null,
  type?: ItemType
): Promise<Item[]> {
  const supabase = await createClient();
  // 1. Get all item_ids shared with the user
  const { data: sharedRows } = await supabase
    .from("item_shares")
    .select("item_id")
    .eq("user_id", userId);
  const sharedItemIds = (sharedRows || []).map((row: any) => row.item_id);

  // 2. Fetch all items owned by the user (with filters)
  let ownedQuery = supabase.from("items").select("*").eq("owner_id", userId);
  if (projectId !== undefined) {
    if (projectId === null) {
      ownedQuery = ownedQuery.is("project_id", null);
    } else {
      ownedQuery = ownedQuery.eq("project_id", projectId);
    }
  }
  if (folderId !== undefined) {
    if (folderId === null) {
      ownedQuery = ownedQuery.is("folder_id", null);
    } else {
      ownedQuery = ownedQuery.eq("folder_id", folderId);
    }
  }
  if (type) {
    ownedQuery = ownedQuery.eq("type", type);
  }
  ownedQuery = ownedQuery.order("created_at", { ascending: false });
  const { data: ownedItems } = await ownedQuery;

  // 3. Fetch all shared items (with filters)
  let sharedItems: Item[] = [];
  if (sharedItemIds.length > 0) {
    let sharedQuery = supabase
      .from("items")
      .select("*")
      .in("id", sharedItemIds);
    if (projectId !== undefined) {
      if (projectId === null) {
        sharedQuery = sharedQuery.is("project_id", null);
      } else {
        sharedQuery = sharedQuery.eq("project_id", projectId);
      }
    }
    if (folderId !== undefined) {
      if (folderId === null) {
        sharedQuery = sharedQuery.is("folder_id", null);
      } else {
        sharedQuery = sharedQuery.eq("folder_id", folderId);
      }
    }
    if (type) {
      sharedQuery = sharedQuery.eq("type", type);
    }
    sharedQuery = sharedQuery.order("created_at", { ascending: false });
    const { data: sharedData } = await sharedQuery;
    sharedItems = sharedData || [];
  }

  // 4. Merge and dedupe by id
  const allItems = [...(ownedItems || []), ...sharedItems];
  const deduped = allItems.filter(
    (item, idx, arr) => arr.findIndex((i) => i.id === item.id) === idx
  );
  return deduped;
}

// --- Item Sharing Actions ---

// Share an item with a user by email
export async function shareItem(
  itemId: string,
  userEmail: string,
  permission: string = "view"
) {
  const supabase = await createClient();
  // Look up user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", userEmail)
    .single();
  if (userError || !user) {
    return { success: false, error: "User not found" };
  }
  // Insert into item_shares
  const { error } = await supabase
    .from("item_shares")
    .insert([{ item_id: itemId, user_id: user.id, permission }]);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Unshare an item with a user
export async function unshareItem(itemId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("item_shares")
    .delete()
    .eq("item_id", itemId)
    .eq("user_id", userId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// List all users an item is shared with
export async function listItemShares(itemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_shares")
    .select("user_id, permission, users(name, email)")
    .eq("item_id", itemId);
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
