import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type StudentData = {
  student_id: string;
  name: string;
};

type QuestionState = {
  selected?: string;
  wrongAttempts: number;
  hintVisible: boolean;
  locked: boolean;
  correct: boolean;
};

type QuestionStates = Record<number, QuestionState>;

type AttemptData = {
  id: number;
  student_id: string;
  started_at: string;
  expires_at: string;
  submitted_at?: string | null;
  status: string;
};

const QUIZ_NAME = "AI Lessons 1-15 Assessment";
const TEST_SECONDS = 60 * 60;

const questions = [
  {
    lesson: "Lesson 1",
    question: "What is the main purpose of AI tools for developers?",
    options: [
      "To assist developers with tasks such as coding, learning, and problem solving",
      "To remove the need to understand programming",
      "To replace every programming language",
      "To guarantee that all generated code is correct",
    ],
    answer:
      "To assist developers with tasks such as coding, learning, and problem solving",
    hint:
      "Think about AI as an assistant that supports a developer rather than replacing the developer.",
  },
  {
    lesson: "Lesson 2",
    question:
      "What should a student expect from an AI developer course?",
    options: [
      "To learn how to use AI tools while still understanding and reviewing the work",
      "To copy every AI answer without checking it",
      "To avoid practicing programming",
      "To use only one AI tool forever",
    ],
    answer:
      "To learn how to use AI tools while still understanding and reviewing the work",
    hint:
      "The course combines AI assistance with the student's own understanding and judgment.",
  },
  {
    lesson: "Lesson 3",
    question:
      "Which statement best describes the role of modern AI developer tools?",
    options: [
      "Different tools may help with coding, explanations, debugging, research, or workflow",
      "Every AI tool performs exactly the same job",
      "AI developer tools work only with HTML",
      "AI tools can be used only by large companies",
    ],
    answer:
      "Different tools may help with coding, explanations, debugging, research, or workflow",
    hint:
      "Remember that developer AI tools can specialize in different kinds of assistance.",
  },
  {
    lesson: "Lesson 4",
    question:
      "Why can the result from an AI tool change even when a similar prompt is used?",
    options: [
      "AI systems and models can change, and generated responses are not always identical",
      "Computers are unable to repeat any task",
      "Programming languages change every minute",
      "The keyboard automatically changes the prompt",
    ],
    answer:
      "AI systems and models can change, and generated responses are not always identical",
    hint:
      "Think about changing AI models, updates, and the fact that generation is not always identical.",
  },
  {
    lesson: "Lesson 4",
    question:
      "What is a sensible approach to the cost of AI tools?",
    options: [
      "Check current plans and features because prices and limits can change",
      "Assume every AI tool will always be free",
      "Assume the most expensive tool is always best",
      "Ignore usage limits completely",
    ],
    answer:
      "Check current plans and features because prices and limits can change",
    hint:
      "AI services may change their subscriptions, limits, and available features.",
  },
  {
    lesson: "Lesson 5",
    question:
      "Why is it useful to understand categories of AI tools?",
    options: [
      "It helps you choose a tool that matches the task you need to perform",
      "It guarantees every generated answer is correct",
      "It removes the need to learn coding",
      "It means you must use every available AI tool",
    ],
    answer:
      "It helps you choose a tool that matches the task you need to perform",
    hint:
      "Different tasks can benefit from different kinds of AI assistance.",
  },
  {
    lesson: "Lesson 6",
    question: "What is prompt engineering?",
    options: [
      "Designing clearer instructions and questions to guide an AI system",
      "Installing a new computer processor",
      "Deleting all context before asking AI a question",
      "Publishing a website automatically",
    ],
    answer:
      "Designing clearer instructions and questions to guide an AI system",
    hint:
      "Focus on how you communicate your goal and instructions to the AI.",
  },
  {
    lesson: "Lesson 6",
    question:
      "Why is context useful when working with an AI assistant?",
    options: [
      "It gives the AI relevant background needed to produce a more useful response",
      "It guarantees the AI can never make an error",
      "It prevents the user from giving instructions",
      "It automatically converts every response into code",
    ],
    answer:
      "It gives the AI relevant background needed to produce a more useful response",
    hint:
      "Consider what happens when someone understands the background of a problem before answering.",
  },
  {
    lesson: "Lesson 7",
    question:
      "What is one important benefit of learning with a developer community?",
    options: [
      "Students can share knowledge, ask questions, and learn from other people's experience",
      "Students never need to practice by themselves",
      "Community members automatically write every project",
      "A community guarantees employment",
    ],
    answer:
      "Students can share knowledge, ask questions, and learn from other people's experience",
    hint:
      "Think about collaboration, questions, feedback, and shared experience.",
  },
  {
    lesson: "Lesson 8",
    question: "What is GitHub Copilot primarily designed to do?",
    options: [
      "Provide AI-assisted help while developers write and work with code",
      "Replace GitHub with a different website",
      "Operate only as a database",
      "Automatically purchase software",
    ],
    answer:
      "Provide AI-assisted help while developers write and work with code",
    hint:
      "Think about Copilot as an AI assistant inside a developer's coding workflow.",
  },
  {
    lesson: "Lesson 8",
    question:
      "Should a developer automatically trust every GitHub Copilot suggestion?",
    options: [
      "No, suggestions should be reviewed, understood, and tested",
      "Yes, every Copilot suggestion is guaranteed to be correct",
      "Yes, but only for long programs",
      "No, because Copilot cannot suggest code",
    ],
    answer:
      "No, suggestions should be reviewed, understood, and tested",
    hint:
      "AI-generated code is assistance, not a guarantee.",
  },
  {
    lesson: "Lesson 9",
    question:
      "Before using GitHub Copilot, what should a learner confirm?",
    options: [
      "That Copilot access and the required editor or setup are available",
      "That every project already contains AI-generated code",
      "That the computer has no internet browser",
      "That GitHub has been removed",
    ],
    answer:
      "That Copilot access and the required editor or setup are available",
    hint:
      "Think about account access and having the appropriate development environment ready.",
  },

  {
    lesson: "Lesson 10",
    question:
      "What should a developer do with an AI-powered code-completion suggestion?",
    options: [
      "Review, understand, and test it before accepting it",
      "Accept it automatically without reading it",
      "Assume it is secure because AI generated it",
      "Delete the entire project before using it",
    ],
    answer:
      "Review, understand, and test it before accepting it",
    hint:
      "Code completion provides suggestions, but the developer remains responsible for the final code.",
  },
  {
    lesson: "Lesson 11",
    question:
      "What should you do after Copilot creates or suggests an image for a PowerPoint presentation?",
    options: [
      "Review whether the image is accurate, appropriate, and relevant to the slide",
      "Assume every generated image is perfect",
      "Remove all text from the presentation",
      "Publish the image without checking it",
    ],
    answer:
      "Review whether the image is accurate, appropriate, and relevant to the slide",
    hint:
      "Generated visual content must still be checked before it is used.",
  },
  {
    lesson: "Lesson 12",
    question:
      "When using Copilot to create a PowerPoint from an existing file, what is important?",
    options: [
      "Use a clear source file and review the generated presentation for accuracy",
      "Delete the source file before Copilot reads it",
      "Assume Copilot will understand an empty document",
      "Skip reviewing the generated slides",
    ],
    answer:
      "Use a clear source file and review the generated presentation for accuracy",
    hint:
      "The quality of the source material and your final review both affect the presentation.",
  },
  {
    lesson: "Lesson 13",
    question:
      "What is a key benefit of GitHub Copilot integrated AI Chat?",
    options: [
      "It can provide assistance using the context of the developer's project and code",
      "It guarantees that every answer contains no errors",
      "It replaces the need to understand the project",
      "It works only when no project is open",
    ],
    answer:
      "It can provide assistance using the context of the developer's project and code",
    hint:
      "Integrated chat can use relevant development context to make its assistance more useful.",
  },
  {
    lesson: "Lesson 14",
    question:
      "What is a practical use of Inline Chat in Visual Studio Code?",
    options: [
      "Requesting focused help or changes near the code currently being edited",
      "Replacing the computer operating system",
      "Purchasing a GitHub subscription automatically",
      "Deleting every file in the workspace",
    ],
    answer:
      "Requesting focused help or changes near the code currently being edited",
    hint:
      "Inline Chat is designed for focused assistance close to the active code.",
  },
  {
    lesson: "Lesson 15",
    question:
      "What must you do before running a terminal command suggested by Copilot?",
    options: [
      "Read and understand the complete command and confirm its effects",
      "Run it immediately without reviewing it",
      "Share passwords and API keys with the chat",
      "Assume every suggested command is safe",
    ],
    answer:
      "Read and understand the complete command and confirm its effects",
    hint:
      "Terminal commands can affect files and systems, so review always comes first.",
  },

];

