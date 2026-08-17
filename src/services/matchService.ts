import { supabase } from "@/integrations/supabase";

export async function listMatches(userId?: string) {
  let query = supabase.from("matches").select("*");

  if (userId) {
    query = query.or(`user_id.eq.${userId},other_user_id.eq.${userId}`);
  }

  return query.order("created_at", { ascending: false });
}

export async function createMatch(payload: Record<string, unknown>) {
  return supabase.from("matches").insert(payload);
}
