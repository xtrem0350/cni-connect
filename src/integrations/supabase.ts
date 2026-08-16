import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase du projet "Retrouve CNI 2026".
 * La clé publishable est publique par conception : la sécurité repose sur les
 * politiques RLS définies dans supabase/schema.sql.
 */
const SUPABASE_URL = "https://xpbgvjebnulugeisonju.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ume-LM9UWQUiELQ7FUK-RA_QTtwEEzr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
