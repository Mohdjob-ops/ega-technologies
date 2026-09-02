import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COURSE_OPTIONS = [
  "Artificial Intelligence & Generative AI",
  "Web Development",
  "Software Development & Programming",
  "Data Analytics & Data Science",
  "Cybersecurity",
  "Cloud Computing & DevOps",
  "UI/UX & Digital Product Design",
  "Digital Marketing & Social Media",
  "Business Administration & Management",
  "Accounting & Financial Management",
  "Entrepreneurship & Small Business Management",
  "Human Resources Management",
  "Project Management",
  "Leadership & Organizational Management",
  "Healthcare Administration & Management",
  "Health Information & Medical Records",
  "Digital Health & Healthcare Technology",
  "Public Health Fundamentals",
  "Computer & Digital Skills - Beginner",
];

const SCENE_TIME = 10000;

export default function PromoPreview() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const offerOpacity = useRef(new Animated.Value(0)).current;
  const offerScale = useRef(new Animated.Value(0.35)).current;

  function animateTo(nextScene: number) {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScene(nextScene);
      scale.setValue(1.04);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      animateTo((scene + 1) % 4);
    }, SCENE_TIME);

    return () => clearInterval(timer);
  }, [scene, paused]);

  useEffect(() => {
    if (paused) {
      offerOpacity.stopAnimation();
      offerScale.stopAnimation();
      return;
    }

    offerOpacity.setValue(0);
    offerScale.setValue(0.35);

    const offerAnimation = Animated.sequence([
      Animated.delay(1400),

      Animated.parallel([
        Animated.timing(offerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(offerScale, {
          toValue: 1.12,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),

      Animated.spring(offerScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),

      Animated.delay(1500),

      Animated.parallel([
        Animated.timing(offerOpacity, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(offerScale, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ]);

    offerAnimation.start();

    return () => offerAnimation.stop();
  }, [scene, paused]);

  function restart() {
    setPaused(false);
    fade.setValue(1);
    scale.setValue(1);
    offerOpacity.setValue(0);
    offerScale.setValue(0.35);
    setScene(0);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      style={styles.pageBackground}
    >
      <View style={styles.stage}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.orbThree} />

        <Text style={styles.counter}>{scene + 1} / 4</Text>

        <Animated.View
          style={[
            styles.scene,
            {
              opacity: fade,
              transform: [{ scale }],
            },
          ]}
        >
          {scene === 0 ? (
            <>
              <Image
                source={{ uri: "/images/ega-logo.png" }}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.mainTitle}>
                ELMI GURAY ACADEMY
              </Text>

              <Text style={styles.motto}>
                KNOWLEDGE • INTEGRITY • OPPORTUNITY
              </Text>

              <Text style={styles.intro}>
                Education, technology and practical skills for a changing world.
              </Text>
            </>
          ) : null}

          {scene === 1 ? (
            <>
              <Text style={styles.smallHeading}>
                EGA COURSE OPPORTUNITIES
              </Text>

              <Text style={styles.mainTitle}>
                Choose Your Learning Path
              </Text>

              <View style={styles.courseGrid}>
                {COURSE_OPTIONS.map((course) => (
                  <View key={course} style={styles.courseChip}>
                    <Text style={styles.courseText}>
                      {course}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {scene === 2 ? (
            <>
              <Text style={styles.smallHeading}>
                GLOBAL CAREER POSSIBILITIES
              </Text>

              <Text style={styles.mainTitle}>
                Skills for a Global Market
              </Text>

              <Text style={styles.intro}>
                EGA courses prepare learners for opportunities across
                technology, software, business, healthcare and digital
                industries worldwide.
              </Text>

              <View style={styles.jobGrid}>
                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>🌐</Text>
                  <Text style={styles.jobTitle}>
                    Google & Global Technology
                  </Text>
                </View>

                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>💻</Text>
                  <Text style={styles.jobTitle}>
                    Apple & Digital Products
                  </Text>
                </View>

                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>🚘</Text>
                  <Text style={styles.jobTitle}>
                    Automotive Technology
                  </Text>
                </View>

                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>🤖</Text>
                  <Text style={styles.jobTitle}>
                    Software & AI Companies
                  </Text>
                </View>

                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>☁️</Text>
                  <Text style={styles.jobTitle}>
                    Cloud & Cybersecurity
                  </Text>
                </View>

                <View style={styles.jobCard}>
                  <Text style={styles.jobIcon}>🏥</Text>
                  <Text style={styles.jobTitle}>
                    Digital Health Industries
                  </Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                Company names are examples of industries and potential
                employers. EGA does not guarantee employment.
              </Text>
            </>
          ) : null}

          {scene === 3 ? (
            <>
              <Image
                source={{ uri: "/images/ega-logo.png" }}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.mainTitle}>
                Learn Today. Build Tomorrow.
              </Text>

              <Text style={styles.finalText}>
                Build practical skills. Expand your opportunities.
                Prepare for the global digital economy.
              </Text>

              <Text style={styles.motto}>
                KNOWLEDGE • INTEGRITY • OPPORTUNITY
              </Text>
            </>
          ) : null}
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.freeOfferOverlay,
            {
              opacity: offerOpacity,
              transform: [{ scale: offerScale }],
            },
          ]}
        >
          <View style={styles.freeOfferCard}>
            <Text style={styles.freeOfferGift}>🎁 SEPTEMBER SPECIAL</Text>

            <Text style={styles.freeOfferBig}>
              FREE AI COURSES
            </Text>

            <Text style={styles.freeOfferMedium}>
              THIS MONTH
            </Text>

            <Text style={styles.freeOfferSmall}>
              Learn Artificial Intelligence & Generative AI with EGA
            </Text>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setPaused((current) => !current)}
          >
            <Text style={styles.controlText}>
              {paused ? "▶ Play" : "⏸ Pause"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={restart}
          >
            <Text style={styles.controlText}>
              ↻ Restart
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: "#03152f",
  },

  page: {
    flexGrow: 1,
    padding: 18,
    justifyContent: "center",
  },

  stage: {
    minHeight: 620,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#073b78",
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 82,
    position: "relative",
    justifyContent: "center",
  },

  orbOne: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#0ea5e9",
    opacity: 0.25,
    top: -90,
    right: -50,
  },

  orbTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#10b981",
    opacity: 0.22,
    bottom: -120,
    left: -90,
  },

  orbThree: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#8b5cf6",
    opacity: 0.16,
    top: 230,
    left: -70,
  },

  counter: {
    position: "absolute",
    right: 18,
    top: 16,
    color: "#ffffff",
    opacity: 0.75,
    fontWeight: "700",
  },

  scene: {
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 260,
    height: 260,
    maxWidth: "78%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 20,
  },

  mainTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },

  smallHeading: {
    color: "#bfdbfe",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 10,
  },

  motto: {
    color: "#dbeafe",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1,
  },

  intro: {
    maxWidth: 720,
    color: "#e2e8f0",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 17,
    marginTop: 15,
  },

  courseGrid: {
    width: "100%",
    maxWidth: 920,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
    marginTop: 10,
  },

  courseChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },

  courseText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  jobGrid: {
    width: "100%",
    maxWidth: 760,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },

  jobCard: {
    width: 220,
    minHeight: 110,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },

  jobIcon: {
    fontSize: 30,
    marginBottom: 7,
  },

  jobTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  disclaimer: {
    color: "#cbd5e1",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 650,
    marginTop: 22,
    lineHeight: 18,
  },

  finalText: {
    color: "#e2e8f0",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 27,
    maxWidth: 650,
    marginBottom: 22,
  },

  freeOfferOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    paddingHorizontal: 18,
  },

  freeOfferCard: {
    width: "92%",
    maxWidth: 700,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },

  freeOfferGift: {
    color: "#047857",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },

  freeOfferBig: {
    color: "#073b78",
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    textAlign: "center",
  },

  freeOfferMedium: {
    color: "#7c3aed",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 3,
  },

  freeOfferSmall: {
    color: "#334155",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },

  controls: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  controlButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },

  controlText: {
    color: "#12306d",
    fontWeight: "900",
  },
});
