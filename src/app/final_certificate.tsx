/* eslint-disable react-hooks/exhaustive-deps -- The saved-student certificate lookup intentionally runs once when the screen mounts. */
import { router } from "expo-router";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function printCertificate() {
  if (typeof window !== "undefined") {
    window.print();
  }
}

function isReady(value: any) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "ready";
}

function isPaid(value: any) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "paid";
}

function scorePassed(value: any) {
  const score = Number(value ?? 0);
  return Number.isFinite(score) && score >= 70;
}

function quizMatches(result: any, subject: string) {
  const text = [
    result?.quiz_name,
    result?.course,
    result?.subject,
    result?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (subject === "html") {
    return text.includes("html");
  }

  if (subject === "css") {
    return text.includes("css");
  }

  if (subject === "javascript") {
    return (
      text.includes("javascript") ||
      text.includes("java script") ||
      text.includes("js quiz")
    );
  }

  return false;
}

function quizResultPassed(result: any) {
  if (result?.passed === true) {
    return true;
  }

  if (scorePassed(result?.percentage)) {
    return true;
  }

  if (scorePassed(result?.score) && Number(result?.total ?? 100) <= 100) {
    return true;
  }

  const score = Number(result?.score ?? 0);
  const total = Number(result?.total ?? 0);

  if (
    Number.isFinite(score) &&
    Number.isFinite(total) &&
    total > 0 &&
    (score / total) * 100 >= 70
  ) {
    return true;
  }

  return false;
}

export default function MasterCertificate() {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAutoChecked(true);
      return;
    }

    const savedStudentId = localStorage.getItem("student_id");

    if (savedStudentId) {
      const cleanId = savedStudentId.trim();
      setStudentId(cleanId);
      checkCertificate(cleanId);
    } else {
      setAutoChecked(true);
    }
  }, []);

  async function checkCertificate(idOverride?: string) {
    const idToCheck = (idOverride || studentId).trim();

    if (!idToCheck) {
      setMessage("⚠️ Enter Student ID");
      setAutoChecked(true);
      return;
    }

    setLoading(true);
    setMessage("Checking master certificate...");
    setStudent(null);

    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", idToCheck)
        .maybeSingle();

      if (error) {
        setMessage("❌ Supabase error: " + error.message);
        return;
      }

      if (!data) {
        setMessage("❌ Student not found");
        return;
      }

      const { data: quizResults, error: quizError } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("student_id", idToCheck)
        .order("created_at", { ascending: false });

      if (quizError) {
        console.warn(
          "Master Certificate quiz_results check:",
          quizError.message
        );
      }

      const results = Array.isArray(quizResults)
        ? quizResults
        : [];

      const htmlPassedFromResults = results.some(
        (result: any) =>
          quizMatches(result, "html") &&
          quizResultPassed(result)
      );

      const cssPassedFromResults = results.some(
        (result: any) =>
          quizMatches(result, "css") &&
          quizResultPassed(result)
      );

      const jsPassedFromResults = results.some(
        (result: any) =>
          quizMatches(result, "javascript") &&
          quizResultPassed(result)
      );

      /*
       * HTML compatibility:
       * Older EGA records use certificate_status.
       * Newer records may use html_certificate_status.
       */
      const htmlCompleted =
        isReady(data.html_certificate_status) ||
        isReady(data.certificate_status) ||
        data.html_completed === true ||
        scorePassed(data.html_quiz_score) ||
        scorePassed(data.html_score) ||
        htmlPassedFromResults;

      const cssCompleted =
        isReady(data.css_certificate_status) ||
        data.css_completed === true ||
        scorePassed(data.css_quiz_score) ||
        scorePassed(data.css_score) ||
        cssPassedFromResults;

      const jsCompleted =
        isReady(data.js_certificate_status) ||
        data.js_completed === true ||
        scorePassed(data.js_quiz_score) ||
        scorePassed(data.js_score) ||
        jsPassedFromResults;

      const paymentCompleted =
        isPaid(data.payment_status) ||
        Number(data.remaining_amount ?? 0) === 0 &&
          Number(data.paid_amount ?? 0) > 0;

      console.log("MASTER CERTIFICATE CHECK", {
        studentId: idToCheck,
        paymentCompleted,
        htmlCompleted,
        cssCompleted,
        jsCompleted,
        payment_status: data.payment_status,
        certificate_status: data.certificate_status,
        html_certificate_status: data.html_certificate_status,
        css_certificate_status: data.css_certificate_status,
        js_certificate_status: data.js_certificate_status,
        html_completed: data.html_completed,
        css_completed: data.css_completed,
        js_completed: data.js_completed,
        html_quiz_score: data.html_quiz_score,
        css_quiz_score: data.css_quiz_score,
        js_quiz_score: data.js_quiz_score,
        quizResults: results,
      });

      if (!paymentCompleted) {
        setMessage(
          "🔒 Master Certificate locked: payment is not complete."
        );
        return;
      }

      if (!htmlCompleted) {
        setMessage(
          "🔒 Master Certificate locked: HTML has not been passed yet."
        );
        return;
      }

      if (!cssCompleted) {
        setMessage(
          "🔒 Master Certificate locked: CSS has not been passed yet."
        );
        return;
      }

      if (!jsCompleted) {
        setMessage(
          "🔒 Master Certificate locked: JavaScript has not been passed yet."
        );
        return;
      }

      setStudent(data);
      setMessage("🎓 Master Certificate unlocked!");
    } catch (err: any) {
      setMessage(
        "❌ Error checking Master Certificate: " +
          (err?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
      setAutoChecked(true);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/learner-portal")}
      >
        <Text style={styles.back}>
          ← Back to Learner Portal
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        🎓 Master Certificate
      </Text>

      <Text style={styles.subtitle}>
        Final certificate for completing HTML, CSS, and JavaScript.
      </Text>

      {!student && autoChecked && (
        <View style={styles.card}>
          <Text style={styles.label}>
            Student ID
          </Text>

          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Example: EGA-2026-8527"
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={() => checkCertificate()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Checking..."
                : "Check Master Certificate"}
            </Text>
          </TouchableOpacity>

          {message ? (
            <Text style={styles.message}>
              {message}
            </Text>
          ) : null}
        </View>
      )}

      {!student && !autoChecked && (
        <View style={styles.card}>
          <Text style={styles.message}>
            Checking your Master Certificate...
          </Text>
        </View>
      )}

      {student && (
        <>
          <View style={styles.certificate}>
            <Text style={styles.certHeader}>
              ELMI GURAY ACADEMY
            </Text>

            <Text style={styles.certTitle}>
              Certificate of Completion
            </Text>

            <Text style={styles.certText}>
              This certifies that
            </Text>

            <Text style={styles.studentName}>
              {student.name}
            </Text>

            <Text style={styles.certText}>
              has successfully completed the full
            </Text>

            <Text style={styles.program}>
              Web Development Program
            </Text>

            <Text style={styles.certText}>
              including HTML, CSS, and JavaScript.
            </Text>

            <Text style={styles.detail}>
              Student ID: {student.student_id}
            </Text>

            <Text style={styles.detail}>
              Certificate No: MASTER-{student.student_id}
            </Text>

            <Text style={styles.detail}>
              Date: {new Date().toLocaleDateString()}
            </Text>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureLine}>
                ________________________
              </Text>

              <Text style={styles.signature}>
                Director Signature
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.printButton}
            onPress={printCertificate}
          >
            <Text style={styles.printButtonText}>
              📥 Download / Print Certificate
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f7fb",
    minHeight: "100%",
  },

  back: {
    color: "#003366",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: "#444",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 25,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#003366",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  message: {
    marginTop: 15,
    fontSize: 16,
    color: "#003366",
    fontWeight: "bold",
    textAlign: "center",
  },

  certificate: {
    backgroundColor: "#fffaf0",
    borderWidth: 4,
    borderColor: "#b8860b",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  certHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 15,
  },

  certTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#b8860b",
    textAlign: "center",
    marginBottom: 25,
  },

  certText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginVertical: 8,
  },

  studentName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginVertical: 15,
  },

  program: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#b8860b",
    textAlign: "center",
    marginVertical: 12,
  },

  detail: {
    fontSize: 16,
    color: "#333",
    marginTop: 8,
  },

  signatureBox: {
    marginTop: 35,
    alignItems: "center",
  },

  signatureLine: {
    fontSize: 18,
    color: "#333",
  },

  signature: {
    fontSize: 15,
    color: "#333",
    marginTop: 5,
  },

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
