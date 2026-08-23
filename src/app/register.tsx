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

const COURSE_NAME = "AI Developer Course";
const MAX_STUDENT_ID_ATTEMPTS = 8;
const ATTEMPT_SOURCE = "vercel-registration-page";

const START_DATE_ANNOUNCEMENT =
  "The course will officially start on September 1, 2026, both online and offline. / Koorsadu waxay si rasmi ah u bilaaban doontaa 1-da Sebtembar 2026, iyadoo lagu baran doono online iyo offline labadaba.";

const PAYMENT_ANNOUNCEMENT =
  "The full course fee is due on the student's registration date.";

const REFERRAL_ANNOUNCEMENT =
  "EGA Referral Reward: For the 3,000 Birr monthly plan, the referring student earns 150 Birr after every completed 10 days of verified qualifying attendance: 150 Birr after 10 days, 300 Birr cumulative after 20 days, and 450 Birr cumulative after 30 days. For the $15 USD English/International monthly plan, the reward is $0.75 after 10 days, $1.50 cumulative after 20 days, and $2.25 cumulative after 30 days. Rewards require confirmed payment and verified attendance. Each 10-day milestone can be credited only once.";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [referralStudentId, setReferralStudentId] = useState("");

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
    const cleanReferralStudentId = referralStudentId.trim().toUpperCase();
    const courseFee = Number(fee || 0);

    if (cleanName.split(" ").length < 2) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter your full name.\n⚠️ Fadlan geli magacaaga oo buuxa."
      );
      return;
    }

    if (cleanPhone.length < 9) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter a valid phone number.\n⚠️ Fadlan geli lambar taleefan oo sax ah."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Please enter a valid email address.\n⚠️ Fadlan geli cinwaan iimayl oo sax ah."
      );
      return;
    }

    if (
      !Number.isFinite(courseFee) ||
      courseFee <= 0
    ) {
      await stopWithMessage(
        "validation_failed",
        "⚠️ Course fee is unavailable. Please try again.\n⚠️ Lacagta koorsada lama heli karo. Fadlan isku day mar kale."
      );
      return;
    }

    let verifiedReferrer: any = null;

    if (cleanReferralStudentId) {
      const { data: referrer, error: referrerError } =
        await supabase
          .from("students")
          .select("student_id, name, email, phone")
          .eq("student_id", cleanReferralStudentId)
          .maybeSingle();

      if (referrerError || !referrer) {
        setMessage(
  "❌ Referral Student ID was not found.\n❌ Student ID-ga ardayga ku soo gudbiyey lama helin."
);
        return;
      }

      verifiedReferrer = referrer;
    }

    setLoading(true);
    setMessage("⏳ Registering student...\n⏳ Ardayga waa la diiwaangelinayaa...");

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
        referred_by_student_id: verifiedReferrer?.student_id || null,
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

      referral_reward:
        "Birr plan: 150 Birr every completed 10 qualifying days, maximum 450 Birr per month. USD plan: $0.75 every completed 10 qualifying days, maximum $2.25 per month.",
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
              ← Back to Home / Ku Noqo Bogga Hore
            </Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.courseBox}>
          <Text style={styles.courseTitle}>
            {COURSE_NAME}
            {"\n"}
            Koorsada Horumarinta AI-ga
          </Text>

          <Text style={styles.feeText}>
            Course Fee: {formatFee(fee)}
            {"\n"}
            Lacagta Koorsada: {formatFee(fee)}
          </Text>

          <Text style={styles.paymentText}>
            The course fee must be paid on the
            registration date.
          </Text>

          <Text style={styles.startText}>
            📅 The course will officially start on September 1, 2026, both online and offline.
            {"\n"}
            📅 Koorsadu waxay si rasmi ah u bilaaban doontaa 1-da Sebtembar 2026, iyadoo lagu baran doono online iyo offline labadaba.
          </Text>
        </View>

        <View style={styles.referralCardsRow}>
          <View style={{ display: "none" }} accessibilityElementsHidden>
            <Text style={styles.somaliReferralTitle}>
              🇪🇹 ABAALMARINTA EGA EE ARDAYGA
            </Text>

            <Text style={styles.referralLanguage}>
              Somali Speakers
            </Text>

            <Text style={styles.referralIntro}>
              Ku soo xiro arday kale si uu isu diiwaangeliyo oo hel abaalmarin adigu.
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralPlanTitle}>
              🇪🇹 Qorshaha 3,000 Birr Bishii
            </Text>

            <Text style={styles.referralLine}>
              ✅ 10 maalmood oo la xaqiijiyay → 150 Birr
            </Text>

            <Text style={styles.referralLine}>
              ✅ 20 maalmood oo la xaqiijiyay → 300 Birr (wadar ahaan)
            </Text>

            <Text style={styles.referralLine}>
              ✅ 30 maalmood oo la xaqiijiyay → 450 Birr (ugu badnaan bishii)
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralPlanTitle}>
              🌍 Qorshaha Ingiriisiga / Caalamiga ah — $15 USD Bishii
            </Text>

            <Text style={styles.referralLine}>
              ✅ 10 maalmood oo la xaqiijiyay → $0.75
            </Text>

            <Text style={styles.referralLine}>
              ✅ 20 maalmood oo la xaqiijiyay → $1.50 (wadar ahaan)
            </Text>

            <Text style={styles.referralLine}>
              ✅ 30 maalmood oo la xaqiijiyay → $2.25 (ugu badnaan bishii)
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralNote}>
              ✅ Abaalmarintu waxay u baahan tahay lacag bixinta oo la xaqiijiyay iyo ka qaybgalka la hubiyay. Heer kasta oo 10 maalmood ah hal mar oo keliya ayaa la abaalmarin karaa.
            </Text>
          </View>

          <View style={[styles.referralCard, styles.englishReferralCard]}>
            <Text style={styles.englishReferralTitle}>
              🌍 EGA STUDENT REFERRAL REWARD
            </Text>

            <Text style={styles.referralLanguage}>
              English Speakers
            </Text>

            <Text style={styles.referralIntro}>
              Refer another student to register and earn rewards.
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralPlanTitle}>
              🇪🇹 3,000 Birr Monthly Plan
            </Text>

            <Text style={styles.referralLine}>
              ✅ 10 verified days → 150 Birr
            </Text>

            <Text style={styles.referralLine}>
              ✅ 20 verified days → 300 Birr cumulative
            </Text>

            <Text style={styles.referralLine}>
              ✅ 30 verified days → 450 Birr cumulative maximum
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralPlanTitle}>
              🌍 English / International — $15 USD Monthly Plan
            </Text>

            <Text style={styles.referralLine}>
              ✅ 10 verified days → $0.75
            </Text>

            <Text style={styles.referralLine}>
              ✅ 20 verified days → $1.50 cumulative
            </Text>

            <Text style={styles.referralLine}>
              ✅ 30 verified days → $2.25 cumulative maximum
            </Text>

            <View style={styles.referralDivider} />

            <Text style={styles.referralNote}>
              ✅ Rewards require confirmed payment and verified attendance. Each 10-day milestone can be rewarded only once.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>
          Full Name
          {"\n"}
          Magaca oo Buuxa
        </Text>

        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name / Geli magacaaga oo buuxa"
          autoCapitalize="words"
        />

        <Text style={styles.label}>
          Phone Number
          {"\n"}
          Lambarka Taleefanka
        </Text>

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number / Geli lambarka taleefanka"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>
          Email Address
          {"\n"}
          Cinwaanka Iimaylka
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email address / Geli cinwaanka iimaylka"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>
          Referral Student ID (Optional)
          {"\n"}
          Aqoonsiga Ardayga Ku Soo Gudbiyey (Ikhtiyaari)
        </Text>

        <TextInput
          style={styles.input}
          value={referralStudentId}
          onChangeText={setReferralStudentId}
          placeholder="Example / Tusaale: EGA-2026-123456"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.referralHelpText}>
          If another EGA student referred you, enter their Student ID here.
          {"\n"}
          Haddii arday kale oo EGA ah kuu soo gudbiyey, geli Student ID-giisa halkan.
          {"\n\n"}
          The referral reward starts only after payment and attendance are verified.
          {"\n"}
          Abaalmarinta gudbintu waxay bilaabataa kaliya marka lacag bixinta iyo xaadiritaanka la xaqiijiyo.
        </Text>

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
              ? "Registering... / Diiwaangelin..."
              : "Register Now / Isdiiwaangeli Hadda"}
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

  referralCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },

  referralCard: {
    flexGrow: 1,
    flexBasis: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },

  somaliReferralCard: {
    backgroundColor: "#f4fbf3",
    borderColor: "#b7ddb1",
  },

  englishReferralCard: {
    backgroundColor: "#f3f8ff",
    borderColor: "#b8d4ff",
  },

  somaliReferralTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#166534",
    lineHeight: 30,
  },

  englishReferralTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1d4ed8",
    lineHeight: 30,
  },

  referralLanguage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
    marginBottom: 14,
  },

  referralIntro: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1f2937",
  },

  referralDivider: {
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: 14,
  },

  referralPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#12306d",
    marginBottom: 8,
    lineHeight: 26,
  },

  referralLine: {
    fontSize: 16,
    color: "#1f2937",
    lineHeight: 25,
    marginBottom: 6,
  },

  referralNote: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 23,
    fontWeight: "600",
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
  referralHelpText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginTop: 4,
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
