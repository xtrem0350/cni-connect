import { supabase } from "@/integrations/supabase";

export async function generateMatchCode(matchId: string, userId: string, code: string) {
  return supabase.from("matchs").update({ code_validation: code }).eq("id", matchId).eq("declaration_perdu_id", userId);
}

export async function validateMatchCode(matchId: string, userId: string, code: string) {
  return supabase
    .from("matchs")
    .select("*")
    .eq("id", matchId)
    .eq("declaration_perdu_id", userId)
    .eq("code_validation", code)
    .maybeSingle();
}

export async function listMessages(matchId: string) {
  return supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
}

export function getChatLocation() {
  // TODO: Implémenter la géolocalisation (navigator.geolocation)
}
