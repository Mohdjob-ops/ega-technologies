import * as Clipboard from "expo-clipboard";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { verifyAdminSession, verifyAdminUser } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

export default function AdminStudents() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [searchText, setSearchText] = useState("");

  const [studentView, setStudentView] = useState<"all" | "recent">("all");
  const [partialAmounts, setPartialAmounts] = useState<
    Record<string, string>
  >({});

  const [editingStudentId, setEditingStudentId] = useState<string | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCourse, setEditCourse] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyExistingSession() {
      const admin = await verifyAdminSession();

      if (!active) return;

      if (!admin.isAdmin) {
        setIsAdmin(false);
        setAdminEmail("");
        setCheckingAccess(false);
        return;
      }

      setIsAdmin(true);
      setAdminEmail(admin.email);
      setCheckingAccess(false);
    }

    verifyExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (!session) {
        setIsAdmin(false);
        setAdminEmail("");
        setStudents([]);
        setRecentStudents([]);
        setStudentView("all");
        setCheckingAccess(false);
        return;
      }

      setCheckingAccess(true);
      const admin = await verifyAdminUser(
        session.user.id,
        session.user.email || ""
      );

      if (!active) return;

      setIsAdmin(admin.isAdmin);
      setAdminEmail(admin.isAdmin ? admin.email : "");
      setCheckingAccess(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStudents();
      loadRecentStudents();
    }
  }, [isAdmin]);

  const filteredStudents = useMemo(() => {
    const sourceStudents =
      studentView === "recent" ? recentStudents : students;

    const search = searchText.trim().toLowerCase();

    if (!search) {
      return sourceStudents;
    }

    if (/^\d+$/.test(search)) {
      const exactSequenceMatch = sourceStudents.filter(
        (student) =>
          String(student.sequence_number ?? "") === search
      );

      if (exactSequenceMatch.length > 0) {
        return exactSequenceMatch;
      }
    }

    return sourceStudents.filter((student) => {
      const searchableText = [
        student.sequence_number,
        student.name,
        student.student_id,
        student.email,
        student.phone,
        student.course,
        student.payment_status,
        student.payment_method,
        student.payment_reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [students, recentStudents, studentView, searchText]);

  async function loadRecentStudents() {
    const since = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: activityData, error: activityError } = await supabase
      .from("student_activity")
      .select("student_id, created_at")
      .eq("activity_type", "LOGIN")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (activityError) {
      setMessage(
        "❌ Error loading recent sign-ins: " + activityError.message
      );
      return;
    }

    const latestLoginByStudent = new Map<string, string>();

    for (const row of activityData || []) {
      const studentId = String(row.student_id || "").trim();

      if (studentId && !latestLoginByStudent.has(studentId)) {
        latestLoginByStudent.set(studentId, row.created_at);
      }
    }

    const recentIds = Array.from(latestLoginByStudent.keys());

    if (recentIds.length === 0) {
      setRecentStudents([]);
      return;
    }

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .in("student_id", recentIds);

    if (studentError) {
      setMessage(
        "❌ Error loading recent students: " + studentError.message
      );
      return;
    }

    const sortedStudents = (studentData || []).sort((a, b) => {
      const aLogin =
        latestLoginByStudent.get(String(a.student_id || "").trim()) || "";
      const bLogin =
        latestLoginByStudent.get(String(b.student_id || "").trim()) || "";

      return bLogin.localeCompare(aLogin);
    });

    setRecentStudents(sortedStudents);
  }

  async function copyStudentRecord(student: any) {
    const record = [
      `Sequence #: ${student.sequence_number ?? "N/A"}`,
      `Student ID: ${student.student_id || "N/A"}`,
      `Name: ${student.name || "No name"}`,
      `Email: ${student.email || "Not added"}`,
      `Phone: ${student.phone || "Not added"}`,
      `Course: ${student.course || "Full Web Development"}`,
      `Fee: ${money(student.fee)}`,
      `Paid: ${money(student.paid_amount)}`,
      `Remaining: ${money(student.remaining_amount)}`,
      `Payment Status: ${student.payment_status || "Pending"}`,
      `Payment Method: ${student.payment_method || "Not Selected"}`,
      `Payment Reference: ${student.payment_reference || "Not provided"}`,
    ].join("\n");

    await Clipboard.setStringAsync(record);
    setMessage(
      `✅ Student #${student.sequence_number ?? ""} record copied.`
    );
  }

  function startEditingStudent(student: any) {
    setEditingStudentId(String(student.id));
    setEditName(student.name || "");
    setEditEmail(student.email || "");
    setEditPhone(student.phone || "");
    setEditCourse(student.course || "");
    setMessage(
      `✏️ Editing Student #${student.sequence_number ?? ""}`
    );
  }

  function cancelEditingStudent() {
    setEditingStudentId(null);
    setEditName("");
    setEditEmail("");
    setEditPhone("");
    setEditCourse("");
    setMessage("");
  }

  async function saveStudentEdits(student: any) {
    if (!editingStudentId) return;

    setMessage("Saving student changes...");

    const { error } = await supabase
      .from("students")
      .update({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        course: editCourse.trim(),
      })
      .eq("id", student.id);

    if (error) {
      setMessage("❌ Error saving student: " + error.message);
      return;
    }

    setEditingStudentId(null);
    setMessage(
      `✅ Student #${student.sequence_number ?? ""} updated successfully.`
    );

    await loadStudents();
    await loadRecentStudents();
  }

  async function loadStudents() {
    setMessage("Loading students...");

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setMessage("❌ Error loading students: " + error.message);
      return;
    }

    setStudents(data || []);
    setMessage("");
  }

  async function markFullPaid(student: any) {
    const fee = Number(student.fee || 0);
    const oldPaid = Number(student.paid_amount || 0);
    const remainingBeforePayment = Math.max(fee - oldPaid, 0);

    if (fee <= 0) {
      setMessage("⚠️ This student has no valid course fee.");
      return;
    }

    if (remainingBeforePayment <= 0) {
      setMessage("ℹ️ This student is already fully paid.");
      return;
    }

    setMessage("Updating full payment...");

    const { error } = await supabase
      .from("students")
      .update({
        payment_status: "Paid",
        payment_method: "Full Payment",
        paid_amount: fee,
        remaining_amount: 0,
        paid_at: new Date().toISOString(),
      })
      .eq("student_id", student.student_id);

    if (error) {
      setMessage("❌ Error marking full paid: " + error.message);
      return;
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        student_id: student.student_id,
        student_name: student.name,
        amount: remainingBeforePayment,
        payment_method: "Full Payment",
        note: "Remaining balance marked full paid by admin",
      });

    if (transactionError) {
      setMessage(
        "⚠️ Student marked Paid, but transaction history failed: " +
          transactionError.message
      );
      await loadStudents();
      return;
    }

    setMessage("✅ Marked full paid: " + student.name);
    await loadStudents();
  }

  async function markPending(student: any) {
    const fee = Number(student.fee || 0);

    setMessage("Updating payment status...");

    const { error } = await supabase
      .from("students")
      .update({
        payment_status: "Pending",
        payment_method: "Not Selected",
        payment_reference: null,
        paid_amount: 0,
        remaining_amount: fee,
        paid_at: null,
      })
      .eq("student_id", student.student_id);

    if (error) {
      setMessage("❌ Error marking pending: " + error.message);
      return;
    }

    setPartialAmounts((current) => ({
      ...current,
      [student.id]: "",
    }));

    setMessage("✅ Marked pending: " + student.name);
    await loadStudents();
  }

  async function addPartialPayment(student: any) {
    const enteredAmount = Number(partialAmounts[student.id] || 0);
    const fee = Number(student.fee || 0);
    const oldPaid = Number(student.paid_amount || 0);
    const currentRemaining = Math.max(fee - oldPaid, 0);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      setMessage("⚠️ Enter a valid partial payment amount.");
      return;
    }

    if (fee <= 0) {
      setMessage("⚠️ This student has no valid course fee.");
      return;
    }

    if (currentRemaining <= 0) {
      setMessage("ℹ️ This student is already fully paid.");
      return;
    }

    const appliedAmount = Math.min(
      enteredAmount,
      currentRemaining
    );

    const newPaid = oldPaid + appliedAmount;
    const remaining = Math.max(fee - newPaid, 0);
    const fullyPaid = remaining === 0;

    setMessage("Adding payment...");

    const { error } = await supabase
      .from("students")
      .update({
        payment_status: fullyPaid
          ? "Paid"
          : "Partial Payment",
        payment_method: fullyPaid
          ? "Full Payment"
          : "Partial Payment",
        paid_amount: newPaid,
        remaining_amount: remaining,
        paid_at: new Date().toISOString(),
      })
      .eq("student_id", student.student_id);

    if (error) {
      setMessage(
        "❌ Error adding partial payment: " + error.message
      );
      return;
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        student_id: student.student_id,
        student_name: student.name,
        amount: appliedAmount,
        payment_method: fullyPaid
          ? "Full Payment"
          : "Partial Payment",
        note: fullyPaid
          ? "Final balance payment added by admin"
          : "Partial payment added by admin",
      });

    if (transactionError) {
      setMessage(
        "⚠️ Payment updated, but transaction history failed: " +
          transactionError.message
      );
      await loadStudents();
      return;
    }

    setPartialAmounts((current) => ({
      ...current,
      [student.id]: "",
    }));

    if (enteredAmount > currentRemaining) {
      setMessage(
        `✅ ${money(appliedAmount)} applied. ` +
          `${student.name} is now fully paid.`
      );
    } else {
      setMessage(
        "✅ Payment added successfully: " + student.name
      );
    }

    await loadStudents();
  }

  async function logoutAdmin() {
    setMessage("Signing out...");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("❌ Logout failed: " + error.message);
      return;
    }

    setStudents([]);
    setAdminEmail("");
    setIsAdmin(false);
    setMessage("");
  }

  function money(value: any) {
    return `${Number(value || 0).toLocaleString()} ETB`;
  }

  if (checkingAccess) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.title}>🔐 Checking Admin Access</Text>
        <Text style={styles.subtitle}>
          Verifying your secure Supabase session...
        </Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>🔐 Admin Access Required</Text>

        <Text style={styles.subtitle}>
          Log in from the Admin Dashboard using your approved
          Supabase administrator account.
        </Text>

        <Link
          href="/admin-dashboard"
          style={styles.dashboardLoginLink}
        >
          Go to Admin Dashboard Login
        </Link>

        <Link href="/" style={styles.backButton}>
          ← Back to Home
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Link
        href="/admin-dashboard"
        style={styles.backButton}
      >
        ← Back to Admin Dashboard
      </Link>

      <Text style={styles.title}>📋 Admin Students</Text>

      <Text style={styles.subtitle}>
        Secure payment management for the latest 50 students
      </Text>

      <View style={styles.adminSessionBox}>
        <Text style={styles.adminSessionTitle}>
          ✅ Secure Admin Session
        </Text>

        <Text style={styles.adminSessionText}>
          {adminEmail || "Approved administrator"}
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search name, Student ID, phone or email"
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
      />

      <View style={styles.topButtons}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => setStudentView("all")}
        >
          <Text style={styles.buttonText}>
            {studentView === "all" ? "✓ " : ""}All Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paidButton}
          onPress={() => setStudentView("recent")}
        >
          <Text style={styles.buttonText}>
            {studentView === "recent" ? "✓ " : ""}🟢 Signed In — Last 3 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={
            studentView === "recent"
              ? loadRecentStudents
              : loadStudents
          }
        >
          <Text style={styles.buttonText}>
            🔄 Refresh Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logoutAdmin}
        >
          <Text style={styles.buttonText}>
            🚪 Secure Logout
          </Text>
        </TouchableOpacity>
      </View>

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      <Text style={styles.resultCount}>
        Showing {filteredStudents.length} of{" "}
        {studentView === "recent"
          ? recentStudents.length
          : students.length} students
      </Text>

      {filteredStudents.length === 0 && !message ? (
        <Text style={styles.emptyText}>
          {studentView === "recent" && !searchText.trim()
            ? "No students signed in during the last 3 days."
            : "No matching students found."}
        </Text>
      ) : null}

      {filteredStudents.map((student) => (
        <View key={student.id} style={styles.card}>
          {editingStudentId === String(student.id) ? (
            <>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Student name"
              />

              <Text style={styles.text}>
                Sequence #: {student.sequence_number ?? "N/A"}
              </Text>

              <Text style={styles.text}>
                Student ID: {student.student_id || "N/A"}
              </Text>

              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                value={editCourse}
                onChangeText={setEditCourse}
                placeholder="Course"
              />
            </>
          ) : (
            <>
              <Text style={styles.name}>
                {student.name || "No name"}
              </Text>

              <Text style={styles.text}>
                Sequence #: {student.sequence_number ?? "N/A"}
              </Text>

              <Text style={styles.text}>
                Student ID: {student.student_id || "N/A"}
              </Text>

              <Text style={styles.text}>
                Email: {student.email || "Not added"}
              </Text>

              <Text style={styles.text}>
                Phone: {student.phone || "Not added"}
              </Text>

              <Text style={styles.text}>
                Course:{" "}
                {student.course || "Full Web Development"}
              </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyStudentRecord(student)}
          >
            <Text style={styles.buttonText}>
              📋 Copy Record
            </Text>
          </TouchableOpacity>

          {editingStudentId === String(student.id) ? (
            <>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => saveStudentEdits(student)}
              >
                <Text style={styles.buttonText}>
                  💾 Save Changes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEditingStudent}
              >
                <Text style={styles.buttonText}>
                  ❌ Cancel
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => startEditingStudent(student)}
            >
              <Text style={styles.buttonText}>
                ✏️ Edit Student
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.paymentBox}>
            <Text style={styles.text}>
              Fee: {money(student.fee)}
            </Text>

            <Text style={styles.paid}>
              Paid: {money(student.paid_amount)}
            </Text>

            <Text style={styles.pending}>
              Remaining: {money(student.remaining_amount)}
            </Text>

            <Text style={styles.text}>
              Status: {student.payment_status || "Pending"}
            </Text>

            <Text style={styles.text}>
              Method:{" "}
              {student.payment_method || "Not Selected"}
            </Text>

            <Text style={styles.text}>
              Reference:{" "}
              {student.payment_reference || "Not provided"}
            </Text>

            <Text style={styles.text}>
              Paid Date:{" "}
              {student.paid_at
                ? new Date(student.paid_at).toLocaleString()
                : "Not paid yet"}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder={`Enter payment up to ${money(
              student.remaining_amount
            )}`}
            keyboardType="numeric"
            value={partialAmounts[student.id] || ""}
            onChangeText={(value) =>
              setPartialAmounts((current) => ({
                ...current,
                [student.id]: value,
              }))
            }
          />

          <TouchableOpacity
            style={styles.partialButton}
            onPress={() => addPartialPayment(student)}
          >
            <Text style={styles.buttonText}>
              ➕ Add Partial Payment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paidButton}
            onPress={() => markFullPaid(student)}
          >
            <Text style={styles.buttonText}>
              ✅ Mark Full Paid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pendingButton}
            onPress={() => markPending(student)}
          >
            <Text style={styles.buttonText}>
              ⏳ Reset as Pending
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2ff",
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#eaf2ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  backButton: {
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },
  dashboardLoginLink: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#334155",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 27,
  },
  adminSessionBox: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },
  adminSessionTitle: {
    color: "#166534",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  adminSessionText: {
    color: "#166534",
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#93c5fd",
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 12,
  },
  topButtons: {
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    color: "#003366",
    fontWeight: "bold",
    marginVertical: 14,
  },
  resultCount: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    color: "#64748b",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 8,
  },
  text: {
    fontSize: 17,
    marginBottom: 5,
    color: "#1f2937",
  },
  paymentBox: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
  },
  paid: {
    fontSize: 18,
    color: "#166534",
    fontWeight: "bold",
    marginBottom: 5,
  },
  pending: {
    fontSize: 18,
    color: "#ca8a04",
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: "#1e3a8a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#475569",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  copyButton: {
    backgroundColor: "#7c3aed",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: "#0f766e",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#15803d",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#b91c1c",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  partialButton: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  paidButton: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  pendingButton: {
    backgroundColor: "#ca8a04",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
