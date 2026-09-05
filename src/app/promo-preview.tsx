import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
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

const CEGA_LADIES = [
  {
    name: "Asiya Mukhtar Aydid",
    phone: "0909700204",
    whatsapp: "251909700204",
  },
  {
    name: "Sumaya Ali",
    phone: "0927933389",
    whatsapp: "251927933389",
  },
];

const CEGA_MALE = [
  {
    name: "Abdulla Elmi Issak",
    phone: "251915304848",
    whatsapp: "251915304848",
  },
  {
    name: "Abdulahi Mohammed Ibrahim",
    phone: "0924907077",
    whatsapp: "251924907077",
  },
  {
    name: "Abdirahman Haye Aydid",
    phone: "0915456363",
    whatsapp: "251915456363",
  },
  {
    name: "Badal Mukhtar Bada",
    phone: "0907697431",
    whatsapp: "251907697431",
  },
  {
    name: "Abdirahman Abdulahi Abdi",
    phone: "251929471073",
    whatsapp: "251929471073",
  },
  {
    name: "Musab Abdirahman Farah",
    phone: "0911909836",
    whatsapp: "251911909836",
  },
];

const SCENE_TIME = 13000;

export default function PromoPreview() {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [contactStep, setContactStep] = useState(0);
  const [offerKind, setOfferKind] = useState<"ai" | "cyber">("ai");

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
    if (paused || contactVisible) return;

    const timer = setTimeout(() => {
      if (scene === 3) {
        setContactStep(0);
        setContactVisible(true);
        return;
      }

      animateTo((scene + 1) % 4);
    }, SCENE_TIME);

    return () => clearTimeout(timer);
  }, [scene, paused, contactVisible]);

  useEffect(() => {
    if (paused || contactVisible) {
      offerOpacity.stopAnimation();
      offerScale.stopAnimation();
      return;
    }

    let cancelled = false;

    setOfferKind("ai");
    offerOpacity.setValue(0);
    offerScale.setValue(0.35);

    const showOffer = (
      visibleTime: number,
      onComplete?: () => void
    ) => {
      const animation = Animated.sequence([
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

        Animated.delay(visibleTime),

        Animated.parallel([
          Animated.timing(offerOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(offerScale, {
            toValue: 0.45,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]);

      animation.start(({ finished }) => {
        if (finished && !cancelled && onComplete) {
          onComplete();
        }
      });

      return animation;
    };

    let cyberAnimation: Animated.CompositeAnimation | null = null;

    const delayTimer = setTimeout(() => {
      if (cancelled) return;

      showOffer(4000, () => {
        if (cancelled) return;

        setOfferKind("cyber");
        offerOpacity.setValue(0);
        offerScale.setValue(0.35);

        cyberAnimation = showOffer(5000);
      });
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(delayTimer);
      cyberAnimation?.stop();
      offerOpacity.stopAnimation();
      offerScale.stopAnimation();
    };
  }, [scene, paused, contactVisible]);

  function openWhatsApp(number: string) {
    const message =
      "Hello EGA. I am interested in Elmi Guray Academy and would like more information.";

    const url =
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message);

    void Linking.openURL(url);
  }

  function closeContactAndContinue() {
    setContactVisible(false);
    setContactStep(0);
    animateTo((scene + 1) % 4);
  }

  function nextContactCard() {
    if (contactStep < 2) {
      setContactStep((current) => current + 1);
      return;
    }

    closeContactAndContinue();
  }

  function restart() {
    setPaused(false);
    setContactVisible(false);
    setContactStep(0);
    fade.setValue(1);
    scale.setValue(1);
    offerOpacity.setValue(0);
    offerScale.setValue(0.35);
    setOfferKind("ai");
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
            {offerKind === "ai" ? (
              <>
                <Text style={styles.freeOfferGift}>
                  🎁 SEPTEMBER SPECIAL
                </Text>

                <Text style={styles.freeOfferBig}>
                  FREE AI COURSES
                </Text>

                <Text style={styles.freeOfferMedium}>
                  THIS MONTH
                </Text>

                <Text style={styles.freeOfferSmall}>
                  Learn Artificial Intelligence & Generative AI with EGA
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.freeOfferGift}>
                  🔐 CEGA CYBERSECURITY
                </Text>

                <Text style={styles.freeOfferBig}>
                  REGISTRATION OPEN
                </Text>

                <Text style={styles.freeOfferMedium}>
                  SEPTEMBER 5–30, 2026
                </Text>

                <Text style={styles.freeOfferSmall}>
                  🚀 Starts October 1, 2026{"\n"}
                  💳 Course Fee: 3,000 Birr{"\n"}
                  🏁 Ends May 31, 2027
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        {contactVisible ? (
          <View style={styles.contactOverlay}>
            <ScrollView
              style={styles.contactScroll}
              contentContainerStyle={styles.contactScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contactCard}>
                <TouchableOpacity
                  style={styles.contactClose}
                  onPress={closeContactAndContinue}
                >
                  <Text style={styles.contactCloseText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.cegaBadge}>CEGA</Text>

                <Text style={styles.contactHeading}>
                  CONTACT ELMI GURAY ACADEMY
                </Text>

                {contactStep === 0 ? (
                  <>
                    <Text style={styles.contactName}>
                      Mohammed Elmi Issak
                    </Text>

                    <Text style={styles.contactRole}>
                      Founder & President • CEGA Lead
                    </Text>

                    <TouchableOpacity
                      style={styles.whatsappBox}
                      onPress={() => openWhatsApp("251908659988")}
                    >
                      <Text style={styles.whatsappLabel}>
                        WhatsApp EGA
                      </Text>

                      <Text style={styles.whatsappNumber}>
                        0908659988
                      </Text>

                      <Text style={styles.tapWhatsApp}>
                        Tap to open WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.contactMessage}>
                      EGA students helping future EGA students.
                      CEGA provides course links, registration guidance,
                      learning support and follow-up assistance.
                    </Text>

                    <View style={styles.supportChoiceRow}>
                      <View style={styles.supportChoice}>
                        <Text style={styles.supportChoiceIcon}>👩</Text>
                        <Text style={styles.supportChoiceTitle}>
                          Ladies’ Support
                        </Text>
                        <Text style={styles.supportChoiceText}>
                          Asiya & Sumaya
                        </Text>
                      </View>

                      <View style={styles.supportChoice}>
                        <Text style={styles.supportChoiceIcon}>👨</Text>
                        <Text style={styles.supportChoiceTitle}>
                          Male Support
                        </Text>
                        <Text style={styles.supportChoiceText}>
                          Six CEGA representatives
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {contactStep === 1 ? (
                  <>
                    <Text style={styles.contactName}>
                      👩 Ladies’ CEGA Support
                    </Text>

                    <Text style={styles.contactRole}>
                      Ladies supporting ladies in learning and digital opportunities
                    </Text>

                    <Text style={styles.contactMessage}>
                      Ladies interested in EGA can contact our Ladies’
                      CEGA representatives for course links, registration
                      guidance and continued support.
                    </Text>

                    <View style={styles.memberList}>
                      {CEGA_LADIES.map((member) => (
                        <TouchableOpacity
                          key={member.name}
                          style={styles.memberCard}
                          onPress={() => openWhatsApp(member.whatsapp)}
                        >
                          <Text style={styles.memberName}>
                            {member.name}
                          </Text>

                          <Text style={styles.memberRole}>
                            Ladies’ CEGA Support Representative
                          </Text>

                          <Text style={styles.memberPhone}>
                            WhatsApp: {member.phone}
                          </Text>

                          
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : null}

                {contactStep === 2 ? (
                  <>
                    <Text style={styles.contactName}>
                      👨 Male CEGA Support
                    </Text>

                    <Text style={styles.contactRole}>
                      Male students supporting interested male students
                    </Text>

                    <Text style={styles.contactMessage}>
                      Interested male students can contact any of these
                      CEGA representatives for EGA links, course information,
                      registration guidance and follow-up support.
                    </Text>

                    <View style={styles.memberList}>
                      {CEGA_MALE.map((member) => (
                        <TouchableOpacity
                          key={member.name}
                          style={styles.memberCard}
                          onPress={() => openWhatsApp(member.whatsapp)}
                        >
                          <Text style={styles.memberName}>
                            {member.name}
                          </Text>

                          <Text style={styles.memberRole}>
                            Male CEGA Support Representative
                          </Text>

                          <Text style={styles.memberPhone}>
                            WhatsApp: {member.phone}
                          </Text>

                          
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.opportunityBox}>
                      <Text style={styles.opportunityTitle}>
                        🎓 FREE AI → ASSESSMENT → FUTURE OPPORTUNITIES
                      </Text>

                      <Text style={styles.opportunityText}>
                        Students who successfully complete the free AI
                        course and pass the assessment may be considered
                        for EGA work opportunities when positions become available.
                      </Text>

                      <Text style={styles.opportunityDisclaimer}>
                        Completing the course and passing the assessment
                        does not guarantee employment. Selection depends
                        on available opportunities and EGA requirements.
                      </Text>
                    </View>
                  </>
                ) : null}

                <View style={styles.contactNavigation}>
                  {contactStep > 0 ? (
                    <TouchableOpacity
                      style={styles.backCardButton}
                      onPress={() =>
                        setContactStep((current) => current - 1)
                      }
                    >
                      <Text style={styles.backCardButtonText}>
                        ◀ Previous
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={nextContactCard}
                  >
                    <Text style={styles.continueButtonText}>
                      {contactStep < 2
                        ? "Next CEGA Card ▶"
                        : "Continue Preview ▶"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardCounter}>
                  CEGA Card {contactStep + 1} of 3
                </Text>
              </View>
            </ScrollView>
          </View>
        ) : null}

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

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.controlText}>
              ← Back to EGA Home
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

  contactOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(3,21,47,0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  contactScroll: {
    width: "100%",
    maxWidth: 820,
  },

  contactScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 16,
  },

  contactCard: {
    width: "94%",
    maxWidth: 760,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingTop: 38,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },

  contactClose: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  contactCloseText: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
  },

  cegaBadge: {
    backgroundColor: "#047857",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
  },

  contactHeading: {
    color: "#047857",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 12,
  },

  contactName: {
    color: "#073b78",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    textAlign: "center",
  },

  contactRole: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
  },

  whatsappBox: {
    width: "100%",
    backgroundColor: "#ecfdf5",
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 12,
  },

  whatsappLabel: {
    color: "#047857",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  whatsappNumber: {
    color: "#064e3b",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },

  contactMessage: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 520,
  },

  contactWait: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },

  continueButton: {
    backgroundColor: "#073b78",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 22,
    marginTop: 12,
    minWidth: 220,
  },

  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  tapWhatsApp: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  supportChoiceRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  supportChoice: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },

  supportChoiceIcon: {
    fontSize: 22,
  },

  supportChoiceTitle: {
    color: "#073b78",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },

  supportChoiceText: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  memberList: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 7,
    marginTop: 9,
  },

  memberCard: {
    width: "48.5%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },

  memberName: {
    color: "#073b78",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  memberRole: {
    color: "#475569",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },

  memberPhone: {
    color: "#047857",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    marginTop: 3,
  },

  memberTap: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },

  opportunityBox: {
    width: "100%",
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 10,
    marginTop: 9,
  },

  opportunityTitle: {
    color: "#073b78",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },

  opportunityText: {
    color: "#334155",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 5,
  },

  opportunityDisclaimer: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
    marginTop: 5,
  },

  contactNavigation: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },

  backCardButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginTop: 22,
  },

  backCardButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },

  cardCounter: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
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
