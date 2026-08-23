import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const questions = [
  {
    q: "What is JavaScript mainly used for?",
    so: "JavaScript inta badan maxaa loo isticmaalaa?",
    options: [
      "Styling pages",
      "Adding interactivity",
      "Creating databases",
      "Writing HTML",
    ],
    answer: "Adding interactivity",
  },
  {
    q: "Which keyword creates a variable?",
    so: "Keyword-kee ayaa sameeya variable?",
    options: ["let", "style", "html", "div"],
    answer: "let",
  },
  {
    q: "Which keyword creates a constant?",
    so: "Keyword-kee ayaa sameeya constant?",
    options: ["const", "fixed", "same", "lock"],
    answer: "const",
  },
  {
    q: "Which command prints to console?",
    so: "Command-kee ayaa wax ku qora console-ka?",
    options: ["print()", "console.log()", "show()", "display()"],
    answer: "console.log()",
  },
  {
    q: "Single-line comment uses:",
    so: "Comment hal sadar ah wuxuu isticmaalaa:",
    options: ["//", "##", "<!-- -->", "**"],
    answer: "//",
  },
  {
    q: "True or false is called:",
    so: "True ama false waxaa loo yaqaan:",
    options: ["String", "Number", "Boolean", "Array"],
    answer: "Boolean",
  },
  {
    q: "Decision making uses:",
    so: "Go'aan qaadashada code-ku waxay isticmaashaa:",
    options: ["if", "for", "let", "return"],
    answer: "if",
  },
  {
    q: "Which repeats code?",
    so: "Kee ayaa code-ka soo celiya marar badan?",
    options: ["loop", "image", "style", "tag"],
    answer: "loop",
  },
  {
    q: "Array stores:",
    so: "Array wuxuu kaydiyaa:",
    options: [
      "List of values",
      "One value only",
      "CSS only",
      "HTML only",
    ],
    answer: "List of values",
  },
  {
    q: "Object example is:",
    so: "Tusaalaha Object waa:",
    options: ['{ name: "Ali" }', '["Ali"]', '"Ali"', "25"],
    answer: '{ name: "Ali" }',
  },
  {
    q: "Function is:",
    so: "Function waa:",
    options: [
      "Reusable code",
      "CSS color",
      "HTML tag",
      "Database",
    ],
    answer: "Reusable code",
  },
  {
    q: "Function returns value using:",
    so: "Function wuxuu qiime ku soo celiyaa isagoo isticmaalaya:",
    options: ["send", "return", "back", "give"],
    answer: "return",
  },
  {
    q: "DOM means:",
    so: "DOM waxaa loola jeedaa:",
    options: [
      "Document Object Model",
      "Design Object Mode",
      "Data Object Map",
      "Digital Online Method",
    ],
    answer: "Document Object Model",
  },
  {
    q: "Select element with:",
    so: "Element waxaa lagu doortaa:",
    options: [
      "querySelector()",
      "style()",
      "make()",
      "open()",
    ],
    answer: "querySelector()",
  },
  {
    q: "Click is a:",
    so: "Click waa:",
    options: ["Event", "Variable", "Array", "Object"],
    answer: "Event",
  },
  {
    q: "Strict equality is:",
    so: "Strict equality waa:",
    options: ["=", "==", "===", "!="],
    answer: "===",
  },
  {
    q: "Template literal uses:",
    so: "Template literal wuxuu isticmaalaa:",
    options: [
      "Single quotes",
      "Double quotes",
      "Backticks",
      "Parentheses",
    ],
    answer: "Backticks",
  },
  {
    q: "Arrow function example:",
    so: "Tusaalaha arrow function waa:",
    options: ["() => {}", "function()", "if {}", "for {}"],
    answer: "() => {}",
  },
  {
    q: "Async/await is for:",
    so: "Async/await waxaa loo isticmaalaa:",
    options: [
      "Waiting tasks",
      "Colors",
      "Fonts",
      "Tables",
    ],
    answer: "Waiting tasks",
  },
  {
    q: "Passing score is:",
    so: "Dhibcaha lagu gudbo waa:",
    options: ["40%", "50%", "60%", "70%"],
    answer: "70%",
  },
];

