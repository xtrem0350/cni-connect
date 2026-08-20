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

  const refreshProfile = async () => {
    const phone = window.sessionStorage.getItem("user_phone");
    if (!phone) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nom, telephone, phone, status, auth_code, is_admin, created_at, updated_at")
      .eq("phone", phone)
      .maybeSingle();

    if (error || !data) {
      setUser(null);
      setUserProfile(null);
      setUserStatus(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const profile = data as Profile;
    setUserProfile(profile);
    setUser({ id: profile.id, phone: profile.phone ?? phone });
    setUserStatus((profile.status as DeclarationType | null) ?? null);
    setIsAdmin(Boolean(profile.is_admin));
    window.sessionStorage.setItem("citizen_profile", JSON.stringify(profile));
    setLoading(false);
  };

  useEffect(() => {
    void refreshProfile();
  }, []);

  const handleSignOut = async () => {
    window.sessionStorage.removeItem("user_phone");
    window.sessionStorage.removeItem("citizen_profile");
    window.sessionStorage.removeItem("user_status");
    setUser(null);
    setUserProfile(null);
    setUserStatus(null);
    setIsAdmin(false);
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
