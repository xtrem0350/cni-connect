import { supabase } from "@/integrations/supabase";
import type { DeclarationType } from "@/types/database";

/**
 * Envoie un code OTP au numéro WhatsApp fourni
 * Génère un code 6 chiffres et l'envoie par SMS
 */
export async function sendOTP(phone: string) {
  try {
    // Appel à la fonction RPC Supabase pour envoyer l'OTP
    const { data, error } = await supabase.rpc("send_otp_sms", {
      phone_number: phone,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, code: data?.code };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Vérifie le code OTP et connecte l'utilisateur
 * Crée un profil utilisateur s'il n'existe pas
 */
export async function verifyOTP(phone: string, code: string, declarationType?: DeclarationType) {
  try {
    // Vérifier le code OTP via RPC
    const { data: verifyData, error: verifyError } = await supabase.rpc("verify_otp_sms", {
      phone_number: phone,
      otp_code: code,
    });

    if (verifyError || !verifyData?.valid) {
      return { success: false, error: "Code OTP invalide" };
    }

    // Récupérer ou créer le profil utilisateur
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: "Authentification échouée" };
    }

    // Créer ou mettre à jour le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.user.id,
        phone: phone,
        status: declarationType || null,
        is_admin: false,
      })
      .select()
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, user, profile };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Connexion avec WhatsApp + OTP (alternative simple)
 */
export async function signInWithOTP(phone: string, token: string) {
  return supabase.auth.signInWithOtp({ phone, token, type: "sms" });
}

/**
 * Déconnexion
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Récupère l'utilisateur actuel
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

/**
 * Récupère le profil utilisateur
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
}

export const verifyAuthCode = async (phone: string, code: string) => {
  const storedCode = sessionStorage.getItem("auth_code");
  const storedPhone = sessionStorage.getItem("auth_phone");
  const storedStatus = sessionStorage.getItem("auth_status");

  if (phone !== storedPhone) throw new Error("Téléphone incorrect");
  if (code !== storedCode) throw new Error("Code incorrect");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("profiles")
      .update({ status: storedStatus, auth_code: code })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("profiles")
      .insert({ phone, status: storedStatus, auth_code: code });
  }

  sessionStorage.clear();
};