function emptyQuestionStates(): QuestionStates {
  const states: QuestionStates = {};

  questions.forEach((_, index) => {
    states[index] = {
      wrongAttempts: 0,
      hintVisible: false,
      locked: false,
      correct: false,
    };
  });

  return states;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

export default function AILessonsAssessment() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [assessmentLocked, setAssessmentLocked] = useState(false);

  const [questionStates, setQuestionStates] =
    useState<QuestionStates>(emptyQuestionStates());

  const [secondsLeft, setSecondsLeft] = useState(TEST_SECONDS);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const autoSubmitting = useRef(false);

  useEffect(() => {
    loadStudent();
  }, []);

  useEffect(() => {
    if (!started || submitted || !attempt) {
      return;
    }

    function updateTimer() {
      const expires = new Date(attempt!.expires_at).getTime();
      const remaining = Math.max(
        0,
        Math.ceil((expires - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining === 600) {
        setMessage("⏰ 10 minutes remaining.");
      } else if (remaining === 300) {
        setMessage("⏰ 5 minutes remaining.");
      } else if (remaining === 60) {
        setMessage("⏰ 1 minute remaining.");
      }

      if (remaining <= 0 && !autoSubmitting.current) {
        autoSubmitting.current = true;
        submitAssessment(true);
      }
    }

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [started, submitted, attempt, questionStates]);

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
        "⚠️ Please log in through the Learner Portal before taking the AI assessment."
      );
      setLoadingStudent(false);
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("student_id, name")
      .eq("student_id", savedStudentId)
      .maybeSingle();

    if (error || !data) {
      setMessage(
        "❌ Student information could not be verified. Return to the Learner Portal and log in again."
      );
      setLoadingStudent(false);
      return;
    }

    setStudent(data);

    const { data: existingResult, error: resultCheckError } =
      await supabase
        .from("quiz_results")
        .select("score, total, percentage, passed")
        .eq("student_id", data.student_id)
        .eq("quiz_name", QUIZ_NAME)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (resultCheckError) {
      setAssessmentLocked(true);
      setMessage(
        "❌ Could not verify your previous assessment status: " +
          resultCheckError.message
      );
      setLoadingStudent(false);
      return;
    }

    if (existingResult) {
      setAssessmentLocked(true);
      setMessage(
        `🔒 This AI assessment is already completed and cannot be taken again. Previous result: ${
          existingResult.score
        }/${existingResult.total} (${existingResult.percentage}%) — ${
          existingResult.passed ? "Passed" : "Not Passed"
        }. Contact EGA Admin if a new attempt is required.`
      );
      setLoadingStudent(false);
      return;
    }

    await restoreAttempt(data.student_id);

    setLoadingStudent(false);
  }

  async function restoreAttempt(studentId: string) {
    const { data, error } = await supabase
      .from("ai_quiz_attempts")
      .select("*")
      .eq("student_id", studentId)
      .eq("quiz_name", QUIZ_NAME)
      .eq("status", "In Progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return;
    }

    const restored = data as AttemptData;
    const remaining = Math.max(
      0,
      Math.ceil(
        (new Date(restored.expires_at).getTime() - Date.now()) / 1000
      )
    );

    setAttempt(restored);
    setStarted(true);
    setSecondsLeft(remaining);

    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(
        `ega_ai_assessment_state_${restored.id}`
      );

      if (savedState) {
        try {
          setQuestionStates(JSON.parse(savedState));
        } catch {
          setQuestionStates(emptyQuestionStates());
        }
      }
    }

    if (remaining <= 0) {
      autoSubmitting.current = false;
      setMessage(
        "⏰ This assessment attempt has expired and is being submitted automatically."
      );
    } else {
      setMessage(
        "▶️ Your existing assessment attempt has been restored. The original timer is still running."
      );
    }
  }

  async function startAssessment() {
    if (!student || started || saving || assessmentLocked) {
      return;
    }

    setSaving(true);
    setMessage("Starting your 60-minute assessment...");

    const expiresAt = new Date(
      Date.now() + TEST_SECONDS * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("ai_quiz_attempts")
      .insert({
        student_id: student.student_id,
        quiz_name: QUIZ_NAME,
        expires_at: expiresAt,
        status: "In Progress",
      })
      .select("*")
      .single();

    if (error || !data) {
      setMessage(
        "❌ The assessment could not start. " +
          (error?.message || "Please try again.")
      );
      setSaving(false);
      return;
    }

    setAttempt(data);
    setQuestionStates(emptyQuestionStates());
    setSecondsLeft(TEST_SECONDS);
    setStarted(true);
    setSubmitted(false);
    setSaving(false);
    setMessage(
      "✅ Test started. You have 60 minutes. Closing or refreshing the page will not restart the timer."
    );
  }

  function saveQuestionState(next: QuestionStates) {
    setQuestionStates(next);

    if (
      typeof window !== "undefined" &&
      attempt
    ) {
      localStorage.setItem(
        `ega_ai_assessment_state_${attempt.id}`,
        JSON.stringify(next)
      );
    }
  }

  function selectAnswer(questionIndex: number, option: string) {
    if (
      !started ||
      submitted ||
      saving ||
      secondsLeft <= 0
    ) {
      return;
    }

    const current = questionStates[questionIndex];

    if (!current || current.locked) {
      return;
    }

    const question = questions[questionIndex];
    const isCorrect = option === question.answer;

    const next: QuestionStates = {
      ...questionStates,
    };

    if (isCorrect) {
      next[questionIndex] = {
        ...current,
        selected: option,
        correct: true,
        locked: true,
      };

      saveQuestionState(next);
      return;
    }

    if (current.wrongAttempts === 0) {
      next[questionIndex] = {
        ...current,
        selected: option,
        wrongAttempts: 1,
        hintVisible: true,
        correct: false,
        locked: false,
      };

      saveQuestionState(next);

      setMessage(
        `💡 Question ${questionIndex + 1}: First attempt is incorrect. Read the hint and try once more.`
      );

      return;
    }

    next[questionIndex] = {
      ...current,
      selected: option,
      wrongAttempts: 2,
      hintVisible: true,
      correct: false,
      locked: true,
    };

    saveQuestionState(next);

    setMessage(
      `🔒 Question ${questionIndex + 1} is now locked after the second incorrect attempt.`
    );
  }

  async function submitAssessment(autoSubmit = false) {
    if (saving || submitted || !student || !attempt) {
      return;
    }

    const currentAttemptId = attempt.id;

    const { data: currentAttempt, error: attemptCheckError } = await supabase
      .from("ai_quiz_attempts")
      .select("status")
      .eq("id", currentAttemptId)
      .maybeSingle();

    if (
      attemptCheckError ||
      !currentAttempt ||
      currentAttempt.status !== "In Progress"
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(
          `ega_ai_assessment_state_${currentAttemptId}`
        );
      }

      setAttempt(null);
      setStarted(false);
      setSubmitted(false);
      setAssessmentLocked(false);
      setQuestionStates(emptyQuestionStates());
      setSecondsLeft(TEST_SECONDS);
      setMessage(
        "🔓 EGA Admin cancelled the previous attempt and allowed a retake. Press Start Test to begin a new 60-minute assessment."
      );
      return;
    }

    if (!autoSubmit) {
      const unfinishedQuestions = questions
        .map((_, index) => (!questionStates[index]?.locked ? index + 1 : null))
        .filter((number): number is number => number !== null);

      if (unfinishedQuestions.length > 0) {
        setMessage(
          `⚠️ Finish question${unfinishedQuestions.length > 1 ? "s" : ""}: ${unfinishedQuestions.join(", ")}. After one wrong answer, read the hint and make one final attempt.`
        );
        return;
      }
    }

    setSaving(true);

    const { data: existingResult, error: resultCheckError } =
      await supabase
        .from("quiz_results")
        .select("score, total, percentage, passed")
        .eq("student_id", student.student_id)
        .eq("quiz_name", QUIZ_NAME)
        .limit(1)
        .maybeSingle();

    if (resultCheckError) {
      setMessage(
        "❌ Could not verify previous assessment attempts: " +
          resultCheckError.message
      );
      setSaving(false);
      autoSubmitting.current = false;
      return;
    }

    if (existingResult) {
      setAssessmentLocked(true);
      setStarted(false);
      setMessage(
        `🔒 This AI assessment was already completed. Previous result: ${
          existingResult.score
        }/${existingResult.total} (${existingResult.percentage}%) — ${
          existingResult.passed ? "Passed" : "Not Passed"
        }. Contact EGA Admin if another attempt is required.`
      );
      setSaving(false);
      autoSubmitting.current = false;
      return;
    }

    if (autoSubmit) {
      setMessage("⏰ Time is up. Your test is being submitted automatically.");
    } else {
      setMessage("Saving your AI assessment result...");
    }

    let score = 0;

    questions.forEach((_, index) => {
      if (questionStates[index]?.correct) {
        score += 1;
      }
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    const { error: resultError } = await supabase
      .from("quiz_results")
      .insert({
        student_id: student.student_id,
        course: "AI Developer Course",
        quiz_name: QUIZ_NAME,
        score,
        total,
        percentage,
        passed,
      });

    if (resultError) {
      setMessage(
        "❌ Result could not be saved: " + resultError.message
      );
      setSaving(false);
      autoSubmitting.current = false;
      return;
    }

    const { error: attemptError } = await supabase
      .from("ai_quiz_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        status: autoSubmit ? "Time Expired" : "Submitted",
        score,
        total,
        percentage,
        passed,
      })
      .eq("id", attempt.id);

    if (attemptError) {
      setMessage(
        "❌ Score was saved, but the attempt status could not update: " +
          attemptError.message
      );
      setSaving(false);
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(
        `ega_ai_assessment_state_${attempt.id}`
      );
    }

    setSubmitted(true);
    setAssessmentLocked(true);
    setStarted(false);
    setSaving(false);

    setMessage(
      passed
        ? `🎉 ${student.name}, you passed the AI assessment. Score: ${score}/${total} (${percentage}%). This assessment is now locked.`
        : `📘 ${student.name}, your score is ${score}/${total} (${percentage}%). You did not pass. This assessment is now locked; contact EGA Admin if another attempt is required.`
    );
  }

  const timerUrgent = secondsLeft <= 300;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
    >
      <Link href="/learner-portal" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backText}>← Learner Portal</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.title}>
        🧠 AI Lessons 1–15 Assessment
      </Text>

      <Text style={styles.subtitle}>
        Start whenever you are ready. Your personal 60-minute timer begins
        only when you press Start Test.
      </Text>

      {loadingStudent ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Checking student information...
          </Text>
        </View>
      ) : student ? (
        <View style={styles.studentCard}>
          <Text style={styles.studentTitle}>
            {student.name}
          </Text>
          <Text style={styles.studentText}>
            Student ID: {student.student_id}
          </Text>
        </View>
      ) : (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Please log in through the Learner Portal first.
          </Text>
        </View>
      )}

      {student && !started && !submitted && !assessmentLocked && (
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>
            Assessment Rules
          </Text>

          <Text style={styles.rule}>
            • You may start at any time when you are ready.
          </Text>

          <Text style={styles.rule}>
            • You have 60 minutes after pressing Start Test.
          </Text>

          <Text style={styles.rule}>
            • The timer continues if you refresh or reopen the page.
          </Text>

          <Text style={styles.rule}>
            • First wrong answer: one hint and one more attempt.
          </Text>

          <Text style={styles.rule}>
            • Second wrong answer: that question locks.
          </Text>

          <Text style={styles.rule}>
            • Correct answers lock immediately.
          </Text>

          <Text style={styles.rule}>
            • The test automatically submits when time reaches 00:00.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={startAssessment}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Starting..." : "Start Test — 60 Minutes"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {student && started && !submitted && (
        <>
          <View
            style={[
              styles.timerCard,
              timerUrgent && styles.timerUrgent,
            ]}
          >
            <Text style={styles.timerLabel}>
              Time Remaining
            </Text>

            <Text
              style={[
                styles.timerText,
                timerUrgent && styles.timerUrgentText,
              ]}
            >
              {formatTime(secondsLeft)}
            </Text>
          </View>

          {questions.map((question, index) => {
            const state = questionStates[index];

            return (
              <View key={index} style={styles.card}>
                <Text style={styles.lessonLabel}>
                  {question.lesson}
                </Text>

                <Text style={styles.question}>
                  {index + 1}. {question.question}
                </Text>

                {question.options.map((option) => {
                  const selected =
                    state?.selected === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      disabled={
                        state?.locked ||
                        submitted ||
                        saving ||
                        secondsLeft <= 0
                      }
                      onPress={() =>
                        selectAnswer(index, option)
                      }
                      style={[
                        styles.option,
                        selected && styles.selectedOption,
                        state?.locked &&
                          state?.correct &&
                          selected &&
                          styles.correctOption,
                        state?.locked &&
                          !state?.correct &&
                          selected &&
                          styles.wrongOption,
                        state?.locked &&
                          styles.lockedOption,
                      ]}
                    >
                      <Text style={styles.optionText}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {state?.hintVisible &&
                  !state.correct && (
                    <View style={styles.hintCard}>
                      <Text style={styles.hintTitle}>
                        💡 Hint
                      </Text>

                      <Text style={styles.hintText}>
                        {question.hint}
                      </Text>
                    </View>
                  )}

                {state?.locked && state.correct && (
                  <Text style={styles.correctMessage}>
                    ✅ Answer accepted. Question locked.
                  </Text>
                )}

                {state?.locked && !state.correct && (
                  <Text style={styles.lockedMessage}>
                    🔒 Second attempt used. Question locked.
                  </Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[
              styles.submitButton,
              saving && styles.disabledButton,
            ]}
            disabled={saving}
            onPress={() => submitAssessment(false)}
          >
            <Text style={styles.buttonText}>
              {saving
                ? "Saving..."
                : "Submit Final Assessment"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}

      {submitted && (
        <Link href="/learner-portal" asChild>
          <TouchableOpacity style={styles.portalButton}>
            <Text style={styles.buttonText}>
              Return to Learner Portal
            </Text>
          </TouchableOpacity>
        </Link>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef3ff",
  },

  container: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 70,
  },

  backButton: {
    marginBottom: 18,
  },

  backText: {
    fontSize: 17,
    color: "#003366",
    fontWeight: "bold",
  },

  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
    color: "#475569",
    marginBottom: 24,
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
    textAlign: "center",
    fontWeight: "bold",
  },

  studentCard: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  studentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
  },

  studentText: {
    fontSize: 16,
    color: "#166534",
    marginTop: 5,
  },

  warningCard: {
    backgroundColor: "#fff7ed",
    padding: 18,
    borderRadius: 12,
  },

  warningText: {
    color: "#9a3412",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
  },

  instructionsCard: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  instructionsTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 14,
  },

  rule: {
    fontSize: 17,
    lineHeight: 26,
    color: "#334155",
    marginBottom: 7,
  },

  startButton: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  timerCard: {
    backgroundColor: "#e0f2fe",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#38bdf8",
  },

  timerUrgent: {
    backgroundColor: "#fff7ed",
    borderColor: "#f97316",
  },

  timerLabel: {
    fontSize: 17,
    color: "#334155",
    fontWeight: "bold",
  },

  timerText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#003366",
    marginTop: 4,
  },

  timerUrgentText: {
    color: "#c2410c",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  lessonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 7,
  },

  question: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 14,
  },

  option: {
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "transparent",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },

  selectedOption: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },

  correctOption: {
    backgroundColor: "#dcfce7",
    borderColor: "#16a34a",
  },

  wrongOption: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },

  lockedOption: {
    opacity: 0.8,
  },

  optionText: {
    fontSize: 16,
    lineHeight: 23,
    color: "#1e293b",
  },

  hintCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fbbf24",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },

  hintTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 5,
  },

  hintText: {
    fontSize: 16,
    lineHeight: 23,
    color: "#78350f",
  },

  correctMessage: {
    color: "#166534",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
  },

  lockedMessage: {
    color: "#991b1b",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
  },

  submitButton: {
    backgroundColor: "#003366",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  portalButton: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.6,
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
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  message: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003366",
  },
});
