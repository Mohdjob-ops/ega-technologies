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
  const { adminError } = useLocalSearchParams<{ adminError?: string }>();
  const [email, setEmail] = useState("jobtarget45@gmail.com");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (adminError === "expired_link") {
      setAdminMessage(
        "❌ The magic link expired or was already used. Send a fresh magic link from Supabase and open the newest email."
      );
    }

    checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setAdminLoggedIn(false);
        setCheckingSession(false);
        return;
      }

      setCheckingSession(true);
      await openAdminSession(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function checkExistingSession() {
    setCheckingSession(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      setAdminLoggedIn(false);
      setCheckingSession(false);
      return;
    }

    await openAdminSession(session.user.id);
  }

  async function openAdminSession(userId: string) {
    const admin = await verifyAdminUser(userId);

    if (!admin.isAdmin) {
      await supabase.auth.signOut();
      setAdminMessage(`❌ ${admin.error || "This account is not authorized as an administrator."}`);
      setAdminLoggedIn(false);
      setCheckingSession(false);
      return;
    }

    setAdminLoggedIn(true);
    setCheckingSession(false);
    await loadFinanceSummary();
  }

  async function loginAdmin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setAdminMessage("❌ Enter your admin email and password.");
      return;
    }

    setLoggingIn(true);
    setAdminMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      const message =
        error?.message === "Invalid login credentials"
          ? "Invalid Supabase Auth email or password. The UID row only works after this email/password signs in successfully."
          : error?.message || "Admin login failed.";

      setAdminMessage(`❌ ${message}`);
      setLoggingIn(false);
      return;
    }

    const admin = await verifyAdminUser(
      data.user.id,
      data.user.email || cleanEmail
    );

    if (!admin.isAdmin) {
      await supabase.auth.signOut();
      setAdminMessage(`❌ ${admin.error || "This account does not have an active admin role."}`);
      setLoggingIn(false);
      return;
    }

    setPassword("");
    setAdminLoggedIn(true);
    setLoggingIn(false);
    await loadFinanceSummary();
  }

  async function logoutAdmin() {
    await supabase.auth.signOut();

    setAdminLoggedIn(false);
    setPassword("");
    setAdminMessage("✅ Admin logged out safely.");

    setTotalStudents(0);
    setTotalFees(0);
    setTotalCollected(0);
    setTotalOutstanding(0);
  }

  async function loadFinanceSummary() {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("fee, paid_amount, remaining_amount");

    if (error) {
      console.log("Finance summary error:", error.message);
      setAdminMessage(`❌ Finance summary error: ${error.message}`);
      setLoading(false);
      return;
    }

    const students = data || [];

    setTotalStudents(students.length);
    setTotalFees(
      students.reduce((sum, student) => sum + Number(student.fee || 0), 0)
    );
    setTotalCollected(
      students.reduce(
        (sum, student) => sum + Number(student.paid_amount || 0),
        0
      )
    );
    setTotalOutstanding(
      students.reduce(
        (sum, student) => sum + Number(student.remaining_amount || 0),
        0
      )
    );

    setLoading(false);
  }

  function money(value: number) {
    return `${value.toLocaleString()} ETB`;
  }

  if (checkingSession) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.checkingText}>Checking secure admin session...</Text>
      </View>
    );
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
            Sign in using your authorized Supabase administrator account.
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
          />

          <Text style={styles.label}>Admin Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Admin password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={loginAdmin}
          />

          <Pressable
            style={[
              styles.linkButton,
              loggingIn ? styles.disabledButton : null,
            ]}
            onPress={loginAdmin}
            disabled={loggingIn}
          >
            <Text style={styles.linkText}>
              {loggingIn ? "Signing in..." : "Login as Admin"}
            </Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🛠️ Admin Dashboard</Text>
      <Text style={styles.subtitle}>EGA Technologies management system</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>💰 Finance Summary</Text>

        {loading ? (
          <ActivityIndicator size="large" />
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
              ⏳ Outstanding Balance: {money(totalOutstanding)}
            </Text>
          </>
        )}

        <Pressable style={styles.refreshButton} onPress={loadFinanceSummary}>
          <Text style={styles.refreshText}>🔄 Refresh Summary</Text>
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
          <Text style={styles.linkText}>📋 Student List / Payments</Text>
        </Pressable>
      </Link>

      <Link href="/admin-payment-requests" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>💳 Payment Requests</Text>
        </Pressable>
      </Link>

      <Link href="/admin-registration-monitor" asChild>
        <Pressable style={styles.alertButton}>
          <Text style={styles.linkText}>🔔 Registration Alerts</Text>
        </Pressable>
      </Link>

      <Link href="/fee-settings" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>⚙️ Fee Settings</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.logoutButton} onPress={logoutAdmin}>
        <Text style={styles.logoutText}>🚪 Logout Admin</Text>
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
    padding: 20,
    paddingBottom: 50,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#eaf2ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  checkingText: {
    marginTop: 14,
    fontSize: 18,
    color: "#334155",
    fontWeight: "bold",
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
    backgroundColor: "#fff",
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
    marginBottom: 15,
  },
  alertButton: {
    backgroundColor: "#7c2d12",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.65,
  },
  linkText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
  logoutButton: {
    backgroundColor: "#b91c1c",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
  },
  logoutText: {
    color: "#fff",
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
