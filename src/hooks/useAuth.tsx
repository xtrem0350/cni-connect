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
}

const AuthContext = createContext<AuthState>({
  user: null,
  userProfile: null,
  userStatus: null,
  isAdmin: false,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userStatus, setUserStatus] = useState<DeclarationType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyUserProfile = async (userId: string | undefined) => {
      if (!userId) {
        setUserProfile(null);
        setUserStatus(null);
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        setUserProfile(null);
        setUserStatus(null);
        setIsAdmin(false);
        return;
      }

      const profile = data as Profile;
      setUserProfile(profile);
      setUserStatus((profile.status as DeclarationType | null) ?? null);
      setIsAdmin(Boolean(profile.is_admin));
    };

    const handleSession = async (nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await applyUserProfile(nextSession.user.id);
      } else {
        setUserProfile(null);
        setUserStatus(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => {
      void handleSession(data.session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        userProfile,
        userStatus,
        isAdmin,
        session,
        loading,
        signOut: async () => {
          setUserProfile(null);
          setUserStatus(null);
          setIsAdmin(false);
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
