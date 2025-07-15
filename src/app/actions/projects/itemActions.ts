"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Item, ItemType } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new item (optionally in a folder)
export async function createItem(
  projectId: string,
  name: string,
  type: ItemType,
  data: any,
  folderId?: string | null
): Promise<ApiResponse<Item>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const owner_id = userData?.user?.id;
    if (!owner_id) throw new Error("User not authenticated");
    return await supabase
      .from("items")
      .insert([
        {
          project_id: projectId,
          folder_id: folderId || null,
          type,
          name,
          data,
          owner_id,
        },
      ])
      .select()
      .single();
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: result.data ?? undefined,
  };
}

// List all items in a project (optionally filter by folder or type)
export async function listItems(
  projectId: string,
  folderId?: string | null,
  type?: ItemType
): Promise<Item[]> {
  const supabase = await createClient();
  let query = supabase.from("items").select("*").eq("project_id", projectId);
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

// Update an item (name, data, type)
export async function updateItem(
  itemId: string,
  projectId: string,
  updates: Partial<Pick<Item, "name" | "data" | "type" | "folder_id">>
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("items")
      .update(updates)
      .eq("id", itemId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: undefined,
  };
}

// Delete an item
export async function deleteItem(
  itemId: string,
  projectId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("items")
      .delete()
      .eq("id", itemId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: undefined,
  };
}

// Move an item to a different folder (or to uncategorized)
export async function moveItem(
  itemId: string,
  projectId: string,
  folderId: string | null
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("items")
      .update({ folder_id: folderId })
      .eq("id", itemId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: undefined,
  };
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