export default function JavaScriptQuizPage() {
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [messageEnglish, setMessageEnglish] = useState("");
  const [messageSomali, setMessageSomali] = useState("");
  const [loading, setLoading] = useState(false);

  function setBilingualMessage(
    english: string,
    somali: string,
  ) {
    setMessageEnglish(english);
    setMessageSomali(somali);
  }

  async function submitQuiz() {
    if (loading) return;

    const cleanStudentId = studentId.trim();
    const cleanTypedPhone = phone.replace(/\D/g, "");

    if (!cleanStudentId || !cleanTypedPhone) {
      setBilingualMessage(
        "⚠️ Enter Student ID and Phone Number first.",
        "⚠️ Marka hore geli Lambarka Ardayga iyo Lambarka Telefoonka.",
      );
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      setBilingualMessage(
        "⚠️ Please answer all questions before sending the quiz.",
        "⚠️ Fadlan ka jawaab dhammaan su'aalaha ka hor intaadan dirin quiz-ka.",
      );
      return;
    }

    try {
      setLoading(true);
      setScore(null);

      setBilingualMessage(
        "Saving JavaScript quiz result...",
        "Waxaa la kaydinayaa natiijada JavaScript quiz-ka...",
      );

      let correct = 0;

      questions.forEach((item, index) => {
        if (answers[index] === item.answer) {
          correct += 1;
        }
      });

      const finalScore = Math.round(
        (correct / questions.length) * 100,
      );

      const passed = finalScore >= 70;

      const { data: student, error: findError } =
        await supabase
          .from("students")
          .select("*")
          .eq("student_id", cleanStudentId)
          .maybeSingle();

      if (findError) {
        setBilingualMessage(
          `❌ Supabase error: ${findError.message}`,
          `❌ Cilad Supabase ah: ${findError.message}`,
        );
        return;
      }

      if (!student) {
        setBilingualMessage(
          "❌ Student not found.",
          "❌ Ardayga lama helin.",
        );
        return;
      }

      const cleanSavedPhone = String(
        student.phone || "",
      ).replace(/\D/g, "");

      if (cleanTypedPhone !== cleanSavedPhone) {
        setBilingualMessage(
          "❌ Phone number does not match this Student ID.",
          "❌ Lambarka telefoonku lama mid aha Lambarka Ardaygan.",
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("students")
        .update({
          js_completed: passed,

          // IMPORTANT:
          // Both score columns always receive
          // the newest submitted JavaScript score.
          js_score: finalScore,
          js_quiz_score: finalScore,

          js_certificate_status: passed
            ? "Ready"
            : "Not Ready",
        })
        .eq("student_id", cleanStudentId);

      if (updateError) {
        setBilingualMessage(
          `❌ JavaScript quiz result was not saved: ${updateError.message}`,
          `❌ Natiijada JavaScript quiz-ka lama kaydin: ${updateError.message}`,
        );
        return;
      }

      const { error: quizError } = await supabase
        .from("quiz_results")
        .insert({
          student_id: cleanStudentId,
          quiz_name: "JavaScript Quiz",
          course: "JavaScript",
          score: correct,
          total: questions.length,
          percentage: finalScore,
          passed,
        });

      if (quizError) {
        setBilingualMessage(
          `⚠️ Student score was updated, but quiz history could not be saved: ${quizError.message}`,
          `⚠️ Dhibcaha ardayga waa la cusboonaysiiyey, laakiin taariikhda quiz-ka lama kaydin karin: ${quizError.message}`,
        );

        setScore(finalScore);
        return;
      }

      setScore(finalScore);

      if (passed) {
        setBilingualMessage(
          `🎓 Passed! You scored ${finalScore}%. JavaScript Certificate unlocked.`,
          `🎓 Waad gudubtay! Waxaad heshay ${finalScore}%. Shahaadada JavaScript waa kuu furantay.`,
        );
      } else {
        setBilingualMessage(
          `✅ JavaScript quiz saved. You scored ${finalScore}%. You need 70% to pass.`,
          `✅ JavaScript quiz-ka waa la kaydiyey. Waxaad heshay ${finalScore}%. Waxaad u baahan tahay 70% si aad u gudubto.`,
        );
      }
    } catch (error: any) {
      setBilingualMessage(
        `❌ Unexpected error: ${
          error?.message || "Unknown error"
        }`,
        `❌ Cilad lama filaan ah: ${
          error?.message || "Cilad aan la garanayn"
        }`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        onPress={() =>
          router.push("/javascript-lecture")
        }
      >
        <Text style={styles.back}>
          ← Back to JavaScript Course
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        ⚡ JavaScript Quiz
      </Text>

      <Text style={styles.subtitle}>
        Enter your Student ID and Phone Number so your
        JavaScript result can be saved.
      </Text>

      <Text style={styles.label}>
        Student ID
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Example: EGA-2026-8527"
        value={studentId}
        onChangeText={setStudentId}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>
        Phone Number
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {questions.map((item, index) => (
        <View
          key={index}
          style={styles.questionBox}
        >
          <Text style={styles.question}>
            {index + 1}. {item.q}
          </Text>

          {item.options.map((option) => {
            const selected =
              answers[index] === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  selected &&
                    styles.selectedOption,
                ]}
                onPress={() =>
                  setAnswers((current) => ({
                    ...current,
                    [index]: option,
                  }))
                }
              >
                <Text style={styles.optionText}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.passBox}>
        <Text style={styles.passText}>
          Passing Score: 70%
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={submitQuiz}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? "Saving..."
            : "Send JavaScript Quiz"}
        </Text>
      </TouchableOpacity>

      {score !== null ? (
        <View style={styles.scoreBox}>
          <Text style={styles.score}>
            Score: {score}%
          </Text>
        </View>
      ) : null}

      {messageEnglish ? (
        <View style={styles.messageBox}>
          <Text style={styles.message}>
            {messageEnglish}
          </Text>
        </View>
      ) : null}

      {score !== null ? (
        <TouchableOpacity
          style={styles.certButton}
          onPress={() =>
            router.push("/javascript-certificate")
          }
        >
          <Text style={styles.certText}>
            🎓 Check JavaScript Certificate
          </Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },

  content: {
    padding: 20,
    paddingBottom: 60,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },

  back: {
    marginTop: 35,
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
  },

  backSomali: {
    marginTop: 4,
    marginBottom: 20,
    color: "#0a66c2",
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
  },

  titleSomali: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0a66c2",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    color: "#444",
    textAlign: "center",
  },

  subtitleSomali: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
  },

  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
  },

  labelSomali: {
    fontSize: 15,
    color: "#555",
    marginTop: 2,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 18,
  },

  questionBox: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  question: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#003366",
  },

  questionSomali: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
    marginTop: 4,
    marginBottom: 14,
  },

  option: {
    backgroundColor: "#eef3f8",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },

  selectedOption: {
    backgroundColor: "#d4af37",
  },

  optionText: {
    fontSize: 17,
  },

  passBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  passText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#003366",
  },

  passTextSomali: {
    fontSize: 16,
    color: "#555",
    fontWeight: "600",
    marginTop: 3,
  },

  button: {
    backgroundColor: "#003366",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  disabledButton: {
    backgroundColor: "#888",
  },

  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  buttonTextSomali: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  scoreBox: {
    marginTop: 25,
    alignItems: "center",
  },

  score: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#003366",
  },

  scoreSomali: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0a66c2",
    marginTop: 4,
  },

  messageBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
  },

  message: {
    textAlign: "center",
    fontSize: 19,
    fontWeight: "bold",
  },

  messageSomali: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
    marginTop: 6,
  },

  certButton: {
    backgroundColor: "#b8860b",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },

  certText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  certTextSomali: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
});