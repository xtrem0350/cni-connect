import { supabase } from "@/integrations/supabase";
import type { DeclarationType } from "@/types/database";

export async function sendOTP(phone: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function verifyOTP(phone: string, code: string, declarationType?: DeclarationType) {
  try {
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message ?? "Code OTP invalide" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authData.user.id,
          telephone: phone,
          phone,
          status: declarationType ?? null,
          is_admin: false,
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, user: authData.user, profile };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function signInWithOTP(phone: string, token: string) {
  return supabase.auth.verifyOtp({ phone, token, type: "sms" });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, telephone, phone, status, is_admin, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  return { data, error };
}

export const verifyAuthCode = async (phone: string, code: string) => {
  const { data: authData, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });

  if (error || !authData.user) {
    throw new Error(error?.message ?? "Code incorrect");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("telephone", phone)
    .or(`phone.eq.${phone}`)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("profiles")
      .update({ telephone: phone, phone, status: null })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("profiles")
      .insert({ id: authData.user.id, telephone: phone, phone, status: null, is_admin: false });
  }

  return authData.user;
};
