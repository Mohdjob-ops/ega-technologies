import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Student = {
  id?: string | number;
  student_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  fee?: number | string;
  payment_status?: string;
  payment_method?: string;
  payment_reference?: string;
  paid_amount?: number | string;
  remaining_amount?: number | string;
  paid_at?: string;
};

type ChapaReturnParams = {
  tx_ref?: string | string[];
  trx_ref?: string | string[];
  ref_id?: string | string[];
  status?: string | string[];
  student_id?: string | string[];
};

function getParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function formatMoney(value: unknown) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return amount.toLocaleString();
}

export default function PaymentsScreen() {
  const params = useLocalSearchParams<ChapaReturnParams>();

  const [searchValue, setSearchValue] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [fee, setFee] = useState("Contact EGA");
  const [startDate, setStartDate] = useState("Coming Soon");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const processedReturnRef = useRef("");

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "course_settings")
        .maybeSingle();

      if (error) {
        console.log("Settings error:", error.message);
        return;
      }

      if (data) {
        setFee(
          data.fee
            ? `${formatMoney(data.fee)} Birr`
            : "Contact EGA"
        );

        setStartDate(data.start_date || "Coming Soon");
      }
    } catch (error) {
      console.log(
        "Settings loading error:",
        error instanceof Error ? error.message : error
      );
    }
  }

  async function findStudent(
    value: string,
    showMessage = true
  ): Promise<Student | null> {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setMessage("⚠️ Enter your phone number or Student ID");
      return null;
    }

    setSearching(true);

    if (showMessage) {
      setMessage("🔎 Searching for your payment record...");
    }

    try {
      let query = supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const looksLikeStudentId = cleanValue
        .toUpperCase()
        .startsWith("EGA-");

      if (looksLikeStudentId) {
        query = query.eq(
          "student_id",
          cleanValue.toUpperCase()
        );
      } else {
        query = query.eq("phone", cleanValue);
      }

      const { data, error } = await query;

      if (error) {
        setStudent(null);
        setMessage("❌ Supabase error: " + error.message);
        return null;
      }

      if (!data || data.length === 0) {
        setStudent(null);
        setMessage("❌ Student payment record was not found");
        return null;
      }

      const foundStudent = data[0] as Student;

      setStudent(foundStudent);
      setSearchValue(
        foundStudent.student_id || cleanValue
      );

      if (showMessage) {
        setMessage("✅ Payment record found");
      }

      return foundStudent;
    } catch (error) {
      setStudent(null);
      setMessage(
        "❌ Search error: " +
          (error instanceof Error
            ? error.message
            : "Unknown error")
      );

      return null;
    } finally {
      setSearching(false);
    }
  }

  async function searchPayment() {
    setStudent(null);
    await findStudent(searchValue);
  }

  async function startChapaPayment() {
    if (!student?.student_id) {
      setMessage("⚠️ Search for your student record first");
      return;
    }

    if (
      String(student.payment_status || "").toLowerCase() ===
      "paid"
    ) {
      setMessage("✅ Your course payment is already complete");
      return;
    }

    const remainingAmount = Number(
      student.remaining_amount ??
        student.fee ??
        0
    );

    if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
      setMessage(
        "⚠️ No valid remaining payment amount was found"
      );
      return;
    }

    setInitializing(true);
    setMessage("🔄 Preparing secure Chapa checkout...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "initialize-chapa-payment",
        {
          body: {
            student_id: student.student_id,
          },
        }
      );

      if (error) {
        setMessage(
          "❌ Chapa initialization error: " + error.message
        );
        return;
      }

      if (!data?.success || !data?.checkout_url) {
        setMessage(
          "❌ " +
            (data?.message ||
              "Chapa could not initialize the payment")
        );
        return;
      }

      const transactionReference =
        data.tx_ref || data.trx_ref || "";

      setStudent((currentStudent) =>
        currentStudent
          ? {
              ...currentStudent,
              payment_method: "Chapa",
              payment_reference:
                transactionReference ||
                currentStudent.payment_reference,
            }
          : currentStudent
      );

      setMessage(
        "✅ Checkout created. Opening the secure Chapa payment page..."
      );

      const supported = await Linking.canOpenURL(
        data.checkout_url
      );

      if (!supported) {
        setMessage(
          "❌ This device could not open the Chapa checkout page"
        );
        return;
      }

      await Linking.openURL(data.checkout_url);
    } catch (error) {
      setMessage(
        "❌ Payment error: " +
          (error instanceof Error
            ? error.message
            : "Unknown error")
      );
    } finally {
      setInitializing(false);
    }
  }

  async function verifyChapaPayment(
    txReference?: string,
    studentId?: string
  ) {
    const txRef =
      txReference?.trim() ||
      student?.payment_reference?.trim() ||
      "";

    const selectedStudentId =
      studentId?.trim() ||
      student?.student_id?.trim() ||
      "";

    if (!selectedStudentId) {
      setMessage("⚠️ Search for your student record first");
      return;
    }

    if (!txRef) {
      setMessage(
        "⚠️ No Chapa transaction reference was found"
      );
      return;
    }

    setVerifying(true);
    setMessage("🔄 Verifying payment securely with Chapa...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-chapa-payment",
        {
          body: {
            student_id: selectedStudentId,
            tx_ref: txRef,
          },
        }
      );

      if (error) {
        setMessage(
          "❌ Payment verification error: " + error.message
        );
        return;
      }

      if (!data?.success || !data?.verified) {
        setMessage(
          "⚠️ " +
            (data?.message ||
              "The payment is not successful or verified yet")
        );
        return;
      }

      if (data.student) {
        setStudent(data.student as Student);
        setSearchValue(
          data.student.student_id || selectedStudentId
        );
      } else {
        await findStudent(selectedStudentId, false);
      }

      const verifiedAmount = formatMoney(
        data.payment?.amount || 0
      );

      const verifiedCurrency =
        data.payment?.currency || "ETB";

      setMessage(
        `✅ Payment verified successfully: ${verifiedAmount} ${verifiedCurrency}`
      );
    } catch (error) {
      setMessage(
        "❌ Verification error: " +
          (error instanceof Error
            ? error.message
            : "Unknown error")
      );
    } finally {
      setVerifying(false);
    }
  }

  function statusStyle(status?: string) {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "paid") {
      return styles.paid;
    }

    if (
      normalizedStatus === "rejected" ||
      normalizedStatus === "failed"
    ) {
      return styles.rejected;
    }

    if (normalizedStatus === "partial") {
      return styles.partial;
    }

    return styles.pending;
  }

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const returnedTxRef =
      getParam(params.tx_ref) ||
      getParam(params.trx_ref);

    const returnedStudentId = getParam(params.student_id);
    const returnedStatus = getParam(params.status);
    const returnedRefId = getParam(params.ref_id);

    if (!returnedTxRef || !returnedStudentId) {
      return;
    }

    const processingKey =
      `${returnedStudentId}:${returnedTxRef}`;

    if (processedReturnRef.current === processingKey) {
      return;
    }

    processedReturnRef.current = processingKey;
    setSearchValue(returnedStudentId);

    if (
      returnedStatus &&
      returnedStatus.toLowerCase() !== "success"
    ) {
      setMessage(
        `⚠️ Chapa returned payment status: ${returnedStatus}`
      );
      return;
    }

    setMessage(
      returnedRefId
        ? `🔄 Chapa returned reference ${returnedRefId}. Verifying payment...`
        : "🔄 Payment returned from Chapa. Verifying..."
    );

    findStudent(returnedStudentId, false).then(() => {
      verifyChapaPayment(
        returnedTxRef,
        returnedStudentId
      );
    });
  }, [
    params.tx_ref,
    params.trx_ref,
    params.ref_id,
    params.status,
    params.student_id,
  ]);

  const busy = searching || initializing || verifying;

  const normalizedPaymentStatus = String(
    student?.payment_status || ""
  ).toLowerCase();

  const isPaid = normalizedPaymentStatus === "paid";

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topRow}>
        <Pressable
          style={styles.navButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.navText}>← Home</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>💳 Payments</Text>

        <Text style={styles.subtitle}>
          Check your status and pay securely with Chapa
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Search Payment Record
        </Text>

        <Text style={styles.helperText}>
          Enter your phone number or Student ID to check
          your payment status.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Phone number or Student ID"
          value={searchValue}
          onChangeText={setSearchValue}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!busy}
          onSubmitEditing={searchPayment}
          returnKeyType="search"
        />

        <Pressable
          style={[
            styles.searchButton,
            busy && styles.disabledButton,
          ]}
          onPress={searchPayment}
          disabled={busy}
        >
          {searching ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.searchButtonText}>
              Check Payment Status
            </Text>
          )}
        </Pressable>

        {!!message && (
          <Text style={styles.message}>{message}</Text>
        )}

        {student && (
          <View style={styles.resultBox}>
            <Text style={styles.sectionTitle}>
              Student Details
            </Text>

            <Text style={styles.text}>
              Name: {student.name || "Not added"}
            </Text>

            <Text style={styles.text}>
              Student ID: {student.student_id || "N/A"}
            </Text>

            <Text style={styles.text}>
              Phone: {student.phone || "Not added"}
            </Text>

            <Text style={styles.text}>
              Email: {student.email || "Not added"}
            </Text>

            <Text style={styles.text}>
              Course:{" "}
              {student.course || "Full Web Development"}
            </Text>

            <Text
              style={[
                styles.status,
                statusStyle(student.payment_status),
              ]}
            >
              {student.payment_status || "Pending"}
            </Text>

            <Text style={styles.text}>
              Fee:{" "}
              {student.fee
                ? `${formatMoney(student.fee)} Birr`
                : fee}
            </Text>

            <Text style={styles.text}>
              Paid: {formatMoney(student.paid_amount)} Birr
            </Text>

            <Text style={styles.text}>
              Remaining:{" "}
              {formatMoney(
                student.remaining_amount ??
                  student.fee ??
                  0
              )}{" "}
              Birr
            </Text>

            <Text style={styles.text}>
              Method:{" "}
              {student.payment_method || "Not selected"}
            </Text>

            <Text style={styles.text}>
              Reference:{" "}
              {student.payment_reference || "Not provided"}
            </Text>

            <Text style={styles.text}>
              Paid Date:{" "}
              {student.paid_at
                ? new Date(
                    student.paid_at
                  ).toLocaleString()
                : "Not paid yet"}
            </Text>

            {!isPaid && (
              <>
                <Pressable
                  style={[
                    styles.chapaButton,
                    busy && styles.disabledButton,
                  ]}
                  onPress={startChapaPayment}
                  disabled={busy}
                >
                  {initializing ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Pay Securely with Chapa
                    </Text>
                  )}
                </Pressable>

                {!!student.payment_reference && (
                  <Pressable
                    style={[
                      styles.verifyButton,
                      busy && styles.disabledButton,
                    ]}
                    onPress={() => verifyChapaPayment()}
                    disabled={busy}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        Verify My Chapa Payment
                      </Text>
                    )}
                  </Pressable>
                )}
              </>
            )}

            {isPaid && (
              <Pressable
                style={styles.portalButton}
                onPress={() =>
                  router.push("/learner-portal")
                }
              >
                <Text style={styles.buttonText}>
                  Open Learner Portal
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Course Fee</Text>
        <Text style={styles.amount}>{fee}</Text>
        <Text style={styles.text}>
          Start Date: {startDate}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Chapa Payment Instructions
        </Text>

        <Text style={styles.text}>
          1. Search using your Student ID or phone number.
        </Text>

        <Text style={styles.text}>
          2. Press “Pay Securely with Chapa”.
        </Text>

        <Text style={styles.text}>
          3. Complete payment on the secure Chapa page.
        </Text>

        <Text style={styles.text}>
          4. Chapa will return you to the EGA payment page.
        </Text>

        <Text style={styles.text}>
          5. EGA will securely verify the transaction before
          changing your status.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Payment Status Meaning
        </Text>

        <Text style={styles.text}>
          🟡 Pending: Payment has not been verified.
        </Text>

        <Text style={styles.text}>
          🟠 Partial: Part of the course fee was paid.
        </Text>

        <Text style={styles.text}>
          🟢 Paid: Payment was successfully verified.
        </Text>

        <Text style={styles.text}>
          🔴 Rejected: Payment failed or needs correction.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    gap: 10,
    padding: 15,
    paddingTop: 20,
  },
  navButton: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  navText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#1e3a8a",
    padding: 35,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  subtitle: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 10,
  },
  helperText: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 22,
  },
  amount: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 7,
    lineHeight: 24,
  },
  status: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
  },
  paid: {
    color: "#166534",
    backgroundColor: "#dcfce7",
  },
  partial: {
    color: "#9a3412",
    backgroundColor: "#ffedd5",
  },
  pending: {
    color: "#854d0e",
    backgroundColor: "#fef3c7",
  },
  rejected: {
    color: "#991b1b",
    backgroundColor: "#fee2e2",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },
  searchButton: {
    backgroundColor: "#facc15",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 16,
  },
  chapaButton: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  verifyButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  portalButton: {
    backgroundColor: "#1e3a8a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  message: {
    marginTop: 14,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1e3a8a",
    lineHeight: 22,
  },
  resultBox: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
});
