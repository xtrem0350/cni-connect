import { supabase } from "@/integrations/supabase";

export type DeclarationStatus = "active" | "matched" | "returned" | "inactive";

export async function listDeclarations(userId?: string) {
  let query = supabase.from("declarations").select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.order("created_at", { ascending: false });
}

export async function getDeclarationById(id: string, userId?: string) {
  let query = supabase.from("declarations").select("*").eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  return query.maybeSingle();
}

export async function createDeclaration(payload: Record<string, unknown>) {
  return supabase.from("declarations").insert(payload).select().single();
}

export async function updateDeclaration(id: string, payload: Record<string, unknown>) {
  return supabase.from("declarations").update(payload).eq("id", id).select().single();
}
