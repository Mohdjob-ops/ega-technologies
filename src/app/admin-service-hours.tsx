import { Link, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { verifyAdminUser } from "../lib/adminAuth";
import { supabase } from "../lib/supabase";

type Filter = "all" | "assistant" | "e8";
type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

type RecordItem = {
  id: string;
  person_type: "assistant" | "e8";
  person_id: string;
  service_date: string;
  started_at: string | null;
  last_activity_at: string | null;
  ended_at: string | null;
  active_seconds: number;
  required_seconds: number;
  extra_seconds: number;
  completed_at: string | null;
  approval_status: "pending" | "approved" | "rejected";
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  name: string;
  email: string;
};

function ethiopiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sunday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0;
}

function duration(seconds: number) {
  const safe = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function time(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function status(record: RecordItem) {
  if (sunday(record.service_date)) return "Off Day";
  if (record.completed_at || record.active_seconds >= record.required_seconds) {
    return "Completed";
  }
  if (record.active_seconds > 0) return "Working";
  return "Not Started";
}

function statusColour(value: string) {
  if (value === "Completed") return "#15803d";
  if (value === "Working") return "#1d4ed8";
  if (value === "Off Day") return "#7c3aed";
  return "#b45309";
}

export default function AdminServiceHours() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [history, setHistory] = useState(false);
  const [expanded, setExpanded] = useState("");

  const today = ethiopiaToday();

  async function load() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.functions.invoke(
      "service-hours-admin",
      { body: { action: "list" } },
    );

    if (error || !data?.success) {
      setMessage(
        `❌ ${data?.message || error?.message || "Unable to load activity."}`,
      );
      setRecords([]);
    } else {
      setRecords(data.records || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    async function start() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const adminResult = await verifyAdminUser(
        user?.id || "",
        user?.email || "",
      );

      if (!adminResult.isAdmin) {
        await supabase.auth.signOut();
        router.replace("/admin-dashboard");
        return;
      }

      await load();
    }

    start();
  }, []);

  async function decide(
    record: RecordItem,
    action: "approve" | "reject",
  ) {
    setActionId(record.id);
    setMessage("");

    const { data, error } = await supabase.functions.invoke(
      "service-hours-admin",
      { body: { action, sessionId: record.id } },
    );

    if (error || !data?.success) {
      setMessage(
        `❌ ${data?.message || error?.message || "Unable to update approval."}`,
      );
    } else {
      setMessage(
        action === "approve"
          ? "✅ E8 time approved."
          : "✅ E8 time rejected.",
      );
      setRecords(data.records || []);
    }

    setActionId("");
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (!history && record.service_date !== today) return false;
      if (filter !== "all" && record.person_type !== filter) return false;
      if (dateFilter && record.service_date !== dateFilter) return false;
      if (approvalFilter !== "all" && record.approval_status !== approvalFilter) return false;
      if (!query) return true;

      return [
        record.name,
        record.email,
        record.person_id,
        record.person_type,
        record.service_date,
        status(record),
      ].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [approvalFilter, dateFilter, filter, history, records, search, today]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assistant & E8 Activity</Text>
          <Text style={styles.subtitle}>
            8 hours Monday–Saturday • Sunday off
          </Text>
        </View>

        <Link href="/admin-dashboard" asChild>
          <Pressable style={styles.back}>
            <Text style={styles.white}>← Admin</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, role or ID"
          style={styles.search}
        />
        <TextInput
          value={dateFilter}
          onChangeText={setDateFilter}
          placeholder="Filter date: YYYY-MM-DD"
          style={styles.search}
        />

        <View style={styles.filters}>
          {(["all", "assistant", "e8"] as Filter[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filter,
                filter === value && styles.activeFilter,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.white,
                ]}
              >
                {value === "all"
                  ? "All"
                  : value === "assistant"
                    ? "Assistant"
                    : "E8"}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => setHistory((value) => !value)}
            style={[styles.filter, history && styles.activeFilter]}
          >
            <Text style={[styles.filterText, history && styles.white]}>
              {history ? "History On" : "Today"}
            </Text>
          </Pressable>

          <Pressable onPress={load} style={styles.refresh}>
            <Text style={styles.filterText}>Refresh</Text>
          </Pressable>
          {(["all", "pending", "approved", "rejected"] as ApprovalFilter[]).map((value) => (
            <Pressable key={value} onPress={() => setApprovalFilter(value)} style={[styles.filter, approvalFilter === value && styles.activeFilter]}>
              <Text style={[styles.filterText, approvalFilter === value && styles.white]}>{value === "all" ? "All Statuses" : value}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!!message && <Text style={styles.message}>{message}</Text>}

      {loading ? (
        <ActivityIndicator size="large" color="#0f766e" />
      ) : (
        <>
          <Text style={styles.count}>
            Showing {visible.length} compact record
            {visible.length === 1 ? "" : "s"}
          </Text>

          <View style={styles.list}>
            {visible.map((record) => {
              const currentStatus = status(record);
              const isOpen = expanded === record.id;
              return (
                <View key={record.id} style={styles.card}>
                  <Pressable
                    onPress={() => setExpanded(isOpen ? "" : record.id)}
                    style={styles.row}
                  >
                    <View style={styles.person}>
                      <Text style={styles.name} numberOfLines={1}>
                        {record.name}
                      </Text>
                      <Text style={styles.role}>
                        {record.person_type === "assistant"
                          ? "Assistant Admin"
                          : "E8 Volunteer"}
                      </Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.label}>Today</Text>
                      <Text style={styles.value}>
                        {duration(record.active_seconds)}
                      </Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.label}>Required</Text>
                      <Text style={styles.value}>
                        {duration(record.required_seconds)}
                      </Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.label}>Extra</Text>
                      <Text style={styles.value}>
                        {duration(record.extra_seconds)}
                      </Text>
                    </View>

                    <View style={styles.statusArea}>
                      <Text
                        style={[
                          styles.status,
                          { color: statusColour(currentStatus) },
                        ]}
                      >
                        {currentStatus}
                      </Text>
                      <Text style={styles.arrow}>
                        {isOpen ? "▲" : "▼"}
                      </Text>
                    </View>
                  </Pressable>

                  {isOpen && (
                    <View style={styles.details}>
                      <Text>Date: {record.service_date}</Text>
                      <Text>ID: {record.person_id}</Text>
                      <Text>Check-in: {time(record.started_at)}</Text>
                      <Text>
                        Last activity: {time(record.last_activity_at)}
                      </Text>
                      <Text>Check-out: {time(record.ended_at)}</Text>
                      <Text>Notes: {record.notes || "No notes provided."}</Text>

                      <Text>
                        Approval: {record.approval_status}
                      </Text>
                      {record.approved_at && (
                        <Text>
                          {record.approval_status === "approved" ? "Approved" : "Rejected"} by: {record.approved_by || "Main Admin"} at {time(record.approved_at)}
                        </Text>
                      )}

                      {record.ended_at && (
                            <View style={styles.actions}>
                              <Pressable
                                disabled={actionId === record.id}
                                onPress={() => decide(record, "approve")}
                                style={styles.approve}
                              >
                                <Text style={styles.white}>Approve</Text>
                              </Pressable>

                              <Pressable
                                disabled={actionId === record.id}
                                onPress={() => decide(record, "reject")}
                                style={styles.reject}
                              >
                                <Text style={styles.white}>Reject</Text>
                              </Pressable>
                            </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {visible.length === 0 && (
              <Text style={styles.empty}>No matching activity records.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: "100%",
    backgroundColor: "#f8fafc",
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    color: "#475569",
  },
  back: {
    backgroundColor: "#0f766e",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  white: {
    color: "#ffffff",
    fontWeight: "700",
  },
  controls: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  search: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  filter: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeFilter: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  filterText: {
    color: "#334155",
    fontWeight: "600",
  },
  refresh: {
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  message: {
    color: "#334155",
    fontWeight: "600",
  },
  count: {
    color: "#475569",
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  row: {
    minHeight: 66,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  person: {
    flex: 1,
    minWidth: 125,
  },
  name: {
    color: "#0f172a",
    fontWeight: "800",
  },
  role: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  metric: {
    minWidth: 60,
    alignItems: "center",
  },
  label: {
    color: "#64748b",
    fontSize: 11,
  },
  value: {
    color: "#0f172a",
    fontWeight: "700",
    marginTop: 2,
  },
  statusArea: {
    minWidth: 82,
    alignItems: "flex-end",
  },
  status: {
    fontWeight: "800",
    fontSize: 12,
  },
  arrow: {
    color: "#64748b",
    marginTop: 4,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 7,
  },
  approve: {
    backgroundColor: "#15803d",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reject: {
    backgroundColor: "#b91c1c",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 30,
  },
});
