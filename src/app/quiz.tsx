import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type SelectedAnswers = Record<number, string>;

type StudentData = {
  student_id: string;
  name: string;
};

const questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks Text Machine Language",
    ],
    answer: "Hyper Text Markup Language",
  },
  {
    question: "Which tag is used for the largest heading?",
    options: ["<h1>", "<h6>", "<p>"],
    answer: "<h1>",
  },
  {
    question: "Which tag is used to create a link?",
    options: ["<a>", "<link>", "<href>"],
    answer: "<a>",
  },
  {
    question: "Which tag is used to show an image?",
    options: ["<img>", "<image>", "<pic>"],
    answer: "<img>",
  },
  {
    question: "Which tag is used for a paragraph?",
    options: ["<p>", "<text>", "<paragraph>"],
    answer: "<p>",
  },
];

export default function HTMLQuiz() {
  const [selected, setSelected] = useState<SelectedAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudent();
  }, []);

  async function loadStudent() {
    setLoadingStudent(true);
    setMessage("");

    if (typeof window === "undefined") {
      setMessage("❌ Student login information is unavailable.");
      setLoadingStudent(false);
      return;
    }

    const savedStudentId = localStorage.getItem("student_id");

    if (!savedStudentId) {
      setMessage(
        "⚠️ Please log in through the Learner Portal before taking this quiz."
      );
      setLoadingStudent(false);
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("student_id, name")
      .eq("student_id", savedStudentId)
      .maybeSingle();

    if (error) {
      setMessage("❌ Student information could not load: " + error.message);
      setLoadingStudent(false);
      return;
    }

    if (!data) {
      localStorage.removeItem("student_id");
      setMessage(
        "❌ Student account was not found. Please return to the Learner Portal and log in again."
      );
      setLoadingStudent(false);
      return;
    }

    setStudent(data);
    setLoadingStudent(false);
  }

  function selectAnswer(questionIndex: number, option: string) {
    if (submitted || saving) {
      return;
    }

    setSelected((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: option,
    }));
  }

  async function submitQuiz() {
    if (saving || submitted) {
      return;
    }

    if (!student) {
      setMessage(
        "⚠️ Please log in through the Learner Portal before submitting the quiz."
      );
      return;
    }

    if (Object.keys(selected).length !== questions.length) {
      setMessage("⚠️ Please answer all questions before submitting.");
      return;
    }

    setSaving(true);
    setMessage("Saving your quiz result...");

    let score = 0;

    questions.forEach((question, index) => {
      if (selected[index] === question.answer) {
        score += 1;
      }
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const { error } = await supabase.from("quiz_results").insert({
      student_name: student.name,
      student_id: student.student_id,
      course: "HTML",
      quiz_name: "HTML Quiz",
      score,
      total,
      percentage,
      passed,
    });

    if (error) {
      setMessage("❌ Supabase error: " + error.message);
      setSaving(false);
      return;
    }

    setSubmitted(true);
    setSaving(false);

    setMessage(
      passed
        ? `🎉 Congratulations, ${student.name}! You passed. Score: ${score}/${total} (${percentage}%).`
        : `❌ You did not pass. Score: ${score}/${total} (${percentage}%). Please review the HTML lecture and try again.`
    );
  }

  function tryAgain() {
    setSelected({});
    setSubmitted(false);
    setMessage("");
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
    >
      <Link href="/html-lecture" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backText}>← Back to HTML Lecture</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>🧪 HTML Fundamentals Quiz</Text>

      <Text style={styles.subtitle}>
        Answer all five questions. You need 70% or higher to pass.
      </Text>

      {loadingStudent ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Checking student information...
          </Text>
        </View>
      ) : student ? (
        <View style={styles.studentCard}>
          <Text style={styles.studentTitle}>Student</Text>
          <Text style={styles.studentText}>Name: {student.name}</Text>
          <Text style={styles.studentText}>
            Student ID: {student.student_id}
          </Text>
        </View>
      ) : (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            You must log in through the Learner Portal before taking this quiz.
          </Text>

          <Link href="/learner-portal" asChild>
            <TouchableOpacity style={styles.portalButton}>
              <Text style={styles.buttonText}>Open Learner Portal</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}

      {student &&
        questions.map((question, questionIndex) => (
          <View key={questionIndex} style={styles.card}>
            <Text style={styles.question}>
              {questionIndex + 1}. {question.question}
            </Text>

            {question.options.map((option) => {
              const isSelected =
                selected[questionIndex] === option;

              const isCorrect =
                submitted && option === question.answer;

              const isWrongSelection =
                submitted &&
                isSelected &&
                option !== question.answer;

              return (
                <TouchableOpacity
                  key={option}
                  disabled={submitted || saving}
                  onPress={() =>
                    selectAnswer(questionIndex, option)
                  }
                  style={[
                    styles.option,
                    isSelected && styles.selectedOption,
                    isCorrect && styles.correctOption,
                    isWrongSelection && styles.wrongOption,
                  ]}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

      {student && !submitted && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            saving && styles.disabledButton,
          ]}
          disabled={saving}
          onPress={submitQuiz}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving Result..." : "Submit Quiz"}
          </Text>
        </TouchableOpacity>
      )}

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}

      {student && submitted && (
        <View>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={tryAgain}
          >
            <Text style={styles.buttonText}>Try Quiz Again</Text>
          </TouchableOpacity>

          <Link href="/learner-portal" asChild>
            <TouchableOpacity style={styles.portalButton}>
              <Text style={styles.buttonText}>
                Return to Learner Portal
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  container: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 60,
  },

  backButton: {
    marginBottom: 20,
  },

  backText: {
    fontSize: 16,
    color: "#003366",
    fontWeight: "bold",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 25,
    color: "#334155",
  },

  statusCard: {
    backgroundColor: "#e0f2fe",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  statusText: {
    color: "#075985",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  studentCard: {
    backgroundColor: "#ecfdf5",
    padding: 18,
    borderRadius: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#86efac",
  },

  studentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 8,
  },

  studentText: {
    fontSize: 16,
    color: "#166534",
    marginBottom: 5,
  },

  warningCard: {
    backgroundColor: "#fff7ed",
    padding: 18,
    borderRadius: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#fdba74",
  },

  warningText: {
    color: "#9a3412",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  question: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#003366",
  },

  option: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedOption: {
    backgroundColor: "#c7d2fe",
    borderColor: "#4f46e5",
  },

  correctOption: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },

  wrongOption: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },

  optionText: {
    fontSize: 16,
    color: "#1e293b",
  },

  submitButton: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  tryAgainButton: {
    backgroundColor: "#d97706",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },

  portalButton: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  messageCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  message: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003366",
  },
});