import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import type { DeclarationType, Profile } from "@/types/database";

interface AuthState {
  user: User | null;
  userProfile: Profile | null;
  userStatus: DeclarationType | null;
  isAdmin: boolean;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  userProfile: null,
  userStatus: null,
  isAdmin: false,
  session: null,
  loading: true,
  signOut: async () => {},
  logout: async () => {},
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userStatus, setUserStatus] = useState<DeclarationType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Profil citoyen éventuellement mis en cache par la page d'identification
    try {
      const cached = sessionStorage.getItem("citizen_profile");
      if (cached) {
        const profile = JSON.parse(cached) as Profile;
        setUserProfile(profile);
        setUserStatus((profile.status as DeclarationType | null) ?? null);
        setIsAdmin(Boolean(profile.is_admin));
      }
    } catch {
      // cache illisible : on ignore
    }

    const applyUserProfile = async (userId: string | undefined) => {
      if (!userId) {
        setUserProfile(null);
        setUserStatus(null);
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, telephone, phone, status, auth_code, is_admin, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return;
      }

      const profile = data as Profile;
      setUserProfile(profile);
      setUserStatus((profile.status as DeclarationType | null) ?? null);
      setIsAdmin(Boolean(profile.is_admin));
      try {
        sessionStorage.setItem("citizen_profile", JSON.stringify(profile));
      } catch {
        // stockage indisponible : on ignore
      }
    };

    const handleSession = async (nextSession: Session | null) => {
      setSession(nextSession);
      try {
        if (nextSession?.user) {
          await applyUserProfile(nextSession.user.id);
        }
      } finally {
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data }) => handleSession(data.session))
      .catch(() => setLoading(false));

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setUserProfile(null);
    setUserStatus(null);
    setIsAdmin(false);
    try {
      sessionStorage.removeItem("citizen_profile");
    } catch {
      // stockage indisponible : on ignore
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        userProfile,
        userStatus,
        isAdmin,
        session,
        loading,
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

