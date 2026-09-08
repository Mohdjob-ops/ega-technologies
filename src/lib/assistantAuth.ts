import { supabase } from "./supabase";

export async function verifyAssistantUser(userId: string, email = "") {
  const { data, error } = await supabase
    .from("assistant_users")
    .select("user_id, full_name, email, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return {
      isAssistant: false,
      email,
      fullName: "",
      userId,
      error: error?.message || "This account is not authorized as an EGA assistant.",
    };
  }

  return {
    isAssistant: true,
    email: email || data.email || "",
    fullName: data.full_name || "",
    userId,
  };
}
