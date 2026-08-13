import { Link, useLocalSearchParams } from "expo-router";
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
import { verifyAdminUser } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const { adminError } = useLocalSearchParams<{
    adminError?: string;
  }>();

  const [email, setEmail] = useState("xi.tiwit@gmail.com");
  const [password, setPassword] = useState("");

  const [loggingIn, setLoggingIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminError === "expired_link") {
      setAdminMessage(
        "❌ The login link expired or was already used. Enter your admin email and password."
      );
    }
  }, [adminError]);

  async function loginAdmin() {
    if (loggingIn) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setAdminMessage("❌ Enter your admin email.");
      return;
    }

    if (!cleanPassword) {
      setAdminMessage("❌ Enter your admin password.");
      return;
    }

    setLoggingIn(true);
    setAdminMessage("");

    try {
      /*
       * Step 1:
       * Authenticate the administrator using Supabase Auth.
       * The password field must contain the Supabase Auth password,
       * not the administrator UID.
       */
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        const readableMessage =
          error.message === "Invalid login credentials"
            ? "The admin email or password is incorrect."
            : error.message;

        setAdminMessage(`❌ ${readableMessage}`);
        return;
      }

      if (!data.user) {
        setAdminMessage(
          "❌ Supabase did not return an authenticated user."
        );
        return;
      }

      /*
       * Step 2:
       * Check the authenticated user's UID against admin_users.
       * The administrator never types the UID into this form.
       */
      const adminResult = await verifyAdminUser(
        data.user.id,
        data.user.email || cleanEmail
      );

      if (!adminResult.isAdmin) {
        await supabase.auth.signOut();

        setAdminLoggedIn(false);
        setAdminMessage(
          `❌ ${
            adminResult.error ||
            "This account does not have an active administrator role."
          }`
        );

        return;
      }

      /*
       * Step 3:
       * Open the dashboard immediately after successful verification.
       */
      setPassword("");
      setAdminMessage("");
      setAdminLoggedIn(true);

      /*
       * Step 4:
       * Load the dashboard summary.
       * A finance-loading error must not close the dashboard.
       */
      await loadFinanceSummary();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected administrator login error occurred.";

      console.error("Admin login error:", error);
      setAdminMessage(`❌ ${message}`);
      setAdminLoggedIn(false);
    } finally {
      setLoggingIn(false);
    }
  }

  async function logoutAdmin() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setAdminMessage(`❌ Logout error: ${error.message}`);
        return;
      }

      setAdminLoggedIn(false);
      setPassword("");
      setAdminMessage("✅ Admin logged out safely.");

      setTotalStudents(0);
      setTotalFees(0);
      setTotalCollected(0);
      setTotalOutstanding(0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected logout error occurred.";

      setAdminMessage(`❌ ${message}`);
    }
  }

  async function loadFinanceSummary() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("students")
        .select("fee, paid_amount, remaining_amount");

      if (error) {
        console.error("Finance summary error:", error);

        setAdminMessage(
          `❌ Finance summary error: ${error.message}`
        );

        return;
      }

      const students = data || [];

      const fees = students.reduce(
        (sum, student) => sum + Number(student.fee || 0),
        0
      );

      const collected = students.reduce(
        (sum, student) =>
          sum + Number(student.paid_amount || 0),
        0
      );

      const outstanding = students.reduce(
        (sum, student) =>
          sum + Number(student.remaining_amount || 0),
        0
      );

      setTotalStudents(students.length);
      setTotalFees(fees);
      setTotalCollected(collected);
      setTotalOutstanding(outstanding);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected finance summary error occurred.";

      console.error("Finance summary error:", error);
      setAdminMessage(`❌ Finance summary error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function money(value: number) {
    return `${value.toLocaleString("en-GB")} ETB`;
  }

  if (!adminLoggedIn) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginBox}>
          <Text style={styles.title}>🔐 Secure Admin Login</Text>

          <Text style={styles.subtitle}>
            Sign in using your authorised Supabase administrator
            account.
          </Text>

          <Text style={styles.label}>Admin Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Admin email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loggingIn}
          />

          <Text style={styles.label}>Admin Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Admin password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void loginAdmin();
            }}
            editable={!loggingIn}
            returnKeyType="go"
          />

          <Pressable
            style={({ pressed }) => [
              styles.linkButton,
              pressed && !loggingIn
                ? styles.pressedButton
                : null,
              loggingIn ? styles.disabledButton : null,
            ]}
            onPress={() => {
              void loginAdmin();
            }}
            disabled={loggingIn}
          >
            {loggingIn ? (
              <View style={styles.loginLoadingRow}>
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                />

                <Text style={styles.linkText}>Signing in...</Text>
              </View>
            ) : (
              <Text style={styles.linkText}>Login as Admin</Text>
            )}
          </Pressable>

          {adminMessage ? (
            <Text
              style={[
                styles.message,
                adminMessage.startsWith("✅")
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}
            >
              {adminMessage}
            </Text>
          ) : null}

          <Link href="/" asChild>
            <Pressable style={styles.backButton}>
              <Text style={styles.backText}>← Back to Home</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>🛠️ Admin Dashboard</Text>

      <Text style={styles.subtitle}>
        EGA Technologies management system
      </Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>
          💰 Finance Summary
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Loading finance summary...
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.summaryText}>
              👨‍🎓 Total Students: {totalStudents}
            </Text>

            <Text style={styles.summaryText}>
              💰 Total Course Fees: {money(totalFees)}
            </Text>

            <Text style={styles.paid}>
              ✅ Total Collected: {money(totalCollected)}
            </Text>

            <Text style={styles.pending}>
              ⏳ Outstanding Balance:{" "}
              {money(totalOutstanding)}
            </Text>
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed ? styles.pressedButton : null,
          ]}
          onPress={() => {
            void loadFinanceSummary();
          }}
          disabled={loading}
        >
          <Text style={styles.refreshText}>
            {loading ? "Loading..." : "🔄 Refresh Summary"}
          </Text>
        </Pressable>
      </View>

      {adminMessage ? (
        <Text
          style={[
            styles.message,
            adminMessage.startsWith("✅")
              ? styles.successMessage
              : styles.errorMessage,
          ]}
        >
          {adminMessage}
        </Text>
      ) : null}

      <Link href="/admin-students" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>
            📋 Student List / Payments
          </Text>
        </Pressable>
      </Link>

      <Link href="/admin-payment-requests" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>
            💳 Payment Requests
          </Text>
        </Pressable>
      </Link>

      <Link href="/admin-registration-monitor" asChild>
        <Pressable style={styles.alertButton}>
          <Text style={styles.linkText}>
            🔔 Registration Alerts
          </Text>
        </Pressable>
      </Link>

      <Link href="/fee-settings" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>⚙️ Fee Settings</Text>
        </Pressable>
      </Link>

      <Pressable
        style={styles.logoutButton}
        onPress={() => {
          void logoutAdmin();
        }}
      >
        <Text style={styles.logoutText}>
          🚪 Logout Admin
        </Text>
      </Pressable>

      <Link href="/" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Back to Home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2ff",
  },

  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },

  loginBox: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 18,
    marginTop: 35,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003366",
    marginTop: 20,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#334155",
    marginBottom: 25,
    lineHeight: 27,
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

  summaryBox: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 16,
    marginBottom: 25,
  },

  summaryTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 15,
    textAlign: "center",
  },

  summaryText: {
    fontSize: 20,
    marginBottom: 10,
    color: "#1f2937",
    fontWeight: "bold",
  },

  paid: {
    fontSize: 20,
    color: "#166534",
    fontWeight: "bold",
    marginBottom: 10,
  },

  pending: {
    fontSize: 20,
    color: "#ca8a04",
    fontWeight: "bold",
    marginBottom: 5,
  },

  linkButton: {
    backgroundColor: "#003366",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    minHeight: 60,
  },

  alertButton: {
    backgroundColor: "#7c2d12",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    minHeight: 60,
  },

  disabledButton: {
    opacity: 0.65,
  },

  pressedButton: {
    opacity: 0.8,
  },

  loginLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  linkText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  refreshButton: {
    backgroundColor: "#dbeafe",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },

  refreshText: {
    color: "#003366",
    fontSize: 17,
    fontWeight: "bold",
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 15,
  },

  loadingText: {
    marginTop: 10,
    color: "#334155",
    fontSize: 16,
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#b91c1c",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 10,
    minHeight: 60,
  },

  logoutText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  backButton: {
    marginTop: 20,
    alignItems: "center",
  },

  backText: {
    color: "#003366",
    fontSize: 20,
    fontWeight: "bold",
  },

  message: {
    fontSize: 17,
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 15,
    lineHeight: 24,
  },

  errorMessage: {
    color: "#b00020",
  },

  successMessage: {
    color: "#166534",
  },
});