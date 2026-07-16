import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { supabase } from "../lib/supabase";

export default function HomeScreen() {
  useEffect(() => {
    const routeIfRecoveryLink = () => {
      if (typeof window === "undefined") return;

      const recoveryData = `${window.location.search}${window.location.hash}`;

      if (
        recoveryData.includes("error_code=otp_expired") ||
        recoveryData.includes("error=access_denied")
      ) {
        router.replace("/admin-dashboard?adminError=expired_link");
        return;
      }

      if (recoveryData.includes("type=recovery")) {
        router.replace("/reset-password");
        return;
      }

      if (
        recoveryData.includes("access_token=") &&
        recoveryData.includes("type=magiclink")
      ) {
        router.replace("/admin-dashboard");
      }
    };

    routeIfRecoveryLink();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        router.replace("/admin-dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ScrollView style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏫</Text>
        <Text style={styles.title}>EGA Technologies</Text>
        <Text style={styles.subtitle}>
          Learn Web Development step by step with HTML, CSS, JavaScript, React, quizzes, payments, and certificates.
        </Text>

        <Pressable style={styles.heroButton} onPress={() => router.push("/register")}>
          <Text style={styles.heroButtonText}>Start Learning</Text>
        </Pressable>
      </View>

      <Pressable style={styles.card} onPress={() => router.push("/explore")}>
        <Text style={styles.cardTitle}>📚 Web Development Courses</Text>
        <Text style={styles.cardText}>HTML, CSS, JavaScript, React</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push("/learner-portal")}>
        <Text style={styles.cardTitle}>🎓 Learner Portal</Text>
        <Text style={styles.cardText}>Login, quiz, progress, certificate</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push("/register")}>
        <Text style={styles.cardTitle}>📝 Register</Text>
        <Text style={styles.cardText}>Apply for EGA training programs</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push("/payments")}>
        <Text style={styles.cardTitle}>💳 Payments</Text>
        <Text style={styles.cardText}>Check payment status and training fee</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push("/admin-dashboard")}>
        <Text style={styles.cardTitle}>📊 Admin Dashboard</Text>
        <Text style={styles.cardText}>Students, fees, payments, reports</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#eef3ff" },
  hero: {
    backgroundColor: "#1e3a8a",
    paddingTop: 80,
    paddingBottom: 45,
    paddingHorizontal: 25,
    alignItems: "center",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  logo: { fontSize: 50, marginBottom: 15 },
  title: { fontSize: 36, color: "white", fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 18, color: "white", marginTop: 12, textAlign: "center" },
  heroButton: {
    backgroundColor: "#facc15",
    marginTop: 30,
    paddingVertical: 16,
    paddingHorizontal: 45,
    borderRadius: 30,
  },
  heroButtonText: { color: "#1e3a8a", fontSize: 20, fontWeight: "bold" },
  card: { backgroundColor: "white", margin: 14, padding: 22, borderRadius: 18 },
  cardTitle: { fontSize: 24, fontWeight: "bold", color: "#1e3a8a" },
  cardText: { fontSize: 17, color: "#334155", marginTop: 10 },
});
