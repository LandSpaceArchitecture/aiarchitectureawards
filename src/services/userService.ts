import { supabase } from "@/src/supabase";
import { User } from "@/src/types";

const USERS_TABLE = "profiles"; // Supabase often uses 'profiles' for user data

export const userService = {
  async ensureUserProfile(supabaseUser: any) {
    if (!supabaseUser) return null;

    try {
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .select("*")
        .eq("uid", supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') { // Row not found
        const newUser: User = {
          uid: supabaseUser.id,
          email: supabaseUser.email || "",
          displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || "User",
          role: "user",
        };
        const { error: insertError } = await supabase
          .from(USERS_TABLE)
          .insert([newUser]);
        
        if (insertError) throw insertError;
        return newUser;
      } else if (error) {
        throw error;
      }
      return data as User;
    } catch (error) {
      console.error('Supabase Error in ensureUserProfile:', error);
      return null;
    }
  },

  async getUserProfile(uid: string) {
    try {
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .select("*")
        .eq("uid", uid)
        .single();
      
      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Supabase Error in getUserProfile:', error);
      return null;
    }
  }
};
