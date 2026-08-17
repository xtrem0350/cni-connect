import { supabase } from "@/integrations/supabase";

export async function listMatches(userId?: string) {
  let query = supabase
    .from("matchs")
    .select("*, declaration_perdu:declaration_perdu_id(*), declaration_trouve:declaration_trouve_id(*)");

  if (userId) {
    query = query.or(`declaration_perdu_id.eq.${userId},declaration_trouve_id.eq.${userId}`);
  }

  return query.order("created_at", { ascending: false });
}

export async function createMatch(payload: Record<string, unknown>) {
  return supabase.from("matchs").insert(payload).select().single();
}
