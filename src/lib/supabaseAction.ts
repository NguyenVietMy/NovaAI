export async function supabaseAction<T>(
  fn: () => Promise<{ data: T; error: any }>,
  revalidate?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { data, error } = await fn();
    if (error) return { success: false, error: error.message || String(error) };
    if (revalidate) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath(revalidate);
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}
