"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Folder } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new folder in a project
export async function createFolder(
  projectId: string,
  name: string,
  color: string = "#e5e7eb"
): Promise<ApiResponse<Folder>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("folders")
      .insert([{ project_id: projectId, name, color }])
      .select()
      .single();
  }, `/projects/${projectId}`);
  return {
    ...result,
    data: result.data ?? undefined,
  };
}

// List all folders in a project
export async function listFolders(projectId: string): Promise<Folder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("folders")
    .select("*")
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
