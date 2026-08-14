import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
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

type Transaction = {
  id?: string | number;
  student_id?: string;
  student_name?: string;
  amount?: number | string;
  payment_method?: string;
  payment_reference?: string;
  status?: string;
  note?: string;
  created_at?: string;
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

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

export default function PaymentsScreen() {
  const params = useLocalSearchParams<ChapaReturnParams>();

  const [searchValue, setSearchValue] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fee, setFee] = useState("Contact EGA");
  const [startDate, setStartDate] = useState("Coming Soon");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<"chapa" | "paypal" | "bank" | "cash">("chapa");
  const [manualReference, setManualReference] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [submittingManual, setSubmittingManual] =
    useState(false);
  const [manualDebug, setManualDebug] = useState("");

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

  async function loadPaymentHistory(studentId: string) {
    if (!studentId) {
      setTransactions([]);
      return;
    }

    setHistoryLoading(true);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Payment history error:", error.message);
        setTransactions([]);
        return;
      }

      const paymentTransactions = ((data || []) as Transaction[]).filter(
        (transaction) =>
          Number(transaction.amount || 0) > 0 ||
          String(transaction.payment_method || "")
            .toLowerCase()
            .includes("chapa")
      );

      setTransactions(paymentTransactions);
    } catch (error) {
      console.log(
        "Payment history loading error:",
        error instanceof Error ? error.message : error
      );
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
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
        setTransactions([]);
        setMessage("❌ Supabase error: " + error.message);
        return null;
      }

      if (!data || data.length === 0) {
        setStudent(null);
        setTransactions([]);
        setMessage("❌ Student payment record was not found");
        return null;
      }

      const foundStudent = data[0] as Student;

      setStudent(foundStudent);
      setSearchValue(
        foundStudent.student_id || cleanValue
      );

      if (foundStudent.student_id) {
        await loadPaymentHistory(foundStudent.student_id);
      }

      if (showMessage) {
        setMessage("✅ Payment record found");
      }

      return foundStudent;
    } catch (error) {
      setStudent(null);
      setTransactions([]);
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
    setTransactions([]);
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

  function selectPaymentMethod(
    method: "chapa" | "paypal" | "bank" | "cash"
  ) {
    setSelectedPaymentMethod(method);

    if (method === "chapa") {
      setMessage(
        "✅ Chapa selected. Press Continue with Chapa to open secure checkout."
      );
      return;
    }

    if (method === "paypal") {
      setMessage(
        "ℹ️ PayPal will be available after the EGA PayPal Business account is connected."
      );
      return;
    }

    if (method === "bank") {
      setMessage(
        "🏦 Bank transfer selected. Send the payment to the EGA bank account, keep your receipt, and contact the administrator for verification."
      );
      return;
    }

    setMessage(
      "💵 Cash payment selected. Visit the EGA office and give your Student ID to the administrator."
    );
  }

  async function continueSelectedPayment() {
    console.log("[Manual Payment] Button clicked", {
      selectedPaymentMethod,
      studentId: student?.student_id,
      studentName: student?.name,
      reference: manualReference,
      note: manualNote,
    });

    setManualDebug("1️⃣ Submit button clicked");
    setMessage("🔄 Processing manual payment request...");

    if (!student?.student_id) {
      console.log("[Manual Payment] Missing student ID");
      setManualDebug("❌ Stopped: Student ID is missing");
      setMessage("⚠️ Search for your student record first");
      return;
    }

    setManualDebug(
      `2️⃣ Student found: ${student.student_id}`
    );

    if (selectedPaymentMethod === "chapa") {
      console.log("[Manual Payment] Starting Chapa");
      setManualDebug("➡️ Starting Chapa payment");
      await startChapaPayment();
      return;
    }

    if (selectedPaymentMethod === "paypal") {
      console.log("[Manual Payment] PayPal not active");
      setManualDebug("ℹ️ PayPal is not active yet");
      setMessage(
        "ℹ️ PayPal is not active yet. Please use Chapa while PayPal setup is being completed."
      );
      return;
    }

    const remainingAmount = Number(
      student.remaining_amount ??
        student.fee ??
        0
    );

    console.log(
      "[Manual Payment] Remaining amount:",
      remainingAmount
    );

    setManualDebug(
      `3️⃣ Remaining amount: ${remainingAmount} ETB`
    );

    if (
      !Number.isFinite(remainingAmount) ||
      remainingAmount <= 0
    ) {
      console.log(
        "[Manual Payment] Invalid remaining amount"
      );
      setManualDebug(
        "❌ Stopped: Remaining amount is invalid"
      );
      setMessage(
        "⚠️ No valid remaining payment amount was found"
      );
      return;
    }

    if (
      selectedPaymentMethod === "bank" &&
      !manualReference.trim()
    ) {
      console.log(
        "[Manual Payment] Bank reference is empty"
      );
      setManualDebug(
        "❌ Stopped: Bank reference is empty"
      );
      setMessage(
        "⚠️ Enter the bank transaction reference first"
      );
      return;
    }

    const paymentMethod =
      selectedPaymentMethod === "bank"
        ? "Bank Transfer"
        : "Cash / Office";

    const payload = {
      student_id: student.student_id,
      student_name: student.name || "",
      amount: remainingAmount,
      payment_method: paymentMethod,
      payment_reference:
        selectedPaymentMethod === "bank"
          ? manualReference.trim()
          : null,
      note: manualNote.trim() || null,
      status: "Pending",
    };

    console.log(
      "[Manual Payment] Insert payload:",
      payload
    );

    setSubmittingManual(true);
    setManualDebug(
      "4️⃣ Sending request to Supabase..."
    );

    setMessage(
      selectedPaymentMethod === "bank"
        ? "🔄 Submitting bank transfer for administrator review..."
        : "🔄 Sending cash payment notification to the administrator..."
    );

    try {
      const { error } = await supabase
        .from("payment_requests")
        .insert(payload);

      console.log(
        "[Manual Payment] Supabase insert completed",
        { error }
      );

      if (error) {
        console.error(
          "[Manual Payment] Supabase error:",
          error
        );

        setManualDebug(
          `❌ Supabase error: ${error.message}`
        );

        setMessage(
          "❌ Manual payment submission error: " +
            error.message
        );
        return;
      }

      console.log(
        "[Manual Payment] Insert successful"
      );

      setManualDebug(
        "✅ Success: Payment request saved in Supabase"
      );

      setManualReference("");
      setManualNote("");

      setMessage(
        selectedPaymentMethod === "bank"
          ? "✅ Bank transfer submitted. An administrator must verify it before your account becomes paid."
          : "✅ Cash payment notification submitted. Pay at the EGA office and give the administrator your Student ID."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      console.error(
        "[Manual Payment] Exception:",
        error
      );

      setManualDebug(
        `❌ Submission exception: ${errorMessage}`
      );

      setMessage(
        "❌ Submission error: " + errorMessage
      );
    } finally {
      console.log(
        "[Manual Payment] Submission finished"
      );

      setSubmittingManual(false);
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

      await loadPaymentHistory(selectedStudentId);

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

  function printReceipt() {
    if (Platform.OS !== "web") {
      setMessage(
        "ℹ️ Receipt printing is currently available on the web version"
      );
      return;
    }

    const webWindow = (globalThis as any).window;

    if (webWindow?.print) {
      webWindow.print();
      return;
    }

    setMessage("❌ Printing is not supported in this browser");
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

  const busy =
    searching ||
    historyLoading ||
    initializing ||
    verifying ||
    submittingManual;

  const normalizedPaymentStatus = String(
    student?.payment_status || ""
  ).toLowerCase();

  const isPaid = normalizedPaymentStatus === "paid";

  const latestTransaction = transactions[0];

  const receiptAmount =
    latestTransaction?.amount ??
    student?.paid_amount ??
    0;

  const receiptMethod =
    latestTransaction?.payment_method ||
    student?.payment_method ||
    "Chapa";

  const receiptReference =
    latestTransaction?.payment_reference ||
    student?.payment_reference ||
    latestTransaction?.note ||
    "Not provided";

  const receiptDate =
    latestTransaction?.created_at ||
    student?.paid_at;

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
          Check your balance, choose a payment method, and view your transactions
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
              Paid Date: {formatDate(student.paid_at)}
            </Text>

            {!isPaid && (
              <View style={styles.paymentMethodsBox}>
                <Text style={styles.paymentMethodsTitle}>
                  Choose Payment Method
                </Text>

                <Text style={styles.helperText}>
                  Select the method you want to use for your
                  remaining payment.
                </Text>

                <View style={styles.paymentMethodGrid}>
                  <Pressable
                    style={[
                      styles.paymentMethodButton,
                      styles.chapaMethodButton,
                      selectedPaymentMethod === "chapa" &&
                        styles.selectedMethodButton,
                    ]}
                    onPress={() =>
                      selectPaymentMethod("chapa")
                    }
                    disabled={busy}
                  >
                    <Text style={styles.paymentMethodEmoji}>
                      💳
                    </Text>
                    <Text style={styles.paymentMethodText}>
                      Chapa
                    </Text>
                    <Text style={styles.paymentMethodSmall}>
                      Active
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentMethodButton,
                      styles.paypalMethodButton,
                      selectedPaymentMethod === "paypal" &&
                        styles.selectedMethodButton,
                    ]}
                    onPress={() =>
                      selectPaymentMethod("paypal")
                    }
                    disabled={busy}
                  >
                    <Text style={styles.paymentMethodEmoji}>
                      🌐
                    </Text>
                    <Text style={styles.paymentMethodText}>
                      PayPal
                    </Text>
                    <Text style={styles.paymentMethodSmall}>
                      Coming Soon
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentMethodButton,
                      styles.bankMethodButton,
                      selectedPaymentMethod === "bank" &&
                        styles.selectedMethodButton,
                    ]}
                    onPress={() =>
                      selectPaymentMethod("bank")
                    }
                    disabled={busy}
                  >
                    <Text style={styles.paymentMethodEmoji}>
                      🏦
                    </Text>
                    <Text style={styles.paymentMethodText}>
                      Bank Transfer
                    </Text>
                    <Text style={styles.paymentMethodSmall}>
                      Manual approval
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentMethodButton,
                      styles.cashMethodButton,
                      selectedPaymentMethod === "cash" &&
                        styles.selectedMethodButton,
                    ]}
                    onPress={() =>
                      selectPaymentMethod("cash")
                    }
                    disabled={busy}
                  >
                    <Text style={styles.paymentMethodEmoji}>
                      💵
                    </Text>
                    <Text style={styles.paymentMethodText}>
                      Cash / Office
                    </Text>
                    <Text style={styles.paymentMethodSmall}>
                      Manual approval
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.selectedMethodInfo}>
                  <Text style={styles.selectedMethodTitle}>
                    Selected:{" "}
                    {selectedPaymentMethod === "chapa"
                      ? "Chapa"
                      : selectedPaymentMethod === "paypal"
                        ? "PayPal"
                        : selectedPaymentMethod === "bank"
                          ? "Bank Transfer"
                          : "Cash / Office"}
                  </Text>

                  <Text style={styles.selectedMethodDescription}>
                    {selectedPaymentMethod === "chapa"
                      ? "You will be redirected to the secure Chapa checkout page."
                      : selectedPaymentMethod === "paypal"
                        ? "PayPal checkout will become available after the business account is connected."
                        : selectedPaymentMethod === "bank"
                          ? "Transfer the remaining balance, then submit the bank reference below for administrator verification."
                          : "Visit the EGA office, pay in cash, and give the administrator your Student ID."}
                  </Text>
                </View>

                {selectedPaymentMethod === "bank" && (
                  <View style={styles.manualForm}>
                    <Text style={styles.manualFormTitle}>
                      Bank Transfer Details
                    </Text>

                    <Text style={styles.manualLabel}>
                      Amount to transfer
                    </Text>

                    <View style={styles.amountDueBox}>
                      <Text style={styles.amountDueText}>
                        {formatMoney(
                          student.remaining_amount ??
                            student.fee ??
                            0
                        )}{" "}
                        ETB
                      </Text>
                    </View>

                    <Text style={styles.manualLabel}>
                      Bank transaction reference *
                    </Text>

                    <TextInput
                      style={styles.input}
                      placeholder="Example: CBE123456789"
                      value={manualReference}
                      onChangeText={setManualReference}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!busy}
                    />

                    <Text style={styles.manualLabel}>
                      Optional note
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        styles.noteInput,
                      ]}
                      placeholder="Add bank name or payment information"
                      value={manualNote}
                      onChangeText={setManualNote}
                      multiline
                      editable={!busy}
                    />

                    <Text style={styles.manualWarning}>
                      Your account will remain Pending until an
                      administrator verifies the bank payment.
                    </Text>
                  </View>
                )}

                {selectedPaymentMethod === "cash" && (
                  <View style={styles.manualForm}>
                    <Text style={styles.manualFormTitle}>
                      Cash / Office Payment
                    </Text>

                    <Text style={styles.manualInstruction}>
                      Visit the EGA office and bring:
                    </Text>

                    <Text style={styles.manualInstruction}>
                      • Student ID:{" "}
                      {student.student_id || "Not available"}
                    </Text>

                    <Text style={styles.manualInstruction}>
                      • Phone: {student.phone || "Not available"}
                    </Text>

                    <Text style={styles.manualInstruction}>
                      • Remaining balance:{" "}
                      {formatMoney(
                        student.remaining_amount ??
                          student.fee ??
                          0
                      )}{" "}
                      ETB
                    </Text>

                    <Text style={styles.manualLabel}>
                      Optional message to administrator
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        styles.noteInput,
                      ]}
                      placeholder="Example: I plan to visit tomorrow"
                      value={manualNote}
                      onChangeText={setManualNote}
                      multiline
                      editable={!busy}
                    />

                    <Text style={styles.manualWarning}>
                      Submitting this notification does not mark
                      your account as paid.
                    </Text>
                  </View>
                )}

                <Pressable
                  style={[
                    selectedPaymentMethod === "chapa"
                      ? styles.chapaButton
                      : styles.continueButton,
                    busy && styles.disabledButton,
                  ]}
                  onPress={continueSelectedPayment}
                  disabled={busy}
                >
                  {(initializing &&
                    selectedPaymentMethod === "chapa") ||
                  (submittingManual &&
                    (selectedPaymentMethod === "bank" ||
                      selectedPaymentMethod === "cash")) ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {selectedPaymentMethod === "chapa"
                        ? "Continue with Chapa"
                        : selectedPaymentMethod === "paypal"
                          ? "PayPal Coming Soon"
                          : selectedPaymentMethod === "bank"
                            ? "Submit Bank Transfer"
                            : "Notify Cash Payment"}
                    </Text>
                  )}
                </Pressable>

                {!!manualDebug && (
                  <View style={styles.manualDebugBox}>
                    <Text style={styles.manualDebugText}>
                      {manualDebug}
                    </Text>
                  </View>
                )}

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
              </View>
            )}

            {isPaid && (
              <>
                <View style={styles.completedBanner}>
                  <Text style={styles.completedTitle}>
                    ✅ Payment Completed
                  </Text>

                  <Text style={styles.completedText}>
                    Your payment has been verified and your
                    learner access is ready.
                  </Text>
                </View>

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
              </>
            )}
          </View>
        )}
      </View>

      {student && isPaid && (
        <View style={styles.receiptCard}>
          <Text style={styles.receiptBrand}>
            EGA TECHNOLOGIES
          </Text>

          <Text style={styles.receiptTitle}>
            PAYMENT RECEIPT
          </Text>

          <View style={styles.receiptDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Student</Text>
            <Text style={styles.receiptValue}>
              {student.name || "Not added"}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>
              Student ID
            </Text>
            <Text style={styles.receiptValue}>
              {student.student_id || "N/A"}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Course</Text>
            <Text style={styles.receiptValue}>
              {student.course || "Full Web Development"}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>
              Amount Paid
            </Text>
            <Text style={styles.receiptValue}>
              {formatMoney(receiptAmount)} ETB
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Method</Text>
            <Text style={styles.receiptValue}>
              {receiptMethod}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>
              Reference
            </Text>
            <Text style={styles.receiptValue}>
              {receiptReference}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date</Text>
            <Text style={styles.receiptValue}>
              {formatDate(receiptDate)}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Status</Text>
            <Text style={styles.receiptPaid}>PAID</Text>
          </View>

          <View style={styles.receiptDivider} />

          <Text style={styles.receiptThankYou}>
            Thank you for choosing EGA Technologies.
          </Text>

          <Pressable
            style={styles.printButton}
            onPress={printReceipt}
          >
            <Text style={styles.buttonText}>
              🖨️ Print / Download Receipt
            </Text>
          </Pressable>
        </View>
      )}

      {student && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Payment History
          </Text>

          {historyLoading ? (
            <ActivityIndicator color="#1e3a8a" />
          ) : transactions.length === 0 ? (
            <Text style={styles.helperText}>
              No completed payment transactions were found.
            </Text>
          ) : (
            transactions.map((transaction, index) => (
              <View
                key={String(
                  transaction.id ||
                    `${transaction.created_at}-${index}`
                )}
                style={styles.historyItem}
              >
                <View style={styles.historyTopRow}>
                  <Text style={styles.historyAmount}>
                    {formatMoney(transaction.amount)} ETB
                  </Text>

                  <Text style={styles.historyStatus}>
                    {transaction.status || "Paid"}
                  </Text>
                </View>

                <Text style={styles.historyText}>
                  Date: {formatDate(transaction.created_at)}
                </Text>

                <Text style={styles.historyText}>
                  Method:{" "}
                  {transaction.payment_method || "Chapa"}
                </Text>

                <Text style={styles.historyText}>
                  Reference:{" "}
                  {transaction.payment_reference ||
                    transaction.note ||
                    student.payment_reference ||
                    "Not provided"}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

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
  paymentMethodsBox: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 18,
  },
  paymentMethodsTitle: {
    color: "#1e3a8a",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 8,
  },
  paymentMethodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  paymentMethodButton: {
    width: "48%",
    minWidth: 140,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedMethodButton: {
    borderColor: "#1e3a8a",
    transform: [{ scale: 1.02 }],
  },
  chapaMethodButton: {
    backgroundColor: "#dcfce7",
  },
  paypalMethodButton: {
    backgroundColor: "#dbeafe",
  },
  bankMethodButton: {
    backgroundColor: "#fef3c7",
  },
  cashMethodButton: {
    backgroundColor: "#f3e8ff",
  },
  paymentMethodEmoji: {
    fontSize: 29,
    marginBottom: 7,
  },
  paymentMethodText: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  paymentMethodSmall: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  selectedMethodInfo: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 15,
    marginTop: 16,
  },
  selectedMethodTitle: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 7,
  },
  selectedMethodDescription: {
    color: "#475569",
    lineHeight: 22,
  },
  manualForm: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  manualFormTitle: {
    color: "#1e3a8a",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 14,
  },
  manualLabel: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 7,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  amountDueBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },
  amountDueText: {
    color: "#166534",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  manualInstruction: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 6,
  },
  manualWarning: {
    color: "#9a3412",
    backgroundColor: "#ffedd5",
    borderRadius: 10,
    padding: 12,
    fontWeight: "600",
    lineHeight: 21,
  },
  manualDebugBox: {
    backgroundColor: "#e0f2fe",
    borderWidth: 1,
    borderColor: "#38bdf8",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  manualDebugText: {
    color: "#075985",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 21,
  },
  chapaButton: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  continueButton: {
    backgroundColor: "#1e3a8a",
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
  completedBanner: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
  },
  completedTitle: {
    color: "#166534",
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
  },
  completedText: {
    color: "#166534",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  receiptCard: {
    backgroundColor: "#ffffff",
    margin: 15,
    padding: 24,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#1e3a8a",
  },
  receiptBrand: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 24,
    textAlign: "center",
  },
  receiptTitle: {
    color: "#475569",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 6,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: 18,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 14,
  },
  receiptLabel: {
    color: "#64748b",
    fontWeight: "bold",
    flex: 1,
  },
  receiptValue: {
    color: "#0f172a",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  receiptPaid: {
    color: "#16a34a",
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
  },
  receiptThankYou: {
    color: "#475569",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 22,
  },
  printButton: {
    backgroundColor: "#0f766e",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    backgroundColor: "#f8fafc",
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  historyAmount: {
    color: "#166534",
    fontWeight: "bold",
    fontSize: 19,
  },
  historyStatus: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontWeight: "bold",
    overflow: "hidden",
  },
  historyText: {
    color: "#475569",
    marginTop: 5,
    lineHeight: 21,
  },
});
