import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/src/supabase";
import { userService } from "@/src/services/userService";
import { User } from "@/src/types";
import { JURY_EMAILS } from "@/src/constants";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isJury: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read session directly from localStorage — avoids supabase.auth.getSession() which hangs in this project
    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const ref = url.replace('https://', '').split('.')[0];
      const stored = localStorage.getItem(`sb-${ref}-auth-token`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sUser = parsed?.user ?? null;
        if (sUser) {
          setSupabaseUser(sUser as SupabaseUser);
          setUser({
            uid: sUser.id,
            email: sUser.email || "",
            displayName: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || "User",
            role: "user",
          } as User);
        }
      }
    } catch (e) {
      console.warn("Could not read session from localStorage:", e);
    }
    setLoading(false);

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sUser = session?.user ?? null;
      setSupabaseUser(sUser);
      if (sUser) {
        try {
          const profile = await userService.ensureUserProfile(sUser);
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              uid: sUser.id,
              email: sUser.email || "",
              displayName: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || "User",
              role: "user"
            } as User);
          }
        } catch (err) {
          console.error("Profile loading failed:", err);
          setUser({
            uid: sUser.id,
            email: sUser.email || "",
            displayName: sUser.user_metadata?.full_name || sUser.email?.split('@')[0] || "User",
            role: "user"
          } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = user?.role === "admin" || supabaseUser?.email === "pipicorgisketch@gmail.com";
  const isJury = isAdmin || (!!supabaseUser?.email && JURY_EMAILS.includes(supabaseUser.email));

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, isAdmin, isJury }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
