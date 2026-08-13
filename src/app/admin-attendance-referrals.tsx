import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type Student = {
  student_id: string;
  name: string;
  phone: string | null;
  referred_by_student_id: string | null;
  referred_by_phone: string | null;
};

type Reward = {
  id: string;
  referred_student_id: string;
  referred_student_name: string;
  referrer_student_id: string;
  referrer_name: string;
  referrer_phone: string;
  attendance_days: number;
  reward_period: number;
  reward_amount: number;
  status: string;
  payout_account: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  eligible_at: string | null;
  approved_at: string | null;
};

type AttendanceStatus = "Present" | "Absent" | "Excused";

export default function AdminAttendanceReferrals() {
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAllRewards() {
    const { data, error } = await supabase
      .from("referral_rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAllRewards((data || []) as Reward[]);
  }

  useEffect(() => {
    void loadAllRewards();
  }, []);

  async function loadStudentDetails(foundStudent: Student) {
    const attendanceResult = await supabase
      .from("student_attendance")
      .select("id", { count: "exact", head: true })
      .eq("student_id", foundStudent.student_id)
      .eq("status", "Present");

    if (attendanceResult.error) {
      setMessage(
        "❌ Could not load attendance: " +
          attendanceResult.error.message
      );
      return;
    }

    setAttendanceCount(attendanceResult.count || 0);

    const rewardResult = await supabase
      .from("referral_rewards")
      .select("*")
      .eq("referred_student_id", foundStudent.student_id)
      .order("reward_period", { ascending: true });

    if (rewardResult.error) {
      setMessage(
        "❌ Could not load rewards: " +
          rewardResult.error.message
      );
      return;
    }

    setRewards((rewardResult.data || []) as Reward[]);
  }

  async function findStudent() {
    const value = search.trim();

    if (!value) {
      setMessage("❌ Enter Student ID, phone, or name.");
      return;
    }

    setLoading(true);
    setMessage("");
    setStudent(null);
    setRewards([]);
    setAttendanceCount(0);

    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          "student_id, name, phone, referred_by_student_id, referred_by_phone"
        )
        .or(
          `student_id.eq.${value},phone.eq.${value},name.ilike.%${value}%`
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        setMessage("❌ Search failed: " + error.message);
        return;
      }

      if (!data) {
        setMessage("❌ Student not found.");
        return;
      }

      const foundStudent = data as Student;

      setStudent(foundStudent);
      await loadStudentDetails(foundStudent);

      setMessage("✅ Student loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(status: AttendanceStatus) {
    if (!student) {
      setMessage("❌ Find a student first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const today = new Date().toISOString().slice(0, 10);

      const { error } = await supabase
        .from("student_attendance")
        .upsert(
          {
            student_id: student.student_id,
            attendance_date: today,
            status,
          },
          {
            onConflict: "student_id,attendance_date",
          }
        );

      if (error) {
        setMessage(
          "❌ Attendance could not be saved: " +
            error.message
        );
        return;
      }

      await loadStudentDetails(student);
      await loadAllRewards();

      setMessage(
        `✅ ${student.name} marked ${status} for ${today}.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function approveReward(reward: Reward) {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("referral_rewards")
        .update({
          status: "Approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", reward.id);

      if (error) {
        setMessage(
          "❌ Reward approval failed: " + error.message
        );
        return;
      }

      if (student) {
        await loadStudentDetails(student);
      }

      await loadAllRewards();

      setMessage(
        `✅ Period ${reward.reward_period} reward approved.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function markRewardPaid(reward: Reward) {
    setLoading(true);
    setMessage("");

    try {
      const reference = `EGA-REF-${Date.now()}`;

      const { error } = await supabase
        .from("referral_rewards")
        .update({
          status: "Paid",
          paid_at: new Date().toISOString(),
          payment_reference: reference,
        })
        .eq("id", reward.id);

      if (error) {
        setMessage(
          "❌ Reward payment update failed: " +
            error.message
        );
        return;
      }

      if (student) {
        await loadStudentDetails(student);
      }

      await loadAllRewards();

      setMessage(
        `✅ ${reward.reward_amount} Birr reward marked Paid.`
      );
    } finally {
      setLoading(false);
    }
  }

  function rewardProgress() {
    if (attendanceCount >= 30) {
      return "30/30 — All three reward periods reached";
    }

    if (attendanceCount >= 20) {
      return `${attendanceCount}/30 — Periods 1 & 2 reached`;
    }

    if (attendanceCount >= 10) {
      return `${attendanceCount}/30 — Period 1 reached`;
    }

    return `${attendanceCount}/10 — First reward unlocks at 10 Present days`;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        📅 Attendance & Referral Rewards
      </Text>

      <Text style={styles.subtitle}>
        Elmi Guray Academy Admin Control
      </Text>

      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>Referral Reward Rule</Text>

        <Text style={styles.ruleText}>
          Days 1–10 → 150 Birr
        </Text>

        <Text style={styles.ruleText}>
          Days 11–20 → another 150 Birr
        </Text>

        <Text style={styles.ruleText}>
          Days 21–30 → another 150 Birr
        </Text>

        <Text style={styles.totalText}>
          Maximum 30-day reward: 450 Birr
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.sectionTitle}>Find Student</Text>

        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Student ID, phone, or name"
          autoCapitalize="none"
          onSubmitEditing={() => void findStudent()}
        />

        <Pressable
          style={styles.primaryButton}
          onPress={() => void findStudent()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            🔎 Search Student
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      ) : null}

      {message ? (
        <Text
          style={[
            styles.message,
            message.startsWith("✅")
              ? styles.successMessage
              : styles.errorMessage,
          ]}
        >
          {message}
        </Text>
      ) : null}

      {student ? (
        <View style={styles.studentCard}>
          <Text style={styles.studentName}>
            {student.name}
          </Text>

          <Text style={styles.detail}>
            Student ID: {student.student_id}
          </Text>

          <Text style={styles.detail}>
            Phone: {student.phone || "Not provided"}
          </Text>

          <Text style={styles.detail}>
            Referrer Student ID:{" "}
            {student.referred_by_student_id ||
              "No referrer recorded"}
          </Text>

          <Text style={styles.detail}>
            Referrer Phone:{" "}
            {student.referred_by_phone || "Not recorded"}
          </Text>

          <View style={styles.attendanceBox}>
            <Text style={styles.attendanceNumber}>
              {attendanceCount}
            </Text>

            <Text style={styles.attendanceLabel}>
              Present Days
            </Text>

            <Text style={styles.progressText}>
              {rewardProgress()}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Mark Today's Attendance
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.statusButton,
                styles.presentButton,
              ]}
              onPress={() => void markAttendance("Present")}
            >
              <Text style={styles.buttonText}>
                ✅ Present
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.statusButton,
                styles.absentButton,
              ]}
              onPress={() => void markAttendance("Absent")}
            >
              <Text style={styles.buttonText}>
                ❌ Absent
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.statusButton,
                styles.excusedButton,
              ]}
              onPress={() => void markAttendance("Excused")}
            >
              <Text style={styles.buttonText}>
                📝 Excused
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            Student Referral Rewards
          </Text>

          {rewards.length === 0 ? (
            <Text style={styles.emptyText}>
              No reward has been generated yet.
            </Text>
          ) : (
            rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <Text style={styles.rewardTitle}>
                  Period {reward.reward_period}
                </Text>

                <Text style={styles.detail}>
                  Attendance milestone:{" "}
                  {reward.attendance_days} days
                </Text>

                <Text style={styles.detail}>
                  Reward: {reward.reward_amount} Birr
                </Text>

                <Text style={styles.detail}>
                  Referrer: {reward.referrer_name}
                </Text>

                <Text style={styles.detail}>
                  Referrer ID: {reward.referrer_student_id}
                </Text>

                <Text style={styles.detail}>
                  Referrer Phone: {reward.referrer_phone}
                </Text>

                <Text style={styles.detail}>
                  Status: {reward.status}
                </Text>

                {reward.payment_reference ? (
                  <Text style={styles.detail}>
                    Payment Reference:{" "}
                    {reward.payment_reference}
                  </Text>
                ) : null}

                {reward.status === "Pending" ? (
                  <Pressable
                    style={styles.approveButton}
                    onPress={() => void approveReward(reward)}
                  >
                    <Text style={styles.buttonText}>
                      ✓ Approve Reward
                    </Text>
                  </Pressable>
                ) : null}

                {reward.status === "Approved" ? (
                  <Pressable
                    style={styles.paidButton}
                    onPress={() => void markRewardPaid(reward)}
                  >
                    <Text style={styles.buttonText}>
                      💰 Mark Paid
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>
      ) : null}

      <View style={styles.ledgerSection}>
        <Text style={styles.sectionTitle}>
          💰 Referral Reward Ledger
        </Text>

        {allRewards.length === 0 ? (
          <Text style={styles.emptyText}>
            No referral rewards recorded yet.
          </Text>
        ) : (
          allRewards.map((reward) => (
            <View
              key={`ledger-${reward.id}`}
              style={styles.ledgerCard}
            >
              <Text style={styles.rewardTitle}>
                {reward.referrer_name}
              </Text>

              <Text style={styles.detail}>
                Referred Student:{" "}
                {reward.referred_student_name}
              </Text>

              <Text style={styles.detail}>
                Period {reward.reward_period} •{" "}
                {reward.attendance_days} days
              </Text>

              <Text style={styles.detail}>
                {reward.reward_amount} Birr • {reward.status}
              </Text>
            </View>
          ))
        )}
      </View>

      <Link href="/admin-dashboard" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>
            ← Back to Admin Dashboard
          </Text>
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

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 60,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#123b69",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#52657a",
    marginTop: 8,
    marginBottom: 20,
  },

  ruleBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#c9d9ec",
  },

  ruleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#123b69",
    marginBottom: 10,
  },

  ruleText: {
    fontSize: 16,
    color: "#26384a",
    marginBottom: 6,
  },

  totalText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#147a3d",
    marginTop: 8,
  },

  searchBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#123b69",
    marginBottom: 12,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#f7f9fc",
    borderWidth: 1,
    borderColor: "#b8c8db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
  },

  primaryButton: {
    backgroundColor: "#1769aa",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
    textAlign: "center",
  },

  loader: {
    marginVertical: 15,
  },

  message: {
    padding: 13,
    borderRadius: 10,
    marginBottom: 15,
    fontWeight: "700",
  },

  successMessage: {
    backgroundColor: "#dff5e6",
    color: "#176b35",
  },

  errorMessage: {
    backgroundColor: "#fde4e4",
    color: "#9b2020",
  },

  studentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  studentName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#123b69",
    marginBottom: 10,
  },

  detail: {
    fontSize: 15,
    color: "#33485d",
    marginBottom: 6,
    lineHeight: 21,
  },

  attendanceBox: {
    backgroundColor: "#eef7ff",
    borderRadius: 14,
    padding: 18,
    marginVertical: 18,
    alignItems: "center",
  },

  attendanceNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: "#1769aa",
  },

  attendanceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#33485d",
  },

  progressText: {
    marginTop: 8,
    color: "#147a3d",
    fontWeight: "700",
    textAlign: "center",
  },

  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  statusButton: {
    flexGrow: 1,
    minWidth: 130,
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  presentButton: {
    backgroundColor: "#198754",
  },

  absentButton: {
    backgroundColor: "#b42318",
  },

  excusedButton: {
    backgroundColor: "#7a5c00",
  },

  rewardCard: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#d1deec",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  rewardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#123b69",
    marginBottom: 8,
  },

  approveButton: {
    backgroundColor: "#1769aa",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 10,
  },

  paidButton: {
    backgroundColor: "#198754",
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 10,
  },

  emptyText: {
    color: "#68798b",
    fontStyle: "italic",
    marginBottom: 10,
  },

  ledgerSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  ledgerCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#dbe4ee",
    paddingVertical: 12,
  },

  backButton: {
    backgroundColor: "#25384c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  backText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
});