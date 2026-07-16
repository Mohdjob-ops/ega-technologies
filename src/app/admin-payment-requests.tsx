import { Link } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import emailjs from "@emailjs/browser";
import { verifyAdminSession } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "EGAADMIN2026";

const EMAILJS_SERVICE_ID = "service_kkkr0xj";
const EMAILJS_PAYMENT_TEMPLATE_ID = "template_9se77eg";
const EMAILJS_PUBLIC_KEY = "eGuNf2PLEmedxzflY";

type RequestStatus = "Pending" | "Approved" | "Rejected";
type FilterStatus = "All" | RequestStatus;

type PaymentRequest = {
  id: string;
  student_id: string;
  student_name: string | null;
  amount: number | string;
  payment_method: string;
  payment_reference: string | null;
  note: string | null;
  status: RequestStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

export default function AdminPaymentRequests() {
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("Pending");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState("");

  const money = (value: number | string) =>
    `${Number(value || 0).toLocaleString()} ETB`;

  const formatDate = (value: string | null) => {
    if (!value) return "Not reviewed";
    return new Date(value).toLocaleString();
  };

  const loadRequests = useCallback(
    async (password = adminPassword, showLoader = true) => {
      if (showLoader) setLoading(true);
      setResultMessage("");

      const { data, error } = await supabase.rpc(
        "admin_list_payment_requests",
        {
          p_admin_password: password,
        }
      );

      if (error) {
        setAdminMessage(`❌ ${error.message}`);
        setLoading(false);
        setRefreshing(false);
        return false;
      }

      setRequests((data || []) as PaymentRequest[]);
      setAdminMessage("");
      setLoading(false);
      setRefreshing(false);
      return true;
    },
    [adminPassword]
  );

  async function login() {
    if (!adminPassword.trim()) {
      setAdminMessage("❌ Enter the admin password.");
      return;
    }

    setLoading(true);

    const admin = await verifyAdminSession();

    if (!admin.isAdmin) {
      setAdminMessage(
        `❌ ${admin.error || "Sign in with an authorized admin account first."}`
      );
      setAdminEmail("");
      setAdminLoggedIn(false);
      setLoading(false);
      return;
    }

    const success = await loadRequests(adminPassword, false);
    setLoading(false);

    if (success) {
      setAdminEmail(admin.email);
      setAdminLoggedIn(true);
    }
  }

  async function refreshRequests() {
    setRefreshing(true);
    await loadRequests(adminPassword, false);
  }

  function confirmReview(request: PaymentRequest, action: "Approved" | "Rejected") {
    const verb = action === "Approved" ? "approve" : "reject";
    const message = `Are you sure you want to ${verb} ${money(request.amount)} for ${
      request.student_name || request.student_id
    }?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);

      if (confirmed) {
        void reviewRequest(request, action);
      }

      return;
    }

    Alert.alert(
      `${action === "Approved" ? "Approve" : "Reject"} Payment`,
      message,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "Approved" ? "Approve" : "Reject",
          style: action === "Rejected" ? "destructive" : "default",
          onPress: () => void reviewRequest(request, action),
        },
      ]
    );
  }

  async function sendPaymentApprovalEmail(
    request: PaymentRequest,
    response: {
      remaining_amount?: number;
      payment_status?: string;
      paid_amount?: number;
    } | null
  ) {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select(
        "student_id, name, email, phone, course, fee, paid_amount, remaining_amount, payment_status, payment_method, payment_reference, paid_at"
      )
      .eq("student_id", request.student_id)
      .maybeSingle();

    if (studentError) {
      throw new Error(`Student email lookup failed: ${studentError.message}`);
    }

    if (!student) {
      throw new Error("Student record was not found for the approval email.");
    }

    const studentEmail = String(student.email || "").trim();

    if (!studentEmail) {
      throw new Error("The student does not have an email address.");
    }

    const paidDate = student.paid_at
      ? new Date(student.paid_at).toLocaleString()
      : new Date().toLocaleString();

    const approvedAmount = money(request.amount);
    const totalPaid = money(student.paid_amount || 0);
    const remainingBalance = money(
      response?.remaining_amount ?? student.remaining_amount ?? 0
    );

    const emailData = {
      email: studentEmail,
      to_email: studentEmail,

      name: student.name,
      from_name: "EGA Technologies",
      student_name: student.name,
      student_email: studentEmail,
      student_phone: student.phone || "",
      phone: student.phone || "",

      student_id: student.student_id,
      student_course: student.course || "Full Web Development",
      course: student.course || "Full Web Development",

      payment_status:
        response?.payment_status || student.payment_status || "Paid",
      payment_method: request.payment_method,
      payment_reference:
        request.payment_reference || student.payment_reference || "Not provided",

      approved_amount: approvedAmount,
      amount_paid: approvedAmount,
      payment_amount: approvedAmount,
      total_paid: totalPaid,
      paid_amount: totalPaid,
      remaining_amount: remainingBalance,
      remaining_balance: remainingBalance,
      course_fee: money(student.fee || 0),
      fee: money(student.fee || 0),
      fee_text: money(student.fee || 0),

      paid_date: paidDate,
      payment_date: paidDate,
      reviewed_by: "EGA Admin",

      message:
        `Your payment of ${approvedAmount} has been approved. ` +
        `Your current payment status is ${
          response?.payment_status || student.payment_status || "Paid"
        }. Remaining balance: ${remainingBalance}.`,

      logo_url:
        "https://dummyimage.com/160x60/12306d/ffffff.png&text=EGA",
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_PAYMENT_TEMPLATE_ID,
      emailData,
      EMAILJS_PUBLIC_KEY
    );
  }

  async function reviewRequest(
    request: PaymentRequest,
    action: "Approved" | "Rejected"
  ) {
    if (reviewingId) return;

    setReviewingId(request.id);
    setResultMessage("");

    const { data, error } = await supabase.rpc(
      "admin_review_payment_request",
      {
        p_request_id: request.id,
        p_action: action,
        p_admin_password: adminPassword,
        p_reviewed_by: "EGA Admin",
      }
    );

    if (error) {
      setResultMessage(`❌ ${error.message}`);
      setReviewingId(null);
      return;
    }

    const response = data as {
      message?: string;
      remaining_amount?: number;
      paid_amount?: number;
      payment_status?: string;
    } | null;

    await loadRequests(adminPassword, false);

    if (action === "Rejected") {
      setResultMessage(
        `✅ ${response?.message || "Payment request rejected."}\n` +
          "The student payment balance was not changed."
      );
      setReviewingId(null);
      return;
    }

    let approvalMessage =
      `✅ ${response?.message || "Payment request approved."}\n` +
      `Status: ${response?.payment_status || "Updated"}\n` +
      `Remaining: ${money(response?.remaining_amount || 0)}`;

    try {
      await sendPaymentApprovalEmail(request, response);

      approvalMessage +=
        "\n📧 Payment confirmation email sent to the student.";
    } catch (emailError: any) {
      const emailReason =
        emailError?.text ||
        emailError?.message ||
        "Unknown EmailJS error";

      approvalMessage +=
        `\n⚠️ Payment was approved, but the email was not sent: ${emailReason}`;
    }

    setResultMessage(approvalMessage);
    setReviewingId(null);
  }

  const filteredRequests = requests.filter(
    (request) => filter === "All" || request.status === filter
  );

  const countByStatus = (status: RequestStatus) =>
    requests.filter((request) => request.status === status).length;

  if (!adminLoggedIn) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.loginContent}
      >
        <Text style={styles.title}>🔐 Payment Requests Admin</Text>
        <Text style={styles.subtitle}>
          Enter the EGA admin password to review student payments.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter admin password"
          secureTextEntry
          value={adminPassword}
          onChangeText={setAdminPassword}
          onSubmitEditing={login}
        />

        <Pressable
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={login}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login as Admin</Text>
          )}
        </Pressable>

        {adminMessage ? <Text style={styles.errorText}>{adminMessage}</Text> : null}

        <Link href="/admin-dashboard" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backText}>← Back to Admin Dashboard</Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshRequests} />
      }
    >
      <Text style={styles.title}>💳 Payment Requests</Text>
      <Text style={styles.subtitle}>
        Approve or reject Bank Transfer and Cash / Office requests.
      </Text>
      <Text style={styles.sessionText}>
        Signed in as {adminEmail || "authorized admin"}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.pendingNumber}>{countByStatus("Pending")}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.approvedNumber}>{countByStatus("Approved")}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.rejectedNumber}>{countByStatus("Rejected")}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["Pending", "Approved", "Rejected", "All"] as FilterStatus[]).map(
          (item) => (
            <Pressable
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )
        )}
      </View>

      <Pressable style={styles.refreshButton} onPress={refreshRequests}>
        <Text style={styles.refreshText}>🔄 Refresh Requests</Text>
      </Pressable>

      {resultMessage ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#003366" />
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No {filter === "All" ? "" : filter.toLowerCase()} payment requests.
          </Text>
        </View>
      ) : (
        filteredRequests.map((request) => {
          const busy = reviewingId === request.id;

          return (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerTextBox}>
                  <Text style={styles.studentName}>
                    {request.student_name || "Unknown student"}
                  </Text>
                  <Text style={styles.studentId}>{request.student_id}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    request.status === "Approved"
                      ? styles.approvedBadge
                      : request.status === "Rejected"
                        ? styles.rejectedBadge
                        : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>

              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Requested Amount</Text>
                <Text style={styles.amount}>{money(request.amount)}</Text>
              </View>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Method: </Text>
                {request.payment_method}
              </Text>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Reference: </Text>
                {request.payment_reference || "No reference supplied"}
              </Text>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Note: </Text>
                {request.note || "No note"}
              </Text>

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Submitted: </Text>
                {formatDate(request.created_at)}
              </Text>

              {request.status !== "Pending" ? (
                <>
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Reviewed: </Text>
                    {formatDate(request.reviewed_at)}
                  </Text>

                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Reviewed by: </Text>
                    {request.reviewed_by || "EGA Admin"}
                  </Text>
                </>
              ) : null}

              {request.status === "Pending" ? (
                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.approveButton,
                      reviewingId !== null && styles.disabledButton,
                    ]}
                    disabled={reviewingId !== null}
                    onPress={() => confirmReview(request, "Approved")}
                  >
                    {busy ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.actionText}>✅ Approve</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[
                      styles.rejectButton,
                      reviewingId !== null && styles.disabledButton,
                    ]}
                    disabled={reviewingId !== null}
                    onPress={() => confirmReview(request, "Rejected")}
                  >
                    <Text style={styles.actionText}>❌ Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      <Link href="/admin-dashboard" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Back to Admin Dashboard</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2ff",
  },
  loginContent: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 40,
  },
  content: {
    padding: 18,
    paddingBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003366",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    color: "#475569",
    marginBottom: 10,
    lineHeight: 25,
  },
  sessionText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#003366",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    marginTop: 16,
    color: "#b91c1c",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  pendingNumber: {
    color: "#b45309",
    fontSize: 26,
    fontWeight: "bold",
  },
  approvedNumber: {
    color: "#15803d",
    fontSize: 26,
    fontWeight: "bold",
  },
  rejectedNumber: {
    color: "#b91c1c",
    fontSize: 26,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  filterButton: {
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#93c5fd",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: "#003366",
    borderColor: "#003366",
  },
  filterText: {
    color: "#003366",
    fontWeight: "bold",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  refreshButton: {
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  resultText: {
    color: "#166534",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 23,
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 17,
    fontWeight: "bold",
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 13,
  },
  headerTextBox: {
    flex: 1,
  },
  studentName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#0f172a",
  },
  studentId: {
    fontSize: 15,
    color: "#475569",
    marginTop: 3,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
  },
  approvedBadge: {
    backgroundColor: "#dcfce7",
  },
  rejectedBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  amountBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 11,
    padding: 13,
    marginBottom: 13,
    alignItems: "center",
  },
  amountLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "bold",
  },
  amount: {
    color: "#003366",
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 3,
  },
  detail: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 22,
    alignItems: "center",
    padding: 10,
  },
  backText: {
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
  },
});
