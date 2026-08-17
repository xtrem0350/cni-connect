import { supabase } from "@/integrations/supabase";

export type DeclarationStatus = "active" | "matched" | "returned" | "inactive";

export async function listDeclarations(userId?: string) {
  let query = supabase.from("declarations").select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.order("created_at", { ascending: false });
}

export async function createDeclaration(payload: Record<string, unknown>) {
  return supabase.from("declarations").insert(payload);
}

export async function updateDeclaration(id: string, payload: Record<string, unknown>) {
  return supabase.from("declarations").update(payload).eq("id", id);
}
