import { Link } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function HTMLLecture() {
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const lessons = [
    ["1", "What is HTML?", "HTML means HyperText Markup Language. It is used to build the structure of web pages."],
    ["2", "HTML Document Structure", "<!DOCTYPE html>, html, head, title, and body are the main parts of every web page."],
    ["3", "Headings and Paragraphs", "Use h1 to h6 for headings and p for paragraphs."],
    ["4", "Links and Images", "Use a tag for links and img tag for pictures."],
    ["5", "Lists", "Use ul for unordered lists, ol for ordered lists, and li for list items."],
    ["6", "Tables", "Use table, tr, th, and td to show data in rows and columns."],
    ["7", "Forms", "Use form, input, label, textarea, select, and button to collect user data."],
    ["8", "Semantic HTML", "Use header, nav, main, section, article, aside, and footer for clean structure."],
    ["9", "Final Practice", "Build a full student profile page using headings, image, list, table, and form."],
  ];

  async function markLessonComplete(lessonNumber: number) {
    if (!studentId.trim()) {
      setMessage("⚠️ Please enter your Student ID first.");
      return;
    }

    setSaving(true);
    setMessage("Saving progress...");

    const { error } = await supabase.from("student_progress").insert({
      student_id: studentId.trim(),
      course: "HTML",
      lecture_number: lessonNumber,
      completed: true,
    });

    if (error) {
      setMessage("❌ Error saving progress: " + error.message);
    } else {
      setMessage(`✅ HTML Lesson ${lessonNumber} marked as completed.`);
    }

    setSaving(false);
  }

  function exampleCode(lessonNumber: string) {
    if (lessonNumber === "1") return "<h1>Welcome to HTML</h1>";
    if (lessonNumber === "2") return "<html>\\n  <head><title>My Page</title></head>\\n  <body>Hello</body>\\n</html>";
    if (lessonNumber === "3") return "<h1>Main Title</h1>\\n<p>This is a paragraph.</p>";
    if (lessonNumber === "4") return "<a href='https://example.com'>Visit Website</a>\\n<img src='student.jpg' alt='Student' />";
    if (lessonNumber === "5") return "<ul>\\n  <li>HTML</li>\\n  <li>CSS</li>\\n</ul>";
    if (lessonNumber === "6") return "<table>\\n  <tr><th>Name</th><th>Course</th></tr>\\n  <tr><td>Ali</td><td>HTML</td></tr>\\n</table>";
    if (lessonNumber === "7") return "<form>\\n  <input type='text' placeholder='Name' />\\n  <button>Send</button>\\n</form>";
    if (lessonNumber === "8") return "<header>Website Header</header>\\n<main>Main Content</main>\\n<footer>Footer</footer>";
    return "<h1>Student Profile</h1>\\n<p>Name: Hassan</p>\\n<button>Register</button>";
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/learner-portal" style={styles.back}>
        ← Back to My EGA
      </Link>

      <Text style={styles.title}>📘 HTML Full Lecture</Text>
      <Text style={styles.subtitle}>
        Complete all 9 HTML lessons before taking the quiz.
      </Text>

      <View style={styles.progressBox}>
        <Text style={styles.inputLabel}>Enter Student ID to save progress</Text>
        <TextInput
          style={styles.input}
          placeholder="Example: EGA-123456789"
          value={studentId}
          onChangeText={setStudentId}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      {lessons.map((lesson) => (
        <View key={lesson[0]} style={styles.card}>
          <Text style={styles.lesson}>Lesson {lesson[0]}</Text>
          <Text style={styles.cardTitle}>{lesson[1]}</Text>
          <Text style={styles.text}>{lesson[2]}</Text>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Example:</Text>
            <Text style={styles.code}>{exampleCode(lesson[0])}</Text>
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => markLessonComplete(Number(lesson[0]))}
            disabled={saving}
          >
            <Text style={styles.completeText}>
              {saving ? "Saving..." : `Mark Lesson ${lesson[0]} Complete`}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Link href="/html-quiz" asChild>
        <TouchableOpacity style={styles.quizButton}>
          <Text style={styles.quizText}>Start HTML Quiz</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef3ff" },
  content: { padding: 20, paddingBottom: 50 },
  back: { fontSize: 18, color: "#003366", fontWeight: "bold", marginBottom: 20 },
  title: { fontSize: 34, fontWeight: "bold", color: "#003366", textAlign: "center" },
  subtitle: { fontSize: 18, color: "#475569", textAlign: "center", marginBottom: 25 },
  progressBox: { backgroundColor: "#fff", padding: 18, borderRadius: 16, marginBottom: 20 },
  inputLabel: { fontSize: 18, fontWeight: "bold", color: "#003366", marginBottom: 10 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 14, fontSize: 18 },
  message: { fontSize: 17, fontWeight: "bold", color: "#003366", marginTop: 12, textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 18 },
  lesson: { fontSize: 16, color: "#2563eb", fontWeight: "bold" },
  cardTitle: { fontSize: 24, fontWeight: "bold", color: "#003366", marginVertical: 8 },
  text: { fontSize: 17, color: "#334155", lineHeight: 26 },
  exampleBox: { backgroundColor: "#0f172a", padding: 16, borderRadius: 12, marginTop: 15 },
  exampleTitle: { color: "#93c5fd", fontWeight: "bold", marginBottom: 8 },
  code: { color: "#e5e7eb", fontSize: 15, lineHeight: 22 },
  completeButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 15 },
  completeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  quizButton: { backgroundColor: "#16a34a", padding: 18, borderRadius: 14, alignItems: "center", marginTop: 20 },
  quizText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
