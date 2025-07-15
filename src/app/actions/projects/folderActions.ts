"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Folder, FolderWithOwner } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new folder in a project
export async function createFolder(
  projectId: string,
  name: string,
  color: string = "#e5e7eb"
): Promise<ApiResponse<Folder>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const owner_id = userData?.user?.id;
    if (!owner_id) throw new Error("User not authenticated");
    return await supabase
      .from("folders")
      .insert([{ project_id: projectId, name, color, owner_id }])
      .select()
      .single();
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: result.data ?? undefined,
  };
}

// List all folders in a project
export async function listFolders(
  projectId: string
): Promise<FolderWithOwner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("folders")
    .select("*, users:owner_id(name, email)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Rename a folder
export async function renameFolder(
  folderId: string,
  newName: string,
  projectId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .update({ name: newName })
      .eq("id", folderId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: undefined,
  };
}

// Change folder color
export async function updateFolderColor(
  folderId: string,
  color: string,
  projectId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .update({ color })
      .eq("id", folderId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: undefined,
  };
}

// Delete a folder (items will have folder_id set to null)
export async function deleteFolder(
  folderId: string,
  projectId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("project_id", projectId);
  }, `/projects/${projectId}`);
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
  return { success: true };
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
