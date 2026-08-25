import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase";
import type { DeclarationType, Profile } from "@/types/database";

export type CitizenUser = {
  id: string;
  phone: string;
};

interface AuthState {
  user: CitizenUser | null;
  userId: string | null;
  userProfile: Profile | null;
  userStatus: DeclarationType | null;
  isAdmin: boolean;
  session: null;
  loading: boolean;
  needsAuth: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  userId: null,
  userProfile: null,
  userStatus: null,
  isAdmin: false,
  session: null,
  loading: true,
  needsAuth: false,
  signOut: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CitizenUser | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userStatus, setUserStatus] = useState<DeclarationType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  const refreshProfile = async () => {
    console.log("🚀 [useAuth] DEBUT refreshProfile");
    console.log("🔍 [useAuth] Vérification sessionStorage...");
    const phone = window.sessionStorage.getItem("user_phone");
    console.log("📞 [useAuth] phone depuis sessionStorage:", phone);
    if (!phone) {
      console.log("❌ [useAuth] PAS DE PHONE -> loading=false, userProfile=null");
      setUser(null);
      setUserProfile(null);
      setUserStatus(null);
      setIsAdmin(false);
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    setNeedsAuth(false);
    console.log("📡 [useAuth] Requête Supabase pour phone:", phone);

    let { data, error } = await supabase
      .from("profiles")
      .select(
        "id, nom, telephone, phone, status, auth_code, citizen_code, is_admin, created_at, updated_at",
      )
      .eq("phone", phone)
      .maybeSingle();

    if (error?.code === "PGRST204") {
      console.warn(
        "⚠️ [useAuth] Colonnes nom/telephone absentes, nouvelle tentative avec le schéma historique",
      );
      const fallback = await supabase
        .from("profiles")
        .select("id, phone, status, auth_code, citizen_code, is_admin, created_at, updated_at")
        .eq("phone", phone)
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    console.log("📦 [useAuth] Réponse Supabase:", { data, error });

    if (error) {
      console.error("❌ [useAuth] Erreur Supabase:", error);
    }

    if (error || !data) {
      if (!error) console.log("⚠️ [useAuth] Aucun profil trouvé");
      setUser(null);
      setUserProfile(null);
      setUserStatus(null);
      setIsAdmin(false);
      setNeedsAuth(true);
      setLoading(false);
      console.log("🏁 [useAuth] Fin chargement, loading = false");
      return;
    }

    const profile = data as Profile;
    console.log("✅ [useAuth] Profil chargé:", profile);
    console.log("📋 [useAuth] Structure complète du profil:", {
      ...profile,
      hasNom: Boolean(profile.nom),
      hasTelephone: Boolean(profile.telephone),
      phoneValue: profile.phone,
    });
    const profileToStore: Profile = {
      ...profile,
      nom: profile.nom ?? "",
      telephone: profile.telephone ?? profile.phone,
    };
    const displayPhone = profileToStore.telephone ?? profileToStore.phone ?? phone;
    console.log("📞 [useAuth] Téléphone affiché:", displayPhone);
    setUserProfile(profileToStore);
    setUser({ id: profile.id, phone: profile.phone ?? phone });
    setUserStatus((profile.status as DeclarationType | null) ?? null);
    setIsAdmin(Boolean(profile.is_admin));
    setNeedsAuth(false);
    window.sessionStorage.setItem("citizen_profile", JSON.stringify(profileToStore));
    console.log("💾 [useAuth] citizen_profile sauvegardé");
    setLoading(false);
    console.log("🏁 [useAuth] Fin chargement, loading = false");
  };

  useEffect(() => {
    // Garde-fou : jamais plus de 5 s de "Chargement…"
    const timeoutId = window.setTimeout(() => {
      console.warn("⚠️ [useAuth] Timeout — chargement forcé");
      setLoading(false);
    }, 5000);

    void refreshProfile().finally(() => window.clearTimeout(timeoutId));

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSignOut = async () => {
    window.sessionStorage.removeItem("user_phone");
    window.sessionStorage.removeItem("citizen_profile");
    window.sessionStorage.removeItem("user_status");
    setUser(null);
    setUserProfile(null);
    setUserStatus(null);
    setIsAdmin(false);
    setNeedsAuth(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id ?? null,
        userProfile,
        userStatus,
        isAdmin,
        session: null,
        loading,
        needsAuth,
        signOut: handleSignOut,
        logout: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
