import emailjs from "@emailjs/browser";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const SERVICE_ID = "service_kkkr0xj";
const ADMIN_TEMPLATE_ID = "template_w01c7ku";
const STUDENT_TEMPLATE_ID = "template_9se77eg";
const PUBLIC_KEY = "eGuNf2PLEmedxzflY";

const COURSE_NAME = "Full Web Development";
const MAX_STUDENT_ID_ATTEMPTS = 8;
const ATTEMPT_SOURCE = "vercel-registration-page";

const START_DATE_ANNOUNCEMENT =
  "The official course starting date will be announced later by the EGA administrator.";

const PAYMENT_ANNOUNCEMENT =
  "The full course fee is due on the student's registration date.";

const REFERRAL_ANNOUNCEMENT =
  "Registered students receive a 100 Birr reward for each new student they bring to register. The reward will be sent to the referring student's Ebirr or Kaddish Bank account after the new student's registration is confirmed.";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [fee, setFee] = useState("3000");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("fee")
      .eq("key", "course_settings")
      .maybeSingle();

    if (error) {
      setMessage("⚠️ Settings load error: " + error.message);
      return;
    }

    if (data) {
      setFee(String(data.fee ?? "3000"));
    }
  }

  function generateStudentId() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `EGA-2026-${random}`;
  }

  function formatName(name: string) {
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1).toLowerCase()
      )
      .join(" ");
  }

  function formatFee(value: string) {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
      return "0 Birr";
    }

    return amount.toLocaleString() + " Birr";
  }

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "");
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isDuplicateStudentIdError(error: any) {
    const errorMessage = String(
      error?.message || ""
    ).toLowerCase();

    return (
      error?.code === "23505" &&
      errorMessage.includes("student_id")
    );
  }

  async function logRegistrationAttempt(
    status: string,
    statusMessage: string,
    studentId = ""
  ) {
    const { error } = await supabase.rpc(
      "log_registration_attempt",
      {
        p_full_name: fullName.trim(),
        p_phone: normalizePhone(phone),
        p_email: email.trim().toLowerCase(),
        p_course: COURSE_NAME,
        p_status: status,
        p_status_message: statusMessage,
        p_student_id: studentId || null,
        p_source: ATTEMPT_SOURCE,
      }
    );

    if (error) {
      console.log(
        "Registration attempt log error:",
        error.message
      );
    }
  }

  async function stopWithMessage(
    status: string,
    statusMessage: string
  ) {
    setMessage(statusMessage);
    await logRegistrationAttempt(status, statusMessage);
  }

  async function insertStudentWithUniqueId(
    studentPayload: any
  ) {
    let lastError: any = null;

    for (
      let attempt = 0;
      attempt < MAX_STUDENT_ID_ATTEMPTS;
      attempt += 1
    ) {
      const studentId = generateStudentId();

      const { error } = await supabase
        .from("students")
        .insert({
          ...studentPayload,
          student_id: studentId,
        });

      if (!error) {
        return {
          studentId,
          error: null,
        };
      }

      lastError = error;

      if (!isDuplicateStudentIdError(error)) {
        break;
      }
    }

    return {
      studentId: "",
      error: lastError,
    };
  }

  async function handleRegister() {
    if (loading) {
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim()
    ) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please fill in all registration fields."
      );
      return;
    }

    const cleanName = formatName(fullName);
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email.trim().toLowerCase();
    const courseFee = Number(fee || 0);

    if (cleanName.split(" ").length < 2) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter your full name."
      );
      return;
    }

    if (cleanPhone.length < 9) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter a valid phone number."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter a valid email address."
      );
      return;
    }

    if (
      !Number.isFinite(courseFee) ||
      courseFee <= 0
    ) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Course fee is unavailable. Please try again."
      );
      return;
    }

    setLoading(true);
    setMessage("⏳ Registering student...");

    await logRegistrationAttempt(
      "submitted",
      "Registration form submitted"
    );

    const {
      data: existingStudent,
      error: checkError,
    } = await supabase
      .from("students")
      .select("student_id, name, phone, email")
      .or(
        `phone.eq.${cleanPhone},email.eq.${cleanEmail}`
      )
      .limit(1)
      .maybeSingle();

    if (checkError) {
      setLoading(false);

      const statusMessage =
        "❌ Duplicate check error: " +
        checkError.message;

      setMessage(statusMessage);

      await logRegistrationAttempt(
        "duplicate_check_error",
        statusMessage
      );

      return;
    }

    if (existingStudent) {
      setLoading(false);

      if (existingStudent.phone === cleanPhone) {
        const statusMessage =
          `❌ This phone number is already registered.` +
          `\n\nStudent: ${existingStudent.name}` +
          `\nStudent ID: ${existingStudent.student_id}` +
          `\n\nPlease use the Learner Portal instead.`;

        setMessage(statusMessage);

        await logRegistrationAttempt(
          "duplicate_phone",
          statusMessage,
          existingStudent.student_id
        );

        return;
      }

      if (
        String(existingStudent.email).toLowerCase() ===
        cleanEmail
      ) {
        const statusMessage =
          `❌ This email address is already registered.` +
          `\n\nStudent: ${existingStudent.name}` +
          `\nStudent ID: ${existingStudent.student_id}` +
          `\n\nPlease use the Learner Portal instead.`;

        setMessage(statusMessage);

        await logRegistrationAttempt(
          "duplicate_email",
          statusMessage,
          existingStudent.student_id
        );

        return;
      }
    }

    const { studentId, error } =
      await insertStudentWithUniqueId({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        language: "English",
        course: COURSE_NAME,
        fee: courseFee,
        paid_amount: 0,
        remaining_amount: courseFee,
        payment_status: "Pending",
        payment_method: "Not Selected",
        payment_reference: "Not Provided",
        paid_at: null,
      });

    if (error) {
      setLoading(false);

      const statusMessage =
        "❌ Registration error: " + error.message;

      setMessage(statusMessage);

      await logRegistrationAttempt(
        "registration_error",
        statusMessage
      );

      return;
    }

    const { error: transactionError } =
      await supabase.from("transactions").insert({
        student_id: studentId,
        student_name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        course: COURSE_NAME,
        amount: courseFee,
        status: "Pending",
        type: "Registration Fee",
      });

    if (transactionError) {
      setLoading(false);

      const statusMessage =
        "❌ Transaction error: " +
        transactionError.message;

      setMessage(statusMessage);

      await logRegistrationAttempt(
        "transaction_error",
        statusMessage,
        studentId
      );

      return;
    }

    const emailData = {
      full_name: cleanName,
      student_name: cleanName,
      student_email: cleanEmail,
      student_phone: cleanPhone,
      student_id: studentId,
      student_course: COURSE_NAME,

      course_fee: formatFee(fee),
      fee_text: formatFee(fee),
      fee: formatFee(fee),

      start_date: START_DATE_ANNOUNCEMENT,
      start_date_announcement:
        START_DATE_ANNOUNCEMENT,

      payment_announcement:
        PAYMENT_ANNOUNCEMENT,

      referral_reward: "100 Birr",
      referral_announcement:
        REFERRAL_ANNOUNCEMENT,

      registration_information:
        `${START_DATE_ANNOUNCEMENT}\n\n` +
        `${PAYMENT_ANNOUNCEMENT}\n\n` +
        `${REFERRAL_ANNOUNCEMENT}`,

      logo_url:
        "https://dummyimage.com/160x60/12306d/ffffff.png&text=EGA",
    };

    const adminEmailData = {
      ...emailData,
      email: cleanEmail,
      to_email: "i.gennex2026@gmail.com",
      name: cleanName,
      from_name: cleanName,
      phone: cleanPhone,
      course: COURSE_NAME,
    };

    const studentEmailData = {
      ...emailData,
      email: cleanEmail,
      to_email: cleanEmail,
      name: cleanName,
      from_name: "EGA Technologies",
      phone: cleanPhone,
      course: COURSE_NAME,
    };

    const emailResults = await Promise.allSettled([
      emailjs.send(
        SERVICE_ID,
        ADMIN_TEMPLATE_ID,
        adminEmailData,
        PUBLIC_KEY
      ),
      emailjs.send(
        SERVICE_ID,
        STUDENT_TEMPLATE_ID,
        studentEmailData,
        PUBLIC_KEY
      ),
    ]);

    const adminEmailOk =
      emailResults[0].status === "fulfilled";

    const studentEmailOk =
      emailResults[1].status === "fulfilled";

    if (adminEmailOk && studentEmailOk) {
      const statusMessage =
        `✅ Registration Successful!` +
        `\n\nStudent: ${cleanName}` +
        `\nStudent ID: ${studentId}` +
        `\nPhone: ${cleanPhone}` +
        `\nCourse Fee: ${formatFee(fee)}` +
        `\nPayment Status: Pending` +
        `\n\nThe course starting date will be announced later by the administrator.` +
        `\n\nUse your Student ID and phone number to log in to the Learner Portal.` +
        `\n\nA confirmation email has been sent.`;

      setMessage(statusMessage);

      await logRegistrationAttempt(
        "success",
        statusMessage,
        studentId
      );
    } else {
      const errors = emailResults
        .map((result, index) => {
          if (result.status === "fulfilled") {
            return "";
          }

          const label =
            index === 0
              ? "Admin email error"
              : "Student email error";

          const reason: any = result.reason;

          return (
            label +
            ": " +
            (reason?.text ||
              reason?.message ||
              "Unknown email error")
          );
        })
        .filter(Boolean)
        .join(" | ");

      const statusMessage =
        `✅ Registration completed.` +
        `\n\nStudent ID: ${studentId}` +
        `\n\n⚠️ Email delivery issue: ${errors}`;

      setMessage(statusMessage);

      await logRegistrationAttempt(
        "email_error",
        statusMessage,
        studentId
      );
    }

    setFullName("");
    setPhone("");
    setEmail("");
    setLoading(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.icon}>📝</Text>

        <Text style={styles.title}>
          Student Registration
        </Text>

        <Text style={styles.subtitle}>
          Join EGA Technologies Web Development Training
        </Text>
      </View>

      <View style={styles.card}>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backText}>
              ← Back to Home
            </Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.courseBox}>
          <Text style={styles.courseTitle}>
            {COURSE_NAME}
          </Text>

          <Text style={styles.feeText}>
            Course Fee: {formatFee(fee)}
          </Text>

          <Text style={styles.paymentText}>
            The course fee must be paid on the
            registration date.
          </Text>

          <Text style={styles.startText}>
            📅 The official course starting date will
            be announced later by the administrator.
          </Text>
        </View>

        <View style={styles.rewardBox}>
          <Text style={styles.rewardTitle}>
            🎁 Student Referral Reward
          </Text>

          <Text style={styles.rewardText}>
            Bring another student to register and
            receive 100 Birr for each confirmed
            registration.
          </Text>

          <Text style={styles.rewardText}>
            The reward will be sent to your Ebirr or
            Kaddish Bank account.
          </Text>
        </View>

        <Text style={styles.label}>Full Name</Text>

        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Phone Number</Text>

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email Address</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Registering..."
              : "Register Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#edf3ff",
  },
  pageContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#12306d",
    paddingTop: 40,
    paddingBottom: 35,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  icon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#dbe7ff",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 14,
  },
  backText: {
    color: "#12306d",
    fontSize: 17,
    fontWeight: "bold",
  },
  courseBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  courseTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#12306d",
    marginBottom: 10,
  },
  feeText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#15803d",
    marginBottom: 7,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9a3412",
    lineHeight: 23,
    marginBottom: 10,
  },
  startText: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 24,
  },
  rewardBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9a3412",
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 16,
    color: "#7c2d12",
    lineHeight: 24,
    marginBottom: 5,
  },
  label: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#12306d",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 8,
  },
  messageBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 12,
    padding: 15,
    marginTop: 18,
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "bold",
    color: "#12306d",
  },
  button: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 18,
  },
  disabledButton: {
    backgroundColor: "#86efac",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});