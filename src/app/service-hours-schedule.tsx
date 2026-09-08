import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function ServiceHoursSchedule() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Assistant & E8 Schedule</Text>
      <Text style={styles.readOnly}>🔒 Read-only schedule</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Weekly service requirements</Text>
        <Text style={styles.summaryText}>Assistant Admin: 8 hours each day</Text>
        <Text style={styles.summaryText}>E8 volunteers: 4 hours each day</Text>
        <Text style={styles.summaryText}>Monday–Saturday</Text>
        <Text style={styles.summaryText}>
          Service day boundary: 6:00 AM Ethiopia time
        </Text>
      </View>

      <View style={styles.list}>
        {DAYS.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={styles.day}>{day}</Text>
            <Text style={styles.hours}>Assistant 8h • E8 4h</Text>
          </View>
        ))}

        <View style={[styles.row, styles.sunday]}>
          <Text style={styles.day}>Sunday</Text>
          <Text style={styles.off}>Off Day</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          You may start at any time during the service day; 6:00 AM is not a mandatory check-in time.
        </Text>
        <Text style={styles.noticeText}>
          Each service day ends at 5:59:59 AM the following morning. Required hours must be completed before then.
        </Text>
        <Text style={styles.noticeText}>
          Activity beyond each role's required hours is recorded as Extra Time.
        </Text>
        <Text style={styles.noticeText}>
          Sunday activity is optional and is recorded only as Extra Time.
        </Text>
        <Text style={styles.noticeText}>
          E8 service records require main-admin approval.
        </Text>
        <Text style={styles.noticeText}>
          Assistant and E8 members can view this schedule but cannot edit it.
        </Text>
      </View>

      <Link href="/" asChild>
        <Pressable style={styles.back}>
          <Text style={styles.backText}>← Back to EGA Home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: "100%",
    backgroundColor: "#f8fafc",
    padding: 20,
    gap: 15,
  },
  title: {
    color: "#0f172a",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },
  readOnly: {
    color: "#475569",
    fontWeight: "700",
    textAlign: "center",
  },
  summary: {
    backgroundColor: "#0f766e",
    borderRadius: 13,
    padding: 16,
    gap: 6,
  },
  summaryTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  summaryText: {
    color: "#ecfeff",
    fontWeight: "600",
  },
  list: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sunday: {
    backgroundColor: "#f3e8ff",
    borderBottomWidth: 0,
  },
  day: {
    color: "#0f172a",
    fontWeight: "700",
  },
  hours: {
    color: "#15803d",
    fontWeight: "800",
  },
  off: {
    color: "#7c3aed",
    fontWeight: "800",
  },
  notice: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noticeText: {
    color: "#334155",
    lineHeight: 21,
  },
  back: {
    alignSelf: "center",
    backgroundColor: "#0f766e",
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  backText: {
    color: "#ffffff",
    fontWeight: "800",
  },
});
