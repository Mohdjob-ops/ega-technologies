import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

function printCertificate() {
  if (typeof window !== "undefined") {
    window.print();
  }
}

export default function JavaScriptCertificatePage() {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [message, setMessage] = useState("");

  async function checkCertificate() {
    if (!studentId.trim()) {
      setMessage("⚠️ Enter Student ID");
      setStudent(null);
      return;
    }

    setMessage("Checking certificate...");
    setStudent(null);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", studentId.trim())
      .maybeSingle();

    if (error) {
      setMessage("❌ Supabase error: " + error.message);
      return;
    }

    if (!data) {
      setMessage("❌ Student not found");
      return;
    }

    if (data.js_certificate_status !== "Ready") {
      setMessage("❌ JavaScript Certificate not ready yet. Pass the JavaScript quiz first.");
      return;
    }

    setStudent(data);
    setMessage("🎓 Certificate Ready");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text style={styles.back}>← Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>JavaScript Certificate</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentId}
        onChangeText={setStudentId}
      />

      <TouchableOpacity style={styles.button} onPress={checkCertificate}>
        <Text style={styles.buttonText}>Check Certificate</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {student && (
        <View style={styles.certificate}>
          <Text style={styles.certTitle}>🎓 CERTIFICATE OF COMPLETION</Text>
          <Text style={styles.certText}>This certifies that</Text>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.certText}>has successfully completed</Text>
          <Text style={styles.course}>JavaScript Fundamentals</Text>
          <Text style={styles.certText}>at EGA Technologies</Text>
          <Text style={styles.smallText}>Student ID: {student.student_id}</Text>
          <Text style={styles.smallText}>Certificate Status: Ready</Text>
        </View>
      )}
    
      <TouchableOpacity style={styles.printButton} onPress={printCertificate}>
        <Text style={styles.printButtonText}>📥 Download / Print Certificate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  content: { padding: 20, paddingBottom: 60 },
  back: { marginTop: 35, marginBottom: 25, color: "#003366", fontSize: 18, fontWeight: "bold" },
  title: { fontSize: 34, fontWeight: "bold", color: "#003366", marginBottom: 25 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 15, fontSize: 18, marginBottom: 20 },
  button: { backgroundColor: "#003366", padding: 18, borderRadius: 12, alignItems: "center", marginBottom: 25 },
  buttonText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  message: { textAlign: "center", fontSize: 20, fontWeight: "bold", marginBottom: 30 },
  certificate: { backgroundColor: "#fff", borderWidth: 4, borderColor: "#d4af37", borderRadius: 18, padding: 40, alignItems: "center", maxWidth: 900, alignSelf: "center", width: "100%" },
  certTitle: { fontSize: 30, fontWeight: "bold", color: "#003366", marginBottom: 35, textAlign: "center" },
  certText: { fontSize: 22, marginBottom: 15, textAlign: "center" },
  name: { fontSize: 40, fontWeight: "bold", color: "#b8860b", marginBottom: 25, textAlign: "center" },
  course: { fontSize: 30, fontWeight: "bold", color: "#003366", marginBottom: 25, textAlign: "center" },
  smallText: { marginTop: 10, fontSize: 16, color: "#555" },

  printButton: {
    backgroundColor: "#0a66c2",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  printButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
