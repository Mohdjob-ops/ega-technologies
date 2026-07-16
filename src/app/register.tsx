import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import emailjs from "@emailjs/browser";
import { supabase } from "../lib/supabase";

const SERVICE_ID = "service_kkkr0xj";
const ADMIN_TEMPLATE_ID = "template_w01c7ku";
const STUDENT_TEMPLATE_ID = "template_9se77eg";
const PUBLIC_KEY = "eGuNf2PLEmedxzflY";
const COURSE_NAME = "Full Web Development";
const MAX_STUDENT_ID_ATTEMPTS = 8;
const ATTEMPT_SOURCE = "vercel-registration-page";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [fee, setFee] = useState("3000");
  const [startDate, setStartDate] = useState("Coming Soon");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "course_settings")
      .maybeSingle();

    if (error) {
      setMessage("⚠️ Settings load error: " + error.message);
      return;
    }

    if (data) {
      setFee(String(data.fee ?? "3000"));
      setStartDate(String(data.start_date ?? "Coming Soon"));
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
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  function formatFee(value: string) {
    return Number(value || 0).toLocaleString() + " Birr";
  }

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "");
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isDuplicateStudentIdError(error: any) {
    const message = String(error?.message || "").toLowerCase();

    return error?.code === "23505" && message.includes("student_id");
  }

  async function logRegistrationAttempt(
    status: string,
    statusMessage: string,
    studentId = ""
  ) {
    const { error } = await supabase.rpc("log_registration_attempt", {
      p_full_name: fullName.trim(),
      p_phone: normalizePhone(phone),
      p_email: email.trim().toLowerCase(),
      p_course: COURSE_NAME,
      p_status: status,
      p_status_message: statusMessage,
      p_student_id: studentId || null,
      p_source: ATTEMPT_SOURCE,
    });

    if (error) {
      console.log("Registration attempt log error:", error.message);
    }
  }

  async function stopWithMessage(status: string, statusMessage: string) {
    setMessage(statusMessage);
    await logRegistrationAttempt(status, statusMessage);
  }

  async function insertStudentWithUniqueId(studentPayload: any) {
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_STUDENT_ID_ATTEMPTS; attempt += 1) {
      const studentId = generateStudentId();
      const { error } = await supabase.from("students").insert({
        ...studentPayload,
        student_id: studentId,
      });

      if (!error) {
        return { studentId, error: null };
      }

      lastError = error;

      if (!isDuplicateStudentIdError(error)) {
        break;
      }
    }

    return { studentId: "", error: lastError };
  }

  async function handleRegister() {
    if (loading) return;

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      await stopWithMessage("validation_failed", "⚠️ Please fill all fields");
      return;
    }

    const cleanName = formatName(fullName);
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email.trim().toLowerCase();
    const courseFee = Number(fee || 0);

    if (cleanName.split(" ").length < 2) {
      await stopWithMessage("validation_failed", "⚠️ Please enter your full name");
      return;
    }

    if (cleanPhone.length < 9) {
      await stopWithMessage("validation_failed", "⚠️ Please enter a valid phone number");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      await stopWithMessage("validation_failed", "⚠️ Please enter a valid email address");
      return;
    }

    if (!Number.isFinite(courseFee) || courseFee <= 0) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Course fee is not ready. Please try again."
      );
      return;
    }

    setLoading(true);
    setMessage("Registering...");
    await logRegistrationAttempt("submitted", "Registration form submitted");

    const { data: existingStudent, error: checkError } = await supabase
      .from("students")
      .select("student_id, name, phone, email")
      .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      const statusMessage = "❌ Duplicate check error: " + checkError.message;
      setMessage(statusMessage);
      await logRegistrationAttempt("duplicate_check_error", statusMessage);
      return;
    }

    if (existingStudent) {
      setLoading(false);

      if (existingStudent.phone === cleanPhone) {
        const statusMessage =
          `❌ This phone number is already registered.\n\nStudent: ${existingStudent.name}\nStudent ID: ${existingStudent.student_id}\n\nPlease login to Learner Portal instead.`;
        setMessage(statusMessage);
        await logRegistrationAttempt(
          "duplicate_phone",
          statusMessage,
          existingStudent.student_id
        );
        return;
      }

      if (String(existingStudent.email).toLowerCase() === cleanEmail) {
        const statusMessage =
          `❌ This email address is already registered.\n\nStudent: ${existingStudent.name}\nStudent ID: ${existingStudent.student_id}\n\nPlease login to Learner Portal instead.`;
        setMessage(statusMessage);
        await logRegistrationAttempt(
          "duplicate_email",
          statusMessage,
          existingStudent.student_id
        );
        return;
      }
    }

    const { studentId, error } = await insertStudentWithUniqueId({
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
      const statusMessage = "❌ Registration error: " + error.message;
      setMessage(statusMessage);
      await logRegistrationAttempt("registration_error", statusMessage);
      return;
    }

    const { error: transactionError } = await supabase.from("transactions").insert({
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
      const statusMessage = "❌ Transaction error: " + transactionError.message;
      setMessage(statusMessage);
      await logRegistrationAttempt("transaction_error", statusMessage, studentId);
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
      start_date: startDate,
      logo_url: "https://dummyimage.com/160x60/12306d/ffffff.png&text=EGA",
    };

    const adminEmailData = {
      email: cleanEmail,
      to_email: "i.gennex2026@gmail.com",
      name: cleanName,
      from_name: cleanName,
      student_name: cleanName,
      student_email: cleanEmail,
      phone: cleanPhone,
      student_phone: cleanPhone,
      course: COURSE_NAME,
      fee: formatFee(fee),
      start_date: startDate,
      ...emailData,
    };

    const studentEmailData = {
      email: cleanEmail,
      to_email: cleanEmail,
      name: cleanName,
      from_name: cleanName,
      student_name: cleanName,
      student_email: cleanEmail,
      phone: cleanPhone,
      student_phone: cleanPhone,
      course: COURSE_NAME,
      fee: formatFee(fee),
      start_date: startDate,
      ...emailData,
    };

    console.log("ADMIN TEMPLATE:", ADMIN_TEMPLATE_ID);
    console.log("STUDENT TEMPLATE:", STUDENT_TEMPLATE_ID);

    const emailResults = await Promise.allSettled([
      emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, adminEmailData, PUBLIC_KEY),
      emailjs.send(SERVICE_ID, STUDENT_TEMPLATE_ID, studentEmailData, PUBLIC_KEY),
    ]);

    const adminEmailOk = emailResults[0].status === "fulfilled";
    const studentEmailOk = emailResults[1].status === "fulfilled";

    if (adminEmailOk && studentEmailOk) {
      const statusMessage =
        `✅ Registration Successful — Admin and student emails sent for ${cleanName}\n\nStudent ID: ${studentId}\nPhone: ${cleanPhone}\n\nUse this Student ID and Phone to login to Learner Portal.`;
      setMessage(statusMessage);
      await logRegistrationAttempt("success", statusMessage, studentId);
    } else {
      const errors = emailResults
        .map((result, index) => {
          if (result.status === "fulfilled") return "";
          const label = index === 0 ? "Admin email error" : "Student email error";
          const reason: any = result.reason;
          return label + ": " + (reason?.text || reason?.message || "Unknown email error");
        })
        .filter(Boolean)
        .join(" | ");

      const statusMessage = "✅ Registered, but email issue: " + errors;
      setMessage(statusMessage);
      await logRegistrationAttempt("email_error", statusMessage, studentId);
    }

    setFullName("");
    setPhone("");
    setEmail("");

    setLoading(false);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>
          Join EGA Technologies Web Development Training
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.info}>Course Fee: {fee} ETB</Text>
        <Text style={styles.info}>Start Date: {startDate}</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter full name"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registering..." : "Register Now"}
          </Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backText}>← Back to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#edf3ff",
  },
  header: {
    backgroundColor: "#12306d",
    padding: 40,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  icon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "#dbe7ff",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    margin: 18,
    padding: 18,
    borderRadius: 16,
  },
  info: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#12306d",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 8,
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
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  message: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#12306d",
  },
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backText: {
    color: "#12306d",
    fontSize: 16,
    fontWeight: "bold",
  },
});
