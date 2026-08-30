import { Link } from "expo-router";
import { ScrollView, Text, StyleSheet, View, TouchableOpacity } from "react-native";

export default function JavaScriptLecture() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/learner-portal" style={styles.back}>← Back to My EGA</Link>

      <Text style={styles.title}>⚡ JavaScript Full Lecture</Text>
      <Text style={styles.subtitle}>
        Learn how to make websites interactive using variables, functions, conditions, loops, arrays, objects, and events.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. What is JavaScript?</Text>
        <Text style={styles.text}>
          JavaScript is the programming language of the web. HTML creates structure, CSS creates design, and JavaScript adds behavior.
        </Text>
        <Text style={styles.code}>
{`console.log("Hello JavaScript!");`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Variables</Text>
        <Text style={styles.text}>
          Variables store information. Use let and const in modern JavaScript.
        </Text>
        <Text style={styles.code}>
{`let name = "Ahmed";
const school = "EGA Technologies";

console.log(name);`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Data Types</Text>
        <Text style={styles.text}>
          JavaScript can store text, numbers, true/false values, arrays, and objects.
        </Text>
        <Text style={styles.code}>
{`let studentName = "Aisha";
let age = 20;
let passed = true;
let courses = ["HTML", "CSS", "JavaScript"];`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Conditions</Text>
        <Text style={styles.text}>
          Conditions help JavaScript make decisions.
        </Text>
        <Text style={styles.code}>
{`let score = 85;

if (score >= 70) {
  console.log("Passed");
} else {
  console.log("Failed");
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Functions</Text>
        <Text style={styles.text}>
          Functions are reusable blocks of code.
        </Text>
        <Text style={styles.code}>
{`function greetStudent(name) {
  return "Welcome " + name;
}

console.log(greetStudent("Khalid"));`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Arrays</Text>
        <Text style={styles.text}>
          Arrays store lists of values.
        </Text>
        <Text style={styles.code}>
{`let courses = ["HTML", "CSS", "JavaScript"];

console.log(courses[0]);
console.log(courses.length);`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Objects</Text>
        <Text style={styles.text}>
          Objects store related information together.
        </Text>
        <Text style={styles.code}>
{`let student = {
  name: "Fatima",
  course: "Web Development",
  paid: true
};

console.log(student.name);`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Loops</Text>
        <Text style={styles.text}>
          Loops repeat code many times.
        </Text>
        <Text style={styles.code}>
{`for (let i = 1; i <= 5; i++) {
  console.log("Lesson " + i);
}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>9. Events</Text>
        <Text style={styles.text}>
          Events happen when users click, type, submit forms, or move the mouse.
        </Text>
        <Text style={styles.code}>
{`button.addEventListener("click", function() {
  alert("Button clicked!");
});`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>10. Practice Project</Text>
        <Text style={styles.text}>
          Build a small quiz app. Store questions in an array, check answers, calculate score, and show pass or fail.
        </Text>
      </View>

      <Link href="/javascript-quiz" asChild>
        <TouchableOpacity style={styles.quizButton}>
          <Text style={styles.quizText}>Take JavaScript Quiz</Text>
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
