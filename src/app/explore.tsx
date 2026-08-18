import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CoursesPage() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <TouchableOpacity>
          <Text style={styles.back}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>📚 EGA Courses</Text>
      <Text style={styles.subtitle}>Start with the AI Developer Course, then continue with Web Development.</Text>

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
        </TouchableOpacity>
      </Link>

      <Link href="/html-lecture" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={styles.cardTitle}>Web Development Courses</Text>
          <Text style={styles.cardText}>Start with HTML, then CSS, then JavaScript.</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/html-lecture" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={styles.cardTitle}>HTML Fundamentals</Text>
          <Text style={styles.cardText}>Learn structure, tags, forms, tables, links, images, and page building.</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/css-lecture" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🎨</Text>
          <Text style={styles.cardTitle}>CSS Fundamentals</Text>
          <Text style={styles.cardText}>Learn styling, layouts, Flexbox, Grid, animations, and responsive design.</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/javascript-lecture" asChild>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.cardTitle}>JavaScript Fundamentals</Text>
          <Text style={styles.cardText}>Learn variables, functions, arrays, objects, DOM, events, and modern JavaScript.</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  content: { padding: 20, paddingBottom: 60 },
  back: { marginTop: 35, marginBottom: 20, color: "#003366", fontSize: 18, fontWeight: "bold" },
  title: { fontSize: 34, fontWeight: "bold", color: "#003366", marginBottom: 10, textAlign: "center" },
  sectionTitle: { fontSize: 26, fontWeight: "bold", color: "#003366", marginTop: 15, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 18, color: "#555", textAlign: "center", marginBottom: 25 },
  card: { backgroundColor: "#fff", padding: 25, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: "#dbe3ec" },
  icon: { fontSize: 38, marginBottom: 15 },
  cardTitle: { fontSize: 26, fontWeight: "bold", color: "#003366", marginBottom: 10 },
  cardText: { fontSize: 18, color: "#486581", lineHeight: 28 },
});
