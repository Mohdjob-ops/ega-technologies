import { supabase } from "./supabase";

export type AdminVerification = {
  isAdmin: boolean;
  email: string;
  userId: string;
  error?: string;
};

export async function verifyAdminSession(): Promise<AdminVerification> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      isAdmin: false,
      email: "",
      userId: "",
      error: sessionError.message,
    };
  }

  if (!session?.user) {
    return {
      isAdmin: false,
      email: "",
      userId: "",
      error: "No active admin session.",
    };
  }

  return verifyAdminUser(
    session.user.id,
    session.user.email || ""
  );
}

export async function verifyAdminUser(
  userId: string,
  email = ""
): Promise<AdminVerification> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return {
      isAdmin: false,
      email,
      userId,
      error: error?.message || "This UID is not authorized as an administrator.",
    };
  }

  return {
    isAdmin: true,
    email: email || data.email || "",
    userId,
  };
}
