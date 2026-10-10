import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";

export default function CoursesPage() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <TouchableOpacity>
          <Text style={styles.back}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>📚 EGA Courses</Text>
      <Text style={styles.subtitle}>
        Start with the AI Developer Course, then continue with Web Development.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Important Course Information</Text>

        <Text style={styles.infoItem}>• AI Developer Course includes 15 lessons.</Text>
        <Text style={styles.infoItem}>
          • Each lesson may take 2–4 hours including practice and quizzes.
        </Text>
        <Text style={styles.infoItem}>
          • Students should study at least 2 hours per day.
        </Text>
        <Text style={styles.infoItem}>
          • Students continue until they finish the lessons, quizzes, and receive their certificate.
        </Text>
        <Text style={styles.infoItem}>
          • EGA products and course tools will be introduced during the training.
        </Text>
      </View>

      <Link
        href="/ai-lessons/lesson-01-ai-tools-course-introduction.html"
        onPress={(event) => {
          event.preventDefault();
          window.location.assign("/ai-lessons/lesson-01-ai-tools-course-introduction.html");
        }}
        asChild
      >
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.cardTitle}>AI Developer Course</Text>
          <Text style={styles.cardText}>
            Start the Artificial Intelligence course with Lesson 1: AI Tools Course Introduction.
          </Text>
          <Text style={styles.cardButton}>Open AI Course</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/web-development" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>💻</Text>
          <Text style={styles.cardTitle}>Web Development Course</Text>
          <Text style={styles.cardText}>
            Learn HTML, CSS, JavaScript, and practical website building skills.
          </Text>
          <Text style={styles.cardButton}>Open Web Development</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  back: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    color: "#475569",
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 25,
  },
  infoBox: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  infoTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 24,
    marginBottom: 7,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  icon: {
    fontSize: 38,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
});