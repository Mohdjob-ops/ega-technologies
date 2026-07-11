import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, View, Pressable, TextInput } from "react-native";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "EGAADMIN2026";

export default function AdminDashboard() {
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceSummary();
  }, []);

  function checkAdminPassword() {
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setAdminMessage("");
    } else {
      setAdminMessage("❌ Wrong admin password");
    }
  }

  async function loadFinanceSummary() {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("fee, paid_amount, remaining_amount");

    if (error) {
      console.log("Finance summary error:", error.message);
      setLoading(false);
      return;
    }

    const students = data || [];
    setTotalStudents(students.length);
    setTotalFees(students.reduce((sum, s) => sum + Number(s.fee || 0), 0));
    setTotalCollected(students.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0));
    setTotalOutstanding(students.reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0));
    setLoading(false);
  }

  function money(value: number) {
    return `${value.toLocaleString()} ETB`;
  }

  if (!adminLoggedIn) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔐 Admin Login</Text>
        <Text style={styles.subtitle}>Only EGA admin can access this page.</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter admin password"
          secureTextEntry
          value={adminPassword}
          onChangeText={setAdminPassword}
        />

        <Pressable style={styles.linkButton} onPress={checkAdminPassword}>
          <Text style={styles.linkText}>Login as Admin</Text>
        </Pressable>

        {adminMessage ? <Text style={styles.message}>{adminMessage}</Text> : null}

        <Link href="/" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backText}>← Back to Home</Text>
          </Pressable>
        </Link>
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
          <Text style={styles.summaryText}>Loading finance summary...</Text>
        ) : (
          <>
            <Text style={styles.summaryText}>👨‍🎓 Total Students: {totalStudents}</Text>
            <Text style={styles.summaryText}>💰 Total Course Fees: {money(totalFees)}</Text>
            <Text style={styles.paid}>✅ Total Collected: {money(totalCollected)}</Text>
            <Text style={styles.pending}>⏳ Outstanding Balance: {money(totalOutstanding)}</Text>
          </>
        )}
      </View>

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

      <Link href="/fee-settings" asChild>
        <Pressable style={styles.linkButton}>
          <Text style={styles.linkText}>⚙️ Fee Settings</Text>
        </Pressable>
      </Link>

      <Link href="/" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Back to Home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eaf2ff" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 34, fontWeight: "bold", textAlign: "center", color: "#003366", marginTop: 30 },
  subtitle: { fontSize: 18, textAlign: "center", color: "#334155", marginBottom: 25 },
  summaryBox: { backgroundColor: "#fff", padding: 22, borderRadius: 16, marginBottom: 25 },
  summaryTitle: { fontSize: 26, fontWeight: "bold", color: "#003366", marginBottom: 15, textAlign: "center" },
  summaryText: { fontSize: 20, marginBottom: 10, color: "#1f2937", fontWeight: "bold" },
  paid: { fontSize: 20, color: "#166534", fontWeight: "bold", marginBottom: 10 },
  pending: { fontSize: 20, color: "#ca8a04", fontWeight: "bold", marginBottom: 5 },
  linkButton: { backgroundColor: "#003366", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 15 },
  linkText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  backButton: { marginTop: 20, alignItems: "center" },
  backText: { color: "#003366", fontSize: 20, fontWeight: "bold" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 15,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    color: "#b00020",
    fontWeight: "bold",
    marginBottom: 15,
  },
});
