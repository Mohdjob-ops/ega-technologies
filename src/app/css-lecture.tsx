import { Link } from "expo-router";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";

export default function CSSLecture() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/learner-portal" style={styles.back}>← Back to My EGA</Link>

      <Text style={styles.title}>🎨 CSS Full Lecture</Text>
      <Text style={styles.subtitle}>
        Learn how to style websites using colors, layouts, spacing, fonts, and responsive design.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. What is CSS?</Text>
        <Text style={styles.text}>
          CSS means Cascading Style Sheets. HTML builds the structure of a webpage, while CSS makes it beautiful.
        </Text>
        <Text style={styles.code}>
{`h1 {
  color: blue;
  font-size: 40px;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. CSS Selectors</Text>
        <Text style={styles.text}>
          Selectors choose which HTML elements you want to style.
        </Text>
        <Text style={styles.code}>
{`p {
  color: green;
}

.title {
  font-weight: bold;
}

#main {
  background-color: lightgray;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Colors and Backgrounds</Text>
        <Text style={styles.text}>
          CSS can change text color, background color, borders, and shadows.
        </Text>
        <Text style={styles.code}>
{`body {
  background-color: #eef3ff;
}

.card {
  background-color: white;
  border-radius: 20px;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Text Styling</Text>
        <Text style={styles.text}>
          You can control font size, weight, spacing, alignment, and decoration.
        </Text>
        <Text style={styles.code}>
{`h1 {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Box Model</Text>
        <Text style={styles.text}>
          Every element is a box. The box model includes content, padding, border, and margin.
        </Text>
        <Text style={styles.code}>
{`.box {
  padding: 20px;
  border: 2px solid blue;
  margin: 30px;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Flexbox Layout</Text>
        <Text style={styles.text}>
          Flexbox helps arrange items in rows or columns and align them easily.
        </Text>
        <Text style={styles.code}>
{`.container {
  display: flex;
  justify-content: center;
  align-items: center;
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Responsive Design</Text>
        <Text style={styles.text}>
          Responsive design makes websites work well on phones, tablets, and computers.
        </Text>
        <Text style={styles.code}>
{`@media (max-width: 600px) {
  h1 {
    font-size: 28px;
  }
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Practice Project</Text>
        <Text style={styles.text}>
          Create a profile card with a name, photo, description, and button. Use colors, padding, border-radius, and shadow.
        </Text>
      </View>


      <Link href="/css-quiz" asChild>
        <TouchableOpacity style={styles.quizButton}>
          <Text style={styles.quizText}>Take CSS Quiz</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef3ff" },
  content: { padding: 20, paddingBottom: 60 },
  back: { fontSize: 18, color: "#003366", fontWeight: "bold", marginBottom: 20 },
  title: { fontSize: 38, fontWeight: "bold", color: "#003366", textAlign: "center" },
  subtitle: { fontSize: 20, color: "#334155", textAlign: "center", marginBottom: 25 },
  card: { backgroundColor: "#fff", padding: 22, borderRadius: 18, marginBottom: 22 },
  sectionTitle: { fontSize: 26, fontWeight: "bold", color: "#003366", marginBottom: 12 },
  text: { fontSize: 18, color: "#334155", lineHeight: 28 },
  code: { backgroundColor: "#0f172a", color: "#fff", padding: 18, borderRadius: 12, fontSize: 16, marginTop: 15 },
  quizButton: { backgroundColor: "#16a34a", padding: 18, borderRadius: 14, alignItems: "center", marginTop: 10 },
  quizText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
});
