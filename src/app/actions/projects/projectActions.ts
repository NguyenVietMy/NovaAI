"use server";
import { createClient } from "../../../../supabase/server";
import { revalidatePath } from "next/cache";

// Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Create a new project for the current user
export async function createProject(
  userId: string,
  name: string
): Promise<{ success: boolean; project?: Project; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert([{ user_id: userId, name }])
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/projects");
  return { success: true, project: data };
}

// List all projects for the current user
export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// Rename a project
export async function renameProject(
  projectId: string,
  newName: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name: newName })
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

// Delete a project (and cascade delete folders/items via DB constraints)
export async function deleteProject(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/projects");
  return { success: true };
}
