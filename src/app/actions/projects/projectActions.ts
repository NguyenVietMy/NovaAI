"use server";
import { createClient } from "../../../../supabase/server";
import { supabaseAction } from "@/lib/supabaseAction";
import type { Project } from "@/types/supabase";
import type { ApiResponse } from "@/types/api";

// Create a new project for the current user
export async function createProject(
  userId: string,
  name: string
): Promise<ApiResponse<Project>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("projects")
      .insert([{ user_id: userId, name }])
      .select()
      .single();
  }, "/projects");
  return {
    ...result,
    data: result.data ?? undefined,
  };
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
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("projects")
      .update({ name: newName })
      .eq("id", projectId)
      .eq("user_id", userId);
  }, "/projects");
  return {
    ...result,
    data: undefined,
  };
}

// Delete a project (and cascade delete folders/items via DB constraints)
export async function deleteProject(
  projectId: string,
  userId: string
): Promise<ApiResponse<null>> {
  const result = await supabaseAction(async () => {
    const supabase = await createClient();
    return await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId);
  }, "/projects");
  return {
    ...result,
    data: undefined,
  };
}
