import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking reset link...");
  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let active = true;

    async function openRecoverySessionFromUrl() {
      if (typeof window === "undefined") return false;

      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      if (
        query.get("error_code") === "otp_expired" ||
        query.get("error") ||
        hash.get("error")
      ) {
        setMessage("This reset link expired. Send a fresh password recovery email and open the newest link.");
        return false;
      }

      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("Could not open reset session: " + error.message);
          return false;
        }
        return true;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setMessage("Could not open reset session: " + error.message);
          return false;
        }
        return true;
      }

      return false;
    }

    async function checkRecoverySession() {
      const recoveredFromUrl = await openRecoverySessionFromUrl();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setHasRecoverySession(Boolean(session) || recoveredFromUrl);
      setMessage(
        session || recoveredFromUrl
          ? "Enter a new admin password."
          : "Open the latest password recovery email link again."
      );
      setCheckingSession(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(Boolean(session));
        setMessage("Enter a new admin password.");
        setCheckingSession(false);
      }
    });

    checkRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function saveNewPassword() {
    if (saving) return;

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);
    setMessage("Saving new password...");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage("Could not update password: " + error.message);
      setSaving(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated. You can now log in as admin.");
    setSaving(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Admin Password</Text>
        <Text style={styles.subtitle}>
          Create a new password for your Supabase admin login.
        </Text>

        {checkingSession ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <Text style={styles.message}>{message}</Text>

            {hasRecoverySession ? (
              <>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  onSubmitEditing={saveNewPassword}
                />

                <Pressable
                  style={[
                    styles.primaryButton,
                    saving ? styles.disabledButton : null,
                  ]}
                  onPress={saveNewPassword}
                  disabled={saving}
                >
                  <Text style={styles.buttonText}>
                    {saving ? "Saving..." : "Save New Password"}
                  </Text>
                </Pressable>
              </>
            ) : null}

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/admin-dashboard")}
            >
              <Text style={styles.secondaryText}>Go to Admin Login</Text>
            </Pressable>

            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backText}>Back to Home</Text>
              </Pressable>
            </Link>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2ff",
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: "#003366",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    color: "#334155",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#003366",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#dbeafe",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryText: {
    color: "#003366",
    fontSize: 17,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backText: {
    color: "#003366",
    fontSize: 17,
    fontWeight: "bold",
  },
  message: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 18,
  },
});
