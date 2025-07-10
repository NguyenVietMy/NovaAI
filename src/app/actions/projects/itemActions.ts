"use server";
import { createClient } from "../../../../supabase/server";
import { revalidatePath } from "next/cache";

// Types
export interface Item {
  id: string;
  project_id: string;
  folder_id: string | null;
  type: string;
  name: string;
  data: any;
  created_at: string;
}

// Create a new item (optionally in a folder)
export async function createItem(
  projectId: string,
  name: string,
  type: string,
  data: any,
  folderId?: string | null
): Promise<{ success: boolean; item?: Item; error?: string }> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("items")
    .insert([
      {
        project_id: projectId,
        folder_id: folderId || null,
        type,
        name,
        data,
      },
    ])
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true, item: result };
}

// List all items in a project (optionally filter by folder or type)
export async function listItems(
  projectId: string,
  folderId?: string | null,
  type?: string
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", itemId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// Delete an item
export async function deleteItem(
  itemId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// Move an item to a different folder (or to uncategorized)
export async function moveItem(
  itemId: string,
  projectId: string,
  folderId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ folder_id: folderId })
    .eq("id", itemId)
    .eq("project_id", projectId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
