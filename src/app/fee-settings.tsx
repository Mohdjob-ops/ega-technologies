import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { verifyAdminSession } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "EGAADMIN2026";

export default function FeeSettings() {
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [fee, setFee] = useState("3000");
  const [startDate, setStartDate] = useState("Coming Soon");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function checkAdminPassword() {
    if (adminPassword !== ADMIN_PASSWORD) {
      setAdminMessage("❌ Wrong admin password");
      return;
    }

    const admin = await verifyAdminSession();

    if (!admin.isAdmin) {
      setAdminLoggedIn(false);
      setAdminEmail("");
      setAdminMessage(
        `❌ ${admin.error || "Sign in with an authorized admin account first."}`
      );
      return;
    }

    setAdminEmail(admin.email);
    setAdminLoggedIn(true);
    setAdminMessage("");
  }

  async function loadSettings() {
    setMessage("Loading settings...");

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "course_settings")
      .maybeSingle();

    if (error) {
      setMessage("❌ Load error: " + error.message);
      return;
    }

    if (data) {
      setFee(String(data.fee ?? "3000"));
      setStartDate(String(data.start_date ?? "Coming Soon"));
      setMessage("✅ Settings loaded");
    } else {
      setMessage("No settings found. Save to create one.");
    }
  }

  async function saveSettings() {
    if (loading) return;

    if (!fee.trim() || !startDate.trim()) {
      setMessage("⚠️ Please enter fee and start date");
      return;
    }

    setLoading(true);
    setMessage("Saving...");

    const { error } = await supabase
      .from("settings")
      .upsert(
        {
          key: "course_settings",
          fee: Number(fee),
          start_date: startDate.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    setLoading(false);

    if (error) {
      setMessage("❌ Save error: " + error.message);
      return;
    }

    setMessage("✅ Settings saved successfully");
  }

  if (!adminLoggedIn) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>Only EGA admin can change fee settings</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Admin Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter admin password"
            secureTextEntry
            value={adminPassword}
            onChangeText={setAdminPassword}
          />

          <TouchableOpacity style={styles.adminButton} onPress={checkAdminPassword}>
            <Text style={styles.buttonText}>Login as Admin</Text>
          </TouchableOpacity>

          {adminMessage ? <Text style={styles.errorMessage}>{adminMessage}</Text> : null}

          <Link href="/admin-dashboard" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backText}>← Back to Admin Dashboard</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>⚙️</Text>
        <Text style={styles.title}>Fee Settings</Text>
        <Text style={styles.subtitle}>
          Change course fee and starting date globally
        </Text>
        <Text style={styles.sessionText}>
          Signed in as {adminEmail || "authorized admin"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Course Fee</Text>
        <TextInput
          style={styles.input}
          value={fee}
          onChangeText={setFee}
          placeholder="Example: 3000"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Start Date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="Example: July 1, 2026"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={saveSettings}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Settings"}
          </Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Link href="/admin-dashboard" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backText}>← Back to Admin Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#edf3ff" },
  header: {
    backgroundColor: "#12306d",
    padding: 40,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  icon: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 34, fontWeight: "bold", color: "white" },
  subtitle: { fontSize: 16, color: "#dbe7ff", marginTop: 8, textAlign: "center" },
  sessionText: {
    color: "#bbf7d0",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  card: { backgroundColor: "white", margin: 18, padding: 18, borderRadius: 16 },
  label: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#12306d",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 18,
  },
  adminButton: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 18,
  },
  disabledButton: { backgroundColor: "#86efac" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  message: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#12306d",
  },
  errorMessage: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#b00020",
  },
  backButton: { marginTop: 20, alignItems: "center" },
  backText: { color: "#12306d", fontSize: 16, fontWeight: "bold" },
});
