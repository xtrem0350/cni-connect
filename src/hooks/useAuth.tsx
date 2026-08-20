import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import type { DeclarationType, Profile } from "@/types/database";

interface AuthState {
  user: User | null;
  userId: string | null;
  userProfile: Profile | null;
  userStatus: DeclarationType | null;
  isAdmin: boolean;
  session: Session | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  userId: null,
  userProfile: null,
  userStatus: null,
  isAdmin: false,
  session: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
  logout: async () => {},
});

const PROFILE_COLUMNS = "id, nom, telephone, phone, status, auth_code, is_admin, created_at, updated_at";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = (profile: Profile | null) => {
    setUserProfile(profile);
    try {
      if (profile) {
        sessionStorage.setItem("citizen_profile", JSON.stringify(profile));
        if (profile.phone) sessionStorage.setItem("user_phone", profile.phone);
      }
    } catch {
      // stockage indisponible : on ignore
    }
  };

  const fetchProfileByPhone = async (phone: string) => {
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("phone", phone)
      .maybeSingle();
    if (data) applyProfile(data as Profile);
  };

  const fetchProfileById = async (id: string) => {
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
    if (data) applyProfile(data as Profile);
  };

  const refreshProfile = async () => {
    try {
      const phone = sessionStorage.getItem("user_phone");
      if (phone) await fetchProfileByPhone(phone);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let cancelled = false;

    // 1) Profil éventuellement mis en cache par la page d'identification
    let cachedPhone: string | null = null;
    try {
      const cached = sessionStorage.getItem("citizen_profile");
      if (cached) {
        const profile = JSON.parse(cached) as Profile;
        setUserProfile(profile);
      }
      cachedPhone = sessionStorage.getItem("user_phone");
    } catch {
      // cache illisible : on ignore
    }

    // 2) Session Supabase Auth (optionnelle)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) void fetchProfileById(nextSession.user.id);
    });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session ?? null);
        if (data.session?.user) {
          await fetchProfileById(data.session.user.id);
        } else if (cachedPhone) {
          await fetchProfileByPhone(cachedPhone);
        }
      } catch {
        // hors ligne / erreur réseau : on garde le cache
      } finally {
        // On ne bloque JAMAIS l'interface sur « Chargement… »
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setUserProfile(null);
    setSession(null);
    try {
      sessionStorage.removeItem("citizen_profile");
      sessionStorage.removeItem("user_phone");
    } catch {
      // stockage indisponible : on ignore
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // pas de session Supabase Auth : on ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        userId: session?.user?.id ?? userProfile?.id ?? null,
        userProfile,
        userStatus: (userProfile?.status as DeclarationType | null) ?? null,
        isAdmin: Boolean(userProfile?.is_admin),
        session,
        loading,
        refreshProfile,
        signOut: handleSignOut,
        logout: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
