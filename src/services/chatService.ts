import { supabase } from "@/integrations/supabase";

export async function generateMatchCode(matchId: string, userId: string, code: string) {
  return supabase.from("match_codes").insert({ match_id: matchId, user_id: userId, code });
}

export async function validateMatchCode(matchId: string, userId: string, code: string) {
  return supabase
    .from("match_codes")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .eq("code", code)
    .maybeSingle();
}

export async function listMessages(matchId: string) {
  return supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
}
