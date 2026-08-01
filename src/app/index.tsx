import { router } from "expo-router";
import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const recoveryData =
      `${window.location.search}${window.location.hash}`;

    if (
      recoveryData.includes("error_code=otp_expired") ||
      recoveryData.includes("error=access_denied")
    ) {
      router.replace(
        "/admin-dashboard?adminError=expired_link"
      );

      return;
    }

    if (recoveryData.includes("type=recovery")) {
      router.replace(
        `/reset-password${window.location.search}${window.location.hash}`
      );
    }
  }, []);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      <View style={styles.hero}>
        <Text style={styles.logo}>🎓</Text>

        <Text style={styles.foundationName}>
          Elmi Guray Foundation
        </Text>

        <Text style={styles.title}>
          Elmi Guray Academy
        </Text>

        <Text style={styles.heroHeading}>
          Building Futures Through Technology Education
        </Text>

        <Text style={styles.subtitle}>
          EGA expands access to practical technology
          education for talented learners, with special
          support for students facing financial barriers.
        </Text>

        <View style={styles.heroButtons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.primaryButtonText}>
              Register as a Student
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/payments")}
          >
            <Text style={styles.secondaryButtonText}>
              Support EGA
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          OUR PURPOSE
        </Text>

        <Text style={styles.sectionTitle}>
          Talent is everywhere. Opportunity is not.
        </Text>

        <Text style={styles.sectionText}>
          Elmi Guray Academy helps learners develop
          practical skills in web development, artificial
          intelligence, programming, and digital technology.
        </Text>

        <Text style={styles.sectionText}>
          Our goal is not only to teach students, but also
          to help them build confidence, complete real
          projects, earn certificates, and prepare for
          employment, freelancing, and entrepreneurship.
        </Text>
      </View>

      <View style={styles.impactSection}>
        <Text style={styles.sectionLabelLight}>
          OUR IMPACT
        </Text>

        <Text style={styles.impactTitle}>
          Education creates opportunity
        </Text>

        <View style={styles.impactGrid}>
          <View style={styles.impactCard}>
            <Text style={styles.impactIcon}>🎓</Text>
            <Text style={styles.impactNumber}>Students</Text>
            <Text style={styles.impactText}>
              Learning practical technology skills
            </Text>
          </View>

          <View style={styles.impactCard}>
            <Text style={styles.impactIcon}>❤️</Text>
            <Text style={styles.impactNumber}>
              Scholarships
            </Text>
            <Text style={styles.impactText}>
              Supporting learners facing financial barriers
            </Text>
          </View>

          <View style={styles.impactCard}>
            <Text style={styles.impactIcon}>💻</Text>
            <Text style={styles.impactNumber}>Projects</Text>
            <Text style={styles.impactText}>
              Building real skills through practical work
            </Text>
          </View>

          <View style={styles.impactCard}>
            <Text style={styles.impactIcon}>📜</Text>
            <Text style={styles.impactNumber}>
              Certificates
            </Text>
            <Text style={styles.impactText}>
              Recognizing successful course completion
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          THREE WAYS TO PARTICIPATE
        </Text>

        <Text style={styles.sectionTitle}>
          Learn, support, and transform lives
        </Text>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/register")}
        >
          <View style={styles.actionIconBox}>
            <Text style={styles.actionIcon}>🎓</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Become a Student
            </Text>

            <Text style={styles.actionText}>
              Register for practical training and begin
              building your technology career.
            </Text>

            <Text style={styles.actionLink}>
              Register now →
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/payments")}
        >
          <View style={styles.actionIconBox}>
            <Text style={styles.actionIcon}>🤝</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Sponsor a Student
            </Text>

            <Text style={styles.actionText}>
              Help remove financial barriers and give a
              learner access to technology education.
            </Text>

            <Text style={styles.actionLink}>
              Support a learner →
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => router.push("/payments")}
        >
          <View style={styles.actionIconBox}>
            <Text style={styles.actionIcon}>❤️</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Support EGA
            </Text>

            <Text style={styles.actionText}>
              Your support can help provide scholarships,
              internet access, learning materials, software,
              and educational equipment.
            </Text>

            <Text style={styles.actionLink}>
              Make an impact →
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.learningSection}>
        <Text style={styles.sectionLabel}>
          WHAT STUDENTS LEARN
        </Text>

        <Text style={styles.sectionTitle}>
          Practical skills for the digital economy
        </Text>

        <View style={styles.courseGrid}>
          <View style={styles.courseCard}>
            <Text style={styles.courseIcon}>🌐</Text>
            <Text style={styles.courseTitle}>
              Web Development
            </Text>
            <Text style={styles.courseText}>
              HTML, CSS, JavaScript, React, projects, and
              modern website development.
            </Text>
          </View>

          <View style={styles.courseCard}>
            <Text style={styles.courseIcon}>🤖</Text>
            <Text style={styles.courseTitle}>
              Artificial Intelligence
            </Text>
            <Text style={styles.courseText}>
              Learn how AI tools work and how to use them
              responsibly for learning and development.
            </Text>
          </View>

          <View style={styles.courseCard}>
            <Text style={styles.courseIcon}>💡</Text>
            <Text style={styles.courseTitle}>
              Career Skills
            </Text>
            <Text style={styles.courseText}>
              Build projects, portfolios, confidence, and
              readiness for remote and global opportunities.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.exploreButton}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.exploreButtonText}>
            Explore Courses
          </Text>
        </Pressable>
      </View>

      <View style={styles.scholarshipSection}>
        <Text style={styles.scholarshipIcon}>🌱</Text>

        <Text style={styles.scholarshipTitle}>
          Education should not depend on wealth
        </Text>

        <Text style={styles.scholarshipText}>
          EGA is developing a scholarship and sponsorship
          program for committed learners who cannot afford
          the full cost of technology education.
        </Text>

        <Text style={styles.scholarshipText}>
          Every contribution can help a student learn,
          create, and build a more independent future.
        </Text>

        <Pressable
          style={styles.scholarshipButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.scholarshipButtonText}>
            Register Your Interest
          </Text>
        </Pressable>
      </View>

      <View style={styles.founderSection}>
        <Text style={styles.sectionLabelLight}>
          FOUNDER’S MESSAGE
        </Text>

        <Text style={styles.quoteMark}>“</Text>

        <Text style={styles.founderQuote}>
          I founded Elmi Guray Academy with the belief that
          talent exists everywhere, but opportunity does
          not. My dream is to ensure that financial hardship
          never prevents a committed learner from developing
          the skills that can transform their life.
        </Text>

        <Text style={styles.founderName}>
          Mohammed Elmi Issak
        </Text>

        <Text style={styles.founderRole}>
          Founder, Elmi Guray Foundation
        </Text>

        <Text style={styles.founderRole}>
          Founder & President, Elmi Guray Academy
        </Text>
      </View>

      <View style={styles.navigationSection}>
        <Text style={styles.sectionLabel}>
          EGA PLATFORM
        </Text>

        <Text style={styles.sectionTitle}>
          Continue your journey
        </Text>

        <Pressable
          style={styles.navigationCard}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.navigationTitle}>
            📚 Explore Courses
          </Text>

          <Text style={styles.navigationText}>
            Browse lessons, projects, quizzes, and learning
            resources.
          </Text>
        </Pressable>

        <Pressable
          style={styles.navigationCard}
          onPress={() => router.push("/learner-portal")}
        >
          <Text style={styles.navigationTitle}>
            🎓 Learner Portal
          </Text>

          <Text style={styles.navigationText}>
            View your learning progress, quizzes,
            assignments, and certificates.
          </Text>
        </Pressable>

        <Pressable
          style={styles.navigationCard}
          onPress={() => router.push("/leaderboard")}
        >
          <Text style={styles.navigationTitle}>
            🏆 Student Leaderboard
          </Text>

          <Text style={styles.navigationText}>
            Celebrate student achievement and view top quiz
            results.
          </Text>
        </Pressable>

        <Pressable
          style={styles.navigationCard}
          onPress={() => router.push("/payments")}
        >
          <Text style={styles.navigationTitle}>
            💳 Payments & Support
          </Text>

          <Text style={styles.navigationText}>
            Check payment information and access available
            support options.
          </Text>
        </Pressable>

        <Pressable
          style={styles.adminCard}
          onPress={() => router.push("/admin-dashboard")}
        >
          <Text style={styles.adminTitle}>
            🔐 Secure Admin Dashboard
          </Text>

          <Text style={styles.adminText}>
            Authorized administrators only
          </Text>
        </Pressable>
      </View>

      <View style={styles.finalCallSection}>
        <Text style={styles.finalCallTitle}>
          One Student. One Future. One Opportunity.
        </Text>

        <Text style={styles.finalCallText}>
          Join Elmi Guray Academy as a learner, supporter,
          mentor, volunteer, or future partner.
        </Text>

        <Pressable
          style={styles.finalCallButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.finalCallButtonText}>
            Begin Your Journey
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>
          Elmi Guray Academy
        </Text>

        <Text style={styles.footerText}>
          An education initiative of Elmi Guray Foundation
        </Text>

        <Text style={styles.footerMotto}>
          Learn with Purpose. Build with Integrity. Lead
          Through Service.
        </Text>

        <Text style={styles.footerFounder}>
          Founded by Mohammed Elmi Issak
        </Text>

        <Text style={styles.footerCopyright}>
          © 2026 Elmi Guray Foundation. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },

  pageContent: {
    paddingBottom: 0,
  },

  hero: {
    backgroundColor: "#12326b",
    paddingTop: 75,
    paddingBottom: 55,
    paddingHorizontal: 22,
    alignItems: "center",
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
  },

  logo: {
    fontSize: 58,
    marginBottom: 12,
  },

  foundationName: {
    color: "#facc15",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },

  title: {
    color: "#ffffff",
    fontSize: 39,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },

  heroHeading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
    marginTop: 15,
  },

  subtitle: {
    color: "#dbeafe",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 27,
    marginTop: 16,
    maxWidth: 720,
  },

  heroButtons: {
    width: "100%",
    maxWidth: 480,
    marginTop: 30,
  },

  primaryButton: {
    backgroundColor: "#facc15",
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#12326b",
    fontSize: 18,
    fontWeight: "900",
  },

  secondaryButton: {
    borderWidth: 2,
    borderColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 13,
  },

  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  section: {
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 25,
  },

  sectionLabel: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.7,
    textAlign: "center",
  },

  sectionLabelLight: {
    color: "#facc15",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.7,
    textAlign: "center",
  },

  sectionTitle: {
    color: "#102a56",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 37,
    marginTop: 10,
    marginBottom: 18,
  },

  sectionText: {
    color: "#475569",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginBottom: 13,
    maxWidth: 800,
    alignSelf: "center",
  },

  impactSection: {
    backgroundColor: "#12326b",
    marginTop: 30,
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  impactTitle: {
    color: "#ffffff",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  impactGrid: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  impactCard: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
  },

  impactIcon: {
    fontSize: 35,
    marginBottom: 8,
  },

  impactNumber: {
    color: "#12326b",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  impactText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 7,
  },

  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#dbe5f2",
  },

  actionIconBox: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#e7efff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  actionIcon: {
    fontSize: 27,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: "#12326b",
    fontSize: 22,
    fontWeight: "900",
  },

  actionText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 7,
  },

  actionLink: {
    color: "#1d4ed8",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 11,
  },

  learningSection: {
    backgroundColor: "#edf3ff",
    paddingHorizontal: 18,
    paddingVertical: 48,
    marginTop: 20,
  },

  courseGrid: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
  },

  courseIcon: {
    fontSize: 34,
    marginBottom: 11,
  },

  courseTitle: {
    color: "#12326b",
    fontSize: 21,
    fontWeight: "900",
  },

  courseText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },

  exploreButton: {
    backgroundColor: "#12326b",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 28,
    alignSelf: "center",
    marginTop: 15,
    minWidth: 220,
    alignItems: "center",
  },

  exploreButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  scholarshipSection: {
    backgroundColor: "#fff7d6",
    marginHorizontal: 16,
    marginVertical: 48,
    paddingHorizontal: 22,
    paddingVertical: 35,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f4d96d",
  },

  scholarshipIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  scholarshipTitle: {
    color: "#12326b",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center",
  },

  scholarshipText: {
    color: "#475569",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 13,
    maxWidth: 700,
  },

  scholarshipButton: {
    backgroundColor: "#12326b",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 28,
    marginTop: 23,
  },

  scholarshipButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  founderSection: {
    backgroundColor: "#12326b",
    paddingHorizontal: 22,
    paddingVertical: 50,
    alignItems: "center",
  },

  quoteMark: {
    color: "#facc15",
    fontSize: 70,
    fontWeight: "900",
    height: 65,
    marginTop: 12,
  },

  founderQuote: {
    color: "#ffffff",
    fontSize: 19,
    lineHeight: 30,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: 780,
  },

  founderName: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 25,
  },

  founderRole: {
    color: "#dbeafe",
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },

  navigationSection: {
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  navigationCard: {
    backgroundColor: "#ffffff",
    padding: 21,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbe5f2",
  },

  navigationTitle: {
    color: "#12326b",
    fontSize: 21,
    fontWeight: "900",
  },

  navigationText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },

  adminCard: {
    backgroundColor: "#e2e8f0",
    padding: 20,
    borderRadius: 18,
    marginTop: 8,
  },

  adminTitle: {
    color: "#334155",
    fontSize: 19,
    fontWeight: "900",
  },

  adminText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 7,
  },

  finalCallSection: {
    backgroundColor: "#facc15",
    paddingHorizontal: 22,
    paddingVertical: 48,
    alignItems: "center",
  },

  finalCallTitle: {
    color: "#12326b",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 39,
  },

  finalCallText: {
    color: "#334155",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 13,
    maxWidth: 680,
  },

  finalCallButton: {
    backgroundColor: "#12326b",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    marginTop: 24,
  },

  finalCallButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  footer: {
    backgroundColor: "#081a38",
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 45,
    alignItems: "center",
  },

  footerTitle: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  footerText: {
    color: "#bfdbfe",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },

  footerMotto: {
    color: "#facc15",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
    maxWidth: 600,
  },

  footerFounder: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },

  footerCopyright: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 18,
  },
});