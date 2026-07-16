import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { verifyAdminSession, verifyAdminUser } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

type RegistrationAttempt = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  course?: string | null;
  status: string;
  status_message?: string | null;
  student_id?: string | null;
  source?: string | null;
  created_at: string;
};

const POLL_INTERVAL_MS = 10000;
const LAST_SEEN_KEY = "ega_last_seen_registration_attempt_at";

function canUseNotifications() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "success":
      return "Registration success";
    case "submitted":
      return "Registration submitted";
    case "validation_failed":
      return "Validation failed";
    case "duplicate_phone":
      return "Duplicate phone";
    case "duplicate_email":
      return "Duplicate email";
    case "email_error":
      return "Registered, email issue";
    case "transaction_error":
      return "Transaction error";
    case "registration_error":
      return "Registration error";
    case "duplicate_check_error":
      return "Duplicate check error";
    default:
      return status.replace(/_/g, " ");
  }
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString();
}

export default function AdminRegistrationMonitor() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [attempts, setAttempts] = useState<RegistrationAttempt[]>([]);
  const [message, setMessage] = useState("");
  const [notificationStatus, setNotificationStatus] =
    useState("Notifications are not enabled yet.");
  const [loading, setLoading] = useState(false);

  const lastSeenAtRef = useRef("");
  const initializedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const admin = await verifyAdminSession();

      if (!active) return;

      setIsAdmin(admin.isAdmin);
      setCheckingAccess(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }

      setCheckingAccess(true);
      const admin = await verifyAdminUser(session.user.id);

      if (!active) return;

      setIsAdmin(admin.isAdmin);
      setCheckingAccess(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!canUseNotifications()) {
      setNotificationStatus("Browser notifications are unavailable here.");
      return;
    }

    setNotificationStatus(`Notification permission: ${Notification.permission}`);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    loadAttempts();

    const intervalId = window.setInterval(() => {
      loadAttempts();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAdmin]);

  async function requestNotificationPermission() {
    if (!canUseNotifications()) {
      setNotificationStatus("Browser notifications are unavailable here.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(`Notification permission: ${permission}`);
  }

  function saveLastSeen(value: string) {
    lastSeenAtRef.current = value;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_SEEN_KEY, value);
    }
  }

  function getSavedLastSeen() {
    if (lastSeenAtRef.current) {
      return lastSeenAtRef.current;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(LAST_SEEN_KEY) || "";
  }

  function notifyAttempt(attempt: RegistrationAttempt) {
    if (!canUseNotifications() || Notification.permission !== "granted") {
      return;
    }

    const name = attempt.full_name || "Unknown student";
    const phone = attempt.phone || "No phone";
    const status = statusLabel(attempt.status);

    new Notification(`EGA: ${status}`, {
      body: `${name} | ${phone}`,
    });
  }

  async function loadAttempts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("registration_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    setLoading(false);

    if (error) {
      setMessage("❌ Could not load registration attempts: " + error.message);
      return;
    }

    const nextAttempts = (data || []) as RegistrationAttempt[];
    setAttempts(nextAttempts);
    setMessage("");

    if (nextAttempts.length === 0) {
      return;
    }

    const latestCreatedAt = nextAttempts[0].created_at;
    const savedLastSeen = getSavedLastSeen();

    if (!initializedRef.current) {
      initializedRef.current = true;
      saveLastSeen(savedLastSeen || latestCreatedAt);
      return;
    }

    const newAttempts = nextAttempts
      .filter((attempt) => attempt.created_at > savedLastSeen)
      .reverse();

    newAttempts.forEach(notifyAttempt);

    if (latestCreatedAt > savedLastSeen) {
      saveLastSeen(latestCreatedAt);
    }
  }

  if (checkingAccess) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" />
        <Text style={styles.subtitle}>Checking admin access...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔐 Admin Access Required</Text>
        <Text style={styles.subtitle}>
          Log in from the Admin Dashboard first.
        </Text>

        <Link href="/admin-dashboard" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.buttonText}>Go to Admin Dashboard</Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/admin-dashboard" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.backText}>← Admin Dashboard</Text>
        </Pressable>
      </Link>

      <Text style={styles.title}>🔔 Registration Alerts</Text>
      <Text style={styles.subtitle}>
        Keep this page open on the admin computer to receive pop-up alerts.
      </Text>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Computer Pop-Ups</Text>
        <Text style={styles.noticeText}>{notificationStatus}</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={requestNotificationPermission}
        >
          <Text style={styles.buttonText}>Enable Browser Pop-Ups</Text>
        </Pressable>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.resultText}>
          Latest {attempts.length} attempts
        </Text>

        <Pressable style={styles.refreshButton} onPress={loadAttempts}>
          <Text style={styles.refreshText}>
            {loading ? "Refreshing..." : "Refresh"}
          </Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {attempts.length === 0 && !message ? (
        <Text style={styles.emptyText}>No registration attempts yet.</Text>
      ) : null}

      {attempts.map((attempt) => (
        <View key={attempt.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {statusLabel(attempt.status)}
            </Text>
            <Text style={styles.cardTime}>
              {formatTime(attempt.created_at)}
            </Text>
          </View>

          <Text style={styles.text}>
            Name: {attempt.full_name || "Not entered"}
          </Text>
          <Text style={styles.text}>
            Phone: {attempt.phone || "Not entered"}
          </Text>
          <Text style={styles.text}>
            Email: {attempt.email || "Not entered"}
          </Text>
          <Text style={styles.text}>
            Student ID: {attempt.student_id || "Not created"}
          </Text>
          <Text style={styles.detailText}>
            {attempt.status_message || "No message"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 50,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#12306d",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#334155",
    textAlign: "center",
    lineHeight: 27,
    marginBottom: 20,
  },
  noticeBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },
  noticeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7c2d12",
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 16,
    color: "#7c2d12",
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#12306d",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  resultText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#12306d",
  },
  refreshButton: {
    backgroundColor: "#dbeafe",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  refreshText: {
    color: "#12306d",
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "bold",
    color: "#12306d",
    textTransform: "capitalize",
  },
  cardTime: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "right",
  },
  text: {
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 5,
  },
  detailText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    color: "#b00020",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 17,
    color: "#475569",
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    marginTop: 10,
    marginBottom: 18,
  },
  backText: {
    color: "#12306d",
    fontSize: 18,
    fontWeight: "bold",
  },
});
