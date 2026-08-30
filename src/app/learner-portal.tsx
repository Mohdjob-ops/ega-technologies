import { Link } from "expo-router";
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

const aiLessons = [
  {
    title: "Lesson 1: AI Tools Course Introduction",
    path: "/ai-lessons/lesson-01-ai-tools-course-introduction.html",
  },
  {
    title: "Lesson 2: What to Expect from the AI Developer Course",
    path: "/ai-lessons/lesson-02-what-to-expect-from-the-ai-developer-course.html",
  },
  {
    title: "Lesson 3: Main AI Tools for Developers",
    path: "/ai-lessons/lesson-03-main-ai-tools-for-developers.html",
  },
  {
    title: "Lesson 4: AI Tool Costs and Changing Results",
    path: "/ai-lessons/lesson-04-ai-tool-costs-and-changing-results.html",
  },
  {
    title: "Lesson 5: Categories of AI Tools",
    path: "/ai-lessons/lesson-05-categories-of-ai-tools.html",
  },
  {
    title: "Lesson 6: Prompt and Context Engineering Recommendations",
    path: "/ai-lessons/lesson-06-prompt-and-context-engineering-recommendations.html",
  },
  {
    title: "Lesson 7: Learning with a Community",
    path: "/ai-lessons/lesson-07-learning-with-a-community.html",
  },
  {
    title: "Lesson 8: Introduction to GitHub Copilot",
    path: "/ai-lessons/lesson-08-github-copilot-for-ai-developers.html",
  },
  {
    title: "Lesson 9: GitHub Copilot Core Features",
    path: "/ai-lessons/lesson-09-understanding-github-copilot-access-and-setup.html",
  },
  {
    title: "Lesson 10: GitHub Copilot Features and AI-Powered Code Completion",
    path: "/ai-lessons/lesson-10-github-copilot-features-and-ai-powered-code-completion.html",
  },
  {
    title: "Lesson 11: Creating and Adding AI Images with Copilot in PowerPoint",
    path: "/ai-lessons/lesson-11-creating-and-adding-ai-images-with-copilot-in-powerpoint.html",
  },
  {
    title: "Lesson 12: Creating a PowerPoint from an Existing File",
    path: "/ai-lessons/lesson-12-creating-powerpoint-from-existing-file.html",
  },
  {
    title: "Lesson 13: GitHub Copilot Integrated AI Chat",
    path: "/ai-lessons/lesson-13-github-copilot-integrated-ai-chat.html",
  },
  {
    title: "Lesson 14: Using Inline Chat and Quick Chat",
    path: "/ai-lessons/lesson-14-using-inline-and-quick-chat.html",
  },
  {
    title: "Lesson 15: Using Inline Chat in the Terminal",
    path: "/ai-lessons/lesson-15-using-inline-chat-in-the-terminal.html",
  },
];

const chatgptLessons = [
  {
    title: "Lesson 1: ChatGPT and Apps",
    path: "/courses/chatgpt/lesson-01-chatgpt-and-apps.html",
  },
];

export default function LearnerPortal() {
  const [studentId, setStudentId] = useState(() => {
    if (typeof window !== "undefined") {
      const savedStudentId =
        sessionStorage.getItem("ega_student_id") || "";

      return savedStudentId
        .replace(/^EGA-2026-/i, "")
        .replace(/\D/g, "");
    }

    return "";
  });
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("ega_student_phone") || "";
    }
    return "";
  });
  const [student, setStudent] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function cleanPhone(value: string) {
    return value.replace(/\D/g, "");
  }

  async function handleLogin() {
    if (loading) return;

    setLoading(true);
    setMessage("Checking login...");
    setStudent(null);
    setQuizResults([]);

    const studentIdDigits = studentId
      .trim()
      .replace(/^EGA-2026-/i, "")
      .replace(/\D/g, "");

    const cleanStudentId = studentIdDigits
      ? `EGA-2026-${studentIdDigits}`
      : "";

    const cleanLoginPhone = cleanPhone(phone);

    if (!studentIdDigits || !cleanLoginPhone) {
      setMessage(
        "⚠️ Please enter your Student ID digits and Phone Number"
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke(
      "learner-access",
      {
        body: {
          student_id: cleanStudentId,
          phone: cleanLoginPhone,
        },
      }
    );

    if (error) {
      setMessage(
        "❌ Student ID or phone number is incorrect."
      );
      setLoading(false);
      return;
    }

    if (!data?.success || !data?.student) {
      setMessage(
        data?.message ||
          "❌ Student ID or phone number is incorrect."
      );
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "ega_student_id",
        cleanStudentId
      );
      sessionStorage.setItem(
        "ega_student_phone",
        cleanLoginPhone
      );
      localStorage.setItem(
        "student_id",
        data.student.student_id
      );
    }

    setStudentId(studentIdDigits);
    setStudent(data.student);
    setQuizResults(data.quiz_results || []);
    setMessage("✅ Login successful");
    setLoading(false);
  }

  function beginEditProfile() {
    if (!student) return;

    setEditPhone(student.phone || "");
    setEditEmail(student.email || "");
    setProfileMessage("");
    setEditingProfile(true);
  }

  function cancelEditProfile() {
    setEditPhone("");
    setEditEmail("");
    setProfileMessage("");
    setEditingProfile(false);
  }

  async function saveProfile() {
    if (student == null || savingProfile) return;

    const newPhone = cleanPhone(editPhone);
    const newEmail = editEmail.trim().toLowerCase();

    if (newPhone.length < 9) {
      setProfileMessage("❌ Enter a valid phone number.");
      return;
    }

    if (newEmail.indexOf("@") < 1 || newEmail.indexOf(".") < 0) {
      setProfileMessage("❌ Enter a valid email address.");
      return;
    }

    setSavingProfile(true);
    setProfileMessage("Saving...");

    const { data, error } = await supabase
      .from("students")
      .update({ phone: newPhone, email: newEmail })
      .eq("student_id", student.student_id)
      .select("*")
      .single();

    if (error) {
      setProfileMessage(
        error.code === "23505"
          ? "❌ Phone or email already belongs to another student."
          : "❌ Update failed: " + error.message
      );
      setSavingProfile(false);
      return;
    }

    setStudent(data);
    setPhone(newPhone);
    setEditingProfile(false);
    setProfileMessage("✅ Profile updated successfully.");
    setSavingProfile(false);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("ega_student_phone", newPhone);
    }
  }

  function logout() {
    setStudent(null);
    setQuizResults([]);
    setStudentId("");
    setPhone("");
    setMessage("");
  }

  async function openAiLesson(path: string) {
    if (!student) return;

    try {
      const { error } = await supabase.functions.invoke(
        "learner-access",
        {
          body: {
            student_id: student.student_id,
            phone: student.phone,
            activity_type: "AI_LESSON_OPEN",
            lesson_path: path,
          },
        }
      );

      if (error) {
        console.error(
          "AI lesson activity logging failed:",
          error
        );
      }
    } catch (error) {
      console.error(
        "AI lesson activity logging failed:",
        error
      );
    }

    if (typeof window !== "undefined") {
      window.location.href = path;
      return;
    }

    setMessage("⚠️ Open the EGA web portal to view the AI lessons.");
  }

  const isPaid = student?.payment_status === "Paid";

  const now = new Date();
  const freeAiStart = new Date(2026, 7, 30);
  const freeAiEnd = new Date(2026, 8, 21);

  const hasFreeAiAccess =
    now >= freeAiStart && now < freeAiEnd;

  const canAccessAiLessons = isPaid || hasFreeAiAccess;

  /*
   * quizResults is already ordered newest → oldest.
   * Keep ONLY the newest attempt for each quiz.
   */
  const latestQuizResults = quizResults.filter(
    (result, index, array) =>
      index ===
      array.findIndex(
        (item) =>
          String(item.quiz_name || "").trim().toLowerCase() ===
          String(result.quiz_name || "").trim().toLowerCase()
      )
  );

  function findLatestQuiz(names: string[]) {
    const normalizedNames = names.map((name) => name.toLowerCase());

    return latestQuizResults.find((q) =>
      normalizedNames.includes(
        String(q.quiz_name || "").trim().toLowerCase()
      )
    );
  }

  function quizPassed(
    latestResult: any,
    studentScore: any,
    certificateStatus?: any,
    completed?: any
  ) {
    if (latestResult) {
      const percentage = Number(
        latestResult.percentage ?? latestResult.score ?? 0
      );

      return latestResult.passed === true || percentage >= 70;
    }

    const savedScore = Number(studentScore ?? 0);

    return (
      savedScore >= 70 ||
      certificateStatus === "Ready" ||
      completed === true
    );
  }

  const latestHtmlQuiz = findLatestQuiz([
    "HTML Quiz",
    "HTML Fundamentals Quiz",
  ]);

  const latestCssQuiz = findLatestQuiz([
    "CSS Quiz",
    "CSS Fundamentals Quiz",
  ]);

  const latestJsQuiz = findLatestQuiz([
    "JavaScript Quiz",
    "Javascript Quiz",
    "JavaScript Fundamentals Quiz",
  ]);

  const htmlPassed = quizPassed(
    latestHtmlQuiz,
    student?.html_quiz_score ?? student?.html_score,
    student?.html_certificate_status,
    student?.html_completed
  );

  const cssPassed = quizPassed(
    latestCssQuiz,
    student?.css_quiz_score ?? student?.css_score,
    student?.css_certificate_status,
    student?.css_completed
  );

  const jsPassed = quizPassed(
    latestJsQuiz,
    student?.js_quiz_score ?? student?.js_score,
    student?.js_certificate_status,
    student?.js_completed
  );

  const fullProgramPassed =
    htmlPassed &&
    cssPassed &&
    jsPassed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" style={styles.back}>
        ← Back to Home
      </Link>

      <Text style={styles.title}>🎓 My EGA</Text>

      <Text style={styles.subtitle}>
        Enter My EGA to view your lessons, payments, progress, assessments, results, and certificates.
      </Text>

      {!student && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter My EGA</Text>

          <Text style={styles.text}>
            Student ID: EGA-2026-
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your ID digits"
            value={studentId}
            onChangeText={(value) =>
              setStudentId(
                value
                  .replace(/^EGA-2026-/i, "")
                  .replace(/\D/g, "")
              )
            }
            keyboardType="number-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Checking..." : "Login"}
            </Text>
          </TouchableOpacity>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      )}

      {student && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student Information</Text>

            <Text style={styles.text}>Name: {student.name}</Text>

            <Text style={styles.text}>
              Student ID: {student.student_id}
            </Text>

            <Text style={styles.text}>
              Email: {student.email || "Not Provided"}
            </Text>

            <Text style={styles.text}>
              Phone: {student.phone}
            </Text>

            <Text style={styles.text}>
              Course: {student.course || "Not Selected"}
            </Text>

            <Text style={styles.text}>
              Language: {student.language || "Not Selected"}
            </Text>
            {!editingProfile ? (
              <TouchableOpacity style={styles.startButton} onPress={beginEditProfile}>
                <Text style={styles.buttonText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} placeholder="Phone Number" keyboardType="phone-pad" />
                <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} placeholder="Email Address" autoCapitalize="none" />
                <TouchableOpacity style={styles.startButton} onPress={saveProfile} disabled={savingProfile}>
                  <Text style={styles.buttonText}>{savingProfile ? "Saving..." : "💾 Save Profile Changes"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutButton} onPress={cancelEditProfile}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {profileMessage ? <Text style={styles.message}>{profileMessage}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Status</Text>

            <View style={isPaid ? styles.paidBox : styles.pendingBox}>
              <Text style={isPaid ? styles.paidText : styles.pendingText}>
                {isPaid ? "Paid" : "Pending"}
              </Text>
            </View>

            <Text style={styles.text}>
              Method: {student.payment_method || "Not Selected"}
            </Text>

            <Text style={styles.text}>
              Reference: {student.payment_reference || "Not Provided"}
            </Text>

            <Text style={styles.text}>
              Paid Date: {student.paid_at || "Not Paid Yet"}
            </Text>

            <Text style={styles.text}>
              Fee: {student.fee ? `${student.fee} Birr` : "Not Set"}
            </Text>

            {isPaid ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  ✅ Payment confirmed. Lessons and quizzes are unlocked.
                </Text>


              </View>
            ) : (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Payment pending. Complete payment to unlock lessons,
                  quizzes, and certificates.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              🤖 1. AI Developer Course — START HERE
            </Text>

            {canAccessAiLessons ? (
              <>
                <Text style={styles.sectionDescription}>
                  Start here. Complete the AI lessons in order. / Halkan ka bilow. Casharrada AI-ga u baro sida ay u kala horreeyaan.
                </Text>

                {hasFreeAiAccess && !isPaid && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>
                      ✅ Free AI lesson access is active from September 1–20, 2026.
                    </Text>
                  </View>
                )}

                {aiLessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.path}
                    style={styles.aiLessonButton}
                    onPress={() => openAiLesson(lesson.path)}
                  >
                    <Text style={styles.aiLessonButtonText}>
                      {lesson.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                {isPaid && (
                  <Link href="/quiz" asChild>
                    <TouchableOpacity style={styles.startButton}>
                      <Text style={styles.buttonText}>
                        🧠 AI Lessons 1–15 Assessment — 60 Minutes
                      </Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </>
            ) : (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  🔒 AI lessons are locked until payment is confirmed or the free AI period begins.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              💬 2. ChatGPT Course — START HERE
            </Text>

            {isPaid ? (
              <>
                <Text style={styles.sectionDescription}>
                  Learn how to use ChatGPT, connected apps, plugins, and
                  practical AI features. Complete the lessons in order.
                </Text>

                {chatgptLessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.path}
                    style={styles.aiLessonButton}
                    onPress={() => openAiLesson(lesson.path)}
                  >
                    <Text style={styles.aiLessonButtonText}>
                      {lesson.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  🔒 ChatGPT lessons are locked until payment is confirmed.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              🌐 Web Development — After AI
            </Text>

            <Text style={styles.sectionDescription}>
              Continue here after completing the AI lessons.
              {"\n"}
              Halkan ka sii wad marka aad dhammayso casharrada AI-ga.
            </Text>

            {isPaid ? (
              <>
                <Link href="/html-lecture" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      2. Start HTML Course / Bilow Koorsada HTML
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/css-lecture" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      3. Start CSS Course / Bilow Koorsada CSS
                    </Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/javascript-lecture" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      4. Start JavaScript Course / Bilow Koorsada JavaScript
                    </Text>
                  </TouchableOpacity>
                </Link>
              </>
            ) : (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  🔒 Web Development courses are locked until payment is confirmed.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Latest Quiz Results</Text>

            {latestQuizResults.length === 0 ? (
              <Text style={styles.text}>
                No quiz results yet.
              </Text>
            ) : (
              latestQuizResults.map((q, index) => {
                const percentage = Number(
                  q.percentage ?? q.score ?? 0
                );

                const passed =
                  q.passed === true || percentage >= 70;

                return (
                  <View
                    key={q.id || `${q.quiz_name}-${index}`}
                    style={styles.quizRow}
                  >
                    <Text style={styles.text}>
                      {q.quiz_name || "Quiz"}: {percentage}%{" "}
                      {passed ? "✅ Passed" : "❌ Failed"}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Certificate Status
            </Text>

            {isPaid && htmlPassed ? (
              <>
                <Text style={styles.successText}>
                  🎓 HTML Certificate Ready ✅
                </Text>

                <Link href="/html-certificate" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      Open HTML Certificate
                    </Text>
                  </TouchableOpacity>
                </Link>
              </>
            ) : isPaid ? (
              <Text style={styles.text}>
                🔓 Certificate will unlock after passing the HTML quiz.
              </Text>
            ) : (
              <Text style={styles.text}>
                🔒 Certificate locked until full payment is confirmed.
              </Text>
            )}

            {isPaid && cssPassed && (
              <>
                <Text style={styles.successText}>
                  🎓 CSS Certificate Ready ✅
                </Text>

                <Link href="/css-certificate" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      Open CSS Certificate
                    </Text>
                  </TouchableOpacity>
                </Link>
              </>
            )}

            {isPaid && jsPassed && (
              <>
                <Text style={styles.successText}>
                  🎓 JavaScript Certificate Ready ✅
                </Text>

                <Link href="/javascript-certificate" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      Open JavaScript Certificate
                    </Text>
                  </TouchableOpacity>
                </Link>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              🏆 Full Web Development Certificate
            </Text>

            {isPaid && fullProgramPassed ? (
              <>
                <Text style={styles.successText}>
                  🎉 Congratulations! Full Web Development Certificate Ready ✅
                </Text>

                <Link href="/master-certificate" asChild>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.buttonText}>
                      View Final Certificate
                    </Text>
                  </TouchableOpacity>
                </Link>
              </>
            ) : (
              <>
                <Text style={styles.text}>
                  🔒 Final certificate unlocks after payment and passing HTML,
                  CSS, and JavaScript quizzes.
                </Text>

                {isPaid && (
                  <>
                    <Text style={styles.text}>
                      HTML: {htmlPassed ? "✅ Passed" : "❌ Not Passed"}
                    </Text>

                    <Text style={styles.text}>
                      CSS: {cssPassed ? "✅ Passed" : "❌ Not Passed"}
                    </Text>

                    <Text style={styles.text}>
                      JavaScript: {jsPassed ? "✅ Passed" : "❌ Not Passed"}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.buttonText}>
              Logout
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3ff",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  back: {
    fontSize: 18,
    color: "#003366",
    fontWeight: "bold",
    marginBottom: 20,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 18,
    color: "#475569",
    textAlign: "center",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 18,
    marginBottom: 22,
  },

  cardTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 18,
  },

  sectionDescription: {
    fontSize: 17,
    color: "#475569",
    lineHeight: 25,
    marginBottom: 16,
  },

  input: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    width: "70%",
    maxWidth: 520,
    minWidth: 260,
    alignSelf: "center",
  },

  loginButton: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "32%",
    maxWidth: 240,
    minWidth: 160,
    alignSelf: "center",
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  message: {
    marginTop: 15,
    marginBottom: 15,
    fontSize: 17,
    textAlign: "center",
    color: "#003366",
    fontWeight: "bold",
  },

  text: {
    fontSize: 18,
    color: "#334155",
    marginBottom: 10,
  },

  quizRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },

  paidBox: {
    backgroundColor: "#dcfce7",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },

  paidText: {
    color: "#166534",
    fontSize: 28,
    fontWeight: "bold",
  },

  pendingBox: {
    backgroundColor: "#fef3c7",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },

  pendingText: {
    color: "#92400e",
    fontSize: 28,
    fontWeight: "bold",
  },

  successBox: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
  },

  successText: {
    color: "#166534",
    fontSize: 17,
    marginBottom: 15,
    fontWeight: "bold",
  },

  warningBox: {
    backgroundColor: "#fff7ed",
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
  },

  warningText: {
    color: "#9a3412",
    fontSize: 17,
    fontWeight: "bold",
  },

  startButton: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  aiLessonButton: {
    backgroundColor: "#1d4ed8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  aiLessonButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  logoutButton: {
    backgroundColor: "#b00020",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
