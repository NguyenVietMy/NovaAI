"use server";
import { createClient } from "../../../../supabase/server";
import { revalidatePath } from "next/cache";

// Types
export interface Folder {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

// Create a new folder in a project
export async function createFolder(
  projectId: string,
  name: string,
  color: string = "#e5e7eb"
): Promise<{ success: boolean; folder?: Folder; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .insert([{ project_id: projectId, name, color }])
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true, folder: data };
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("folders")
    .update({ name: newName })
    .eq("id", folderId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// Change folder color
export async function updateFolderColor(
  folderId: string,
  color: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("folders")
    .update({ color })
    .eq("id", folderId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// Delete a folder (items will have folder_id set to null)
export async function deleteFolder(
  folderId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
