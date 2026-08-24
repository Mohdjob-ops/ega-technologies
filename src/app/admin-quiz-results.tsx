import { Link, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

const AI_QUIZ_NAME = "AI Lessons 1-9 Assessment";

type QuizResult = {
  id: string | number;
  student_id: string;
  course: string | null;
  quiz_name: string | null;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  created_at: string | null;
};

export default function AdminQuizResults() {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [retakeStudentId, setRetakeStudentId] = useState("");
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);

  useEffect(() => {
    void verifyAndLoad();
  }, []);

  async function verifyAndLoad() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.replace("/admin-dashboard");
      return;
    }

    const adminResult = await verifyAdminUser(
      data.user.id,
      data.user.email || ""
    );

    if (!adminResult.isAdmin) {
      await supabase.auth.signOut();
      router.replace("/admin-dashboard");
      return;
    }

    await loadResults();
  }

  async function loadResults() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("quiz_results")
      .select(
        "id, student_id, course, quiz_name, score, total, percentage, passed, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setMessage("❌ Could not load quiz results: " + error.message);
      setResults([]);
      setLoading(false);
      return;
    }

    setResults((data || []) as QuizResult[]);
    setLoading(false);
  }

  async function allowRetake() {
    const studentId = retakeStudentId.trim().toUpperCase();

    if (!studentId) {
      setMessage("❌ Enter the student's complete EGA Student ID.");
      return;
    }

    if (!confirmRetake) {
      setConfirmRetake(true);
      setMessage(
        `⚠️ Confirm retake for ${studentId}. Tap the Allow Retake button again.`
      );
      return;
    }

    setRetakeLoading(true);
    setMessage("");

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle();

    if (studentError || !student) {
      setMessage(
        "❌ Student was not found. Check the Student ID and try again."
      );
      setRetakeLoading(false);
      setConfirmRetake(false);
      return;
    }

    const { error: attemptError } = await supabase
      .from("ai_quiz_attempts")
      .update({
        status: "Cancelled by Admin",
        submitted_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .eq("quiz_name", AI_QUIZ_NAME)
      .eq("status", "In Progress");

    if (attemptError) {
      setMessage(
        "❌ Could not cancel the current attempt: " + attemptError.message
      );
      setRetakeLoading(false);
      setConfirmRetake(false);
      return;
    }

    const { data: previousResults, error: resultLoadError } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("student_id", studentId)
      .eq("quiz_name", AI_QUIZ_NAME);

    if (resultLoadError) {
      setMessage(
        "❌ Could not check the previous result: " + resultLoadError.message
      );
      setRetakeLoading(false);
      setConfirmRetake(false);
      return;
    }

    for (const previousResult of previousResults || []) {
      const { error: archiveError } = await supabase
        .from("quiz_results")
        .update({
          quiz_name:
            AI_QUIZ_NAME +
            " — Previous Attempt " +
            String(previousResult.id),
        })
        .eq("id", previousResult.id);

      if (archiveError) {
        setMessage(
          "❌ The current attempt was stopped, but the previous result could not be archived: " +
            archiveError.message
        );
        setRetakeLoading(false);
        setConfirmRetake(false);
        return;
      }
    }

    setRetakeStudentId("");
    setConfirmRetake(false);
    setRetakeLoading(false);
    setMessage(
      `✅ Retake allowed for ${studentId}. The student can reopen the assessment and start a new 60-minute test.`
    );

    await loadResults();
  }

  const visibleResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return results;
    }

    return results.filter((result) =>
      [
        result.student_id,
        result.course || "",
        result.quiz_name || "",
        result.passed ? "passed" : "not passed",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [results, search]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>📊 Quiz Results</Text>

      <Text style={styles.subtitle}>
        Student assessment records saved in EGA
      </Text>

      <View style={styles.retakeCard}>
        <Text style={styles.retakeTitle}>
          🔓 Allow AI Assessment Retake
        </Text>

        <Text style={styles.retakeHelp}>
          Enter one Student ID. The current attempt will be cancelled and any
          previous score will remain saved as history.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: EGA-2026-110999"
          autoCapitalize="characters"
          autoCorrect={false}
          value={retakeStudentId}
          onChangeText={(value) => {
            setRetakeStudentId(value);
            setConfirmRetake(false);
            setMessage("");
          }}
        />

        <Pressable
          style={[
            styles.retakeButton,
            confirmRetake ? styles.confirmButton : null,
            retakeLoading ? styles.disabledButton : null,
          ]}
          onPress={() => {
            void allowRetake();
          }}
          disabled={retakeLoading}
        >
          <Text style={styles.buttonText}>
            {retakeLoading
              ? "Updating..."
              : confirmRetake
                ? "⚠️ Tap Again to Confirm"
                : "🔓 Allow Retake"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Search Student ID, course or assessment"
        autoCapitalize="characters"
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />

      <Pressable
        style={styles.refreshButton}
        onPress={() => {
          void loadResults();
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Loading..." : "🔄 Refresh Results"}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#003366" />
          <Text style={styles.loadingText}>Loading quiz results...</Text>
        </View>
      ) : null}

      {message ? (
        <Text
          style={
            message.startsWith("✅") ? styles.success : styles.error
          }
        >
          {message}
        </Text>
      ) : null}

      {!loading && !message ? (
        <Text style={styles.count}>
          Showing {visibleResults.length} of {results.length} records
        </Text>
      ) : null}

      {!loading &&
        visibleResults.map((result) => (
          <View
            key={String(result.id)}
            style={[
              styles.card,
              result.passed ? styles.passCard : styles.failCard,
            ]}
          >
            <Text style={styles.studentId}>
              {result.student_id}
            </Text>

            <Text style={styles.quizName}>
              {result.quiz_name || "Assessment"}
            </Text>

            <Text style={styles.detail}>
              Course: {result.course || "Not specified"}
            </Text>

            <Text style={styles.detail}>
              Score: {result.score}/{result.total}
            </Text>

            <Text style={styles.detail}>
              Percentage: {result.percentage}%
            </Text>

            <Text
              style={[
                styles.status,
                result.passed ? styles.passed : styles.notPassed,
              ]}
            >
              {result.passed ? "✅ PASSED" : "❌ NOT PASSED"}
            </Text>

            <Text style={styles.date}>
              Submitted:{" "}
              {result.created_at
                ? new Date(result.created_at).toLocaleString()
                : "Date unavailable"}
            </Text>
          </View>
        ))}

      {!loading && !message && visibleResults.length === 0 ? (
        <Text style={styles.empty}>No matching result was found.</Text>
      ) : null}

      <Link href="/admin-dashboard" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Back to Admin Dashboard</Text>
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
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    color: "#003366",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    color: "#475569",
    fontSize: 17,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },
  retakeCard: {
    backgroundColor: "#ffffff",
    borderColor: "#2563eb",
    borderWidth: 2,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  retakeTitle: {
    color: "#003366",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 8,
  },
  retakeHelp: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  retakeButton: {
    backgroundColor: "#15803d",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#b45309",
  },
  disabledButton: {
    opacity: 0.6,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#94a3b8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 17,
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: "#003366",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  loadingBox: {
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    color: "#475569",
    marginTop: 12,
    fontSize: 16,
  },
  count: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderLeftWidth: 6,
    padding: 18,
    marginBottom: 14,
  },
  passCard: {
    borderLeftColor: "#15803d",
  },
  failCard: {
    borderLeftColor: "#b91c1c",
  },
  studentId: {
    color: "#003366",
    fontSize: 20,
    fontWeight: "bold",
  },
  quizName: {
    color: "#1e293b",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  detail: {
    color: "#334155",
    fontSize: 16,
    marginBottom: 5,
  },
  status: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 8,
  },
  passed: {
    color: "#15803d",
  },
  notPassed: {
    color: "#b91c1c",
  },
  date: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 9,
  },
  success: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontWeight: "bold",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },
  empty: {
    color: "#475569",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
    fontSize: 17,
  },
  backButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 15,
  },
  backText: {
    color: "#003366",
    fontSize: 17,
    fontWeight: "bold",
  },
});
