import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type Language = "en" | "so";

const translations = {
  en: {
    foundation: "Elmi Guray Foundation",
    academy: "Elmi Guray Academy",

    heroHeading:
      "Building Futures Through Technology Education",
    subtitle:
      "EGA expands access to practical technology education for talented learners, with special support for students facing financial barriers.",

    register: "📝 Register",
    learnerPortal: "🎓 Learner Portal",
    payments: "💳 Payments",
    supportEga: "❤️ Support EGA",

    ourPurpose: "OUR PURPOSE",
    purposeTitle:
      "Talent is everywhere. Opportunity is not.",
    purposeText1:
      "Elmi Guray Academy helps learners develop practical skills in web development, artificial intelligence, programming, and digital technology.",
    purposeText2:
      "Our goal is not only to teach students, but also to help them build confidence, complete real projects, earn certificates, and prepare for employment, freelancing, and entrepreneurship.",

    ourImpact: "OUR IMPACT",
    impactTitle: "Education creates opportunity",

    students: "Students",
    studentsText:
      "Learning practical technology skills",

    scholarships: "Scholarships",
    scholarshipsText:
      "Supporting learners facing financial barriers",

    projects: "Projects",
    projectsText:
      "Building real skills through practical work",

    certificates: "Certificates",
    certificatesText:
      "Recognizing successful course completion",

    participateLabel: "THREE WAYS TO PARTICIPATE",
    participateTitle:
      "Learn, support, and transform lives",

    becomeStudent: "Become a Student",
    becomeStudentText:
      "Register for practical training and begin building your technology career.",
    registerNow: "Register now →",

    sponsorStudent: "Sponsor a Student",
    sponsorStudentText:
      "Help remove financial barriers and give a learner access to technology education.",
    supportLearner: "Support a learner →",

    supportTitle: "Support EGA",
    supportText:
      "Help provide scholarships, internet access, learning materials, software, and educational equipment.",
    makeImpact: "Make an impact →",

    learnLabel: "WHAT STUDENTS LEARN",
    learnTitle:
      "Practical skills for the digital economy",

    webDevelopment: "Web Development",
    webDevelopmentText:
      "HTML, CSS, JavaScript, React, projects, and modern website development.",

    artificialIntelligence: "Artificial Intelligence",
    artificialIntelligenceText:
      "Learn how AI tools work and how to use them responsibly for learning and development.",

    careerSkills: "Career Skills",
    careerSkillsText:
      "Build projects, portfolios, confidence, and readiness for remote and global opportunities.",

    exploreCourses: "Explore Courses",

    scholarshipTitle:
      "Education should not depend on wealth",
    scholarshipText1:
      "EGA is developing a scholarship and sponsorship program for committed learners who cannot afford the full cost of technology education.",
    scholarshipText2:
      "Every contribution can help a student learn, create, and build a more independent future.",
    registerInterest: "Register Your Interest",

    founderLabel: "FOUNDER’S MESSAGE",
    founderQuote:
      "I founded Elmi Guray Academy with the belief that talent exists everywhere, but opportunity does not. My dream is to ensure that financial hardship never prevents a committed learner from developing the skills that can transform their life.",
    founderName: "Mohammed Elmi Issak",
    founderRole1: "Founder, Elmi Guray Foundation",
    founderRole2:
      "Founder & President, Elmi Guray Academy",

    platformLabel: "EGA PLATFORM",
    journeyTitle: "Continue your journey",

    exploreNavigation: "📚 Explore Courses",
    exploreNavigationText:
      "Browse lessons, projects, quizzes, and learning resources.",

    learnerNavigation: "🎓 Learner Portal",
    learnerNavigationText:
      "View your learning progress, quizzes, assignments, and certificates.",

    leaderboard: "🏆 Student Leaderboard",
    leaderboardText:
      "Celebrate student achievement and view top quiz results.",

    paymentsSupport: "💳 Payments & Support",
    paymentsSupportText:
      "Check payment information and access available support options.",

    adminDashboard: "🔐 Secure Admin Dashboard",
    adminOnly: "Authorized administrators only",

    finalTitle:
      "One Student. One Future. One Opportunity.",
    finalText:
      "Join Elmi Guray Academy as a learner, supporter, mentor, volunteer, or future partner.",
    beginJourney: "Begin Your Journey",

    footerText:
      "An education initiative of Elmi Guray Foundation",
    footerMotto:
      "Learn with Purpose. Build with Integrity. Lead Through Service.",
    footerFounder:
      "Founded by Mohammed Elmi Issak",
    copyright:
      "© 2026 Elmi Guray Foundation. All rights reserved.",
  },

  so: {
    foundation: "Mu’asasada Elmi Guray",
    academy: "Akadeemiyada Elmi Guray",

    heroHeading:
      "Dhisidda Mustaqbalka Iyadoo Loo Marayo Waxbarashada Teknoolojiyadda",
    subtitle:
      "EGA waxay ballaarisaa helitaanka waxbarashada teknoolojiyadda ee wax-ku-oolka ah, gaar ahaan ardayda kartida leh ee wajahaya caqabado dhaqaale.",

    register: "📝 Isdiiwaangeli",
    learnerPortal: "🎓 Bogga Ardayga",
    payments: "💳 Lacag-bixinta",
    supportEga: "❤️ Taageer EGA",

    ourPurpose: "UJEEDDA AAN LEENAHAY",
    purposeTitle:
      "Karti meel walba way ka jirtaa. Fursaddu se meel walba kama jirto.",
    purposeText1:
      "Akadeemiyada Elmi Guray waxay ardayda ka caawisaa inay bartaan xirfado wax-ku-ool ah oo ay ka mid yihiin horumarinta webka, sirdoonka macmalka ah, barnaamij-samaynta, iyo teknoolojiyadda dijitaalka ah.",
    purposeText2:
      "Ujeeddadeennu ma aha oo keliya inaan ardayda wax barno, balse sidoo kale inaan ka caawinno inay dhistaan kalsooni, dhammeystiraan mashruucyo dhab ah, helaan shahaadooyin, una diyaar garoobaan shaqo, freelancing, iyo ganacsi-abuur.",

    ourImpact: "SAAMAYNTEENNA",
    impactTitle: "Waxbarashadu waxay abuurtaa fursad",

    students: "Ardayda",
    studentsText:
      "Baranaya xirfado teknoolojiyadeed oo wax-ku-ool ah",

    scholarships: "Deeqaha Waxbarasho",
    scholarshipsText:
      "Taageeridda ardayda wajahaysa caqabado dhaqaale",

    projects: "Mashruucyada",
    projectsText:
      "Dhisidda xirfado dhab ah iyadoo la adeegsanayo shaqo wax-ku-ool ah",

    certificates: "Shahaadooyinka",
    certificatesText:
      "Aqoonsiga ardayda si guul leh u dhammeystirta koorsooyinka",

    participateLabel: "SADDEX HAB OO LOOGA QAYBQAATO",
    participateTitle:
      "Baro, taageer, noloshana wax ka beddel",

    becomeStudent: "Noqo Arday",
    becomeStudentText:
      "Isdiiwaangeli tababar wax-ku-ool ah oo bilow inaad dhisto mustaqbalkaaga teknoolojiyadda.",
    registerNow: "Hadda isdiiwaangeli →",

    sponsorStudent: "Kafaalo Qaad Arday",
    sponsorStudentText:
      "Ka caawi arday inuu ka gudbo caqabadaha dhaqaale oo uu helo waxbarasho teknoolojiyadeed.",
    supportLearner: "Taageer arday →",

    supportTitle: "Taageer EGA",
    supportText:
      "Ka qaybqaado bixinta deeqaha waxbarasho, internetka, agabka waxbarashada, software-ka, iyo qalabka waxbarashada.",
    makeImpact: "Saamayn samee →",

    learnLabel: "WAXA ARDAYDU BARTAAN",
    learnTitle:
      "Xirfado wax-ku-ool ah oo loogu talagalay dhaqaalaha dijitaalka ah",

    webDevelopment: "Horumarinta Webka",
    webDevelopmentText:
      "HTML, CSS, JavaScript, React, mashruucyo, iyo samaynta website-yo casri ah.",

    artificialIntelligence: "Sirdoonka Macmalka ah",
    artificialIntelligenceText:
      "Baro sida qalabka AI u shaqeeyo iyo sida masuuliyad leh loogu isticmaalo waxbarashada iyo horumarinta.",

    careerSkills: "Xirfadaha Shaqada",
    careerSkillsText:
      "Dhis mashruucyo, portfolio, kalsooni, iyo diyaar-garow shaqooyin fog iyo fursado caalami ah.",

    exploreCourses: "Fiiri Koorsooyinka",

    scholarshipTitle:
      "Waxbarashadu waa inaysan ku xirnaan hantida qofka",
    scholarshipText1:
      "EGA waxay horumarinaysaa barnaamij deeq waxbarasho iyo kafaalo-qaad ah oo loogu talagalay ardayda dadaalka leh ee aan awoodin kharashka buuxa ee waxbarashada teknoolojiyadda.",
    scholarshipText2:
      "Taageero kasta waxay ka caawin kartaa arday inuu wax barto, wax abuuro, oo uu dhisto mustaqbal madax-bannaan.",
    registerInterest: "Diiwaangeli Xiisahaaga",

    founderLabel: "FARIINTA AASAASAHA",
    founderQuote:
      "Waxaan aasaasay Akadeemiyada Elmi Guray anigoo aaminsan in kartidu meel walba ka jirto, balse fursaddu aysan meel walba ka jirin. Riyadaydu waa in duruufaha dhaqaale aysan waligood ka hor istaagin arday dadaal badan inuu barto xirfadaha beddeli kara noloshiisa.",
    founderName: "Mohammed Elmi Issak",
    founderRole1: "Aasaasaha, Mu’asasada Elmi Guray",
    founderRole2:
      "Aasaasaha & Madaxweynaha, Akadeemiyada Elmi Guray",

    platformLabel: "BARNAAMIJKA EGA",
    journeyTitle: "Sii wad safarkaaga",

    exploreNavigation: "📚 Fiiri Koorsooyinka",
    exploreNavigationText:
      "Fiiri casharrada, mashruucyada, imtixaannada, iyo agabka waxbarashada.",

    learnerNavigation: "🎓 Bogga Ardayga",
    learnerNavigationText:
      "Fiiri horumarkaaga waxbarasho, imtixaannada, waajibaadka, iyo shahaadooyinka.",

    leaderboard: "🏆 Kala Sarreynta Ardayda",
    leaderboardText:
      "U dabaaldeg guulaha ardayda oo fiiri natiijooyinka imtixaannada ugu sarreeya.",

    paymentsSupport: "💳 Lacag-bixin & Taageero",
    paymentsSupportText:
      "Fiiri macluumaadka lacag-bixinta iyo fursadaha taageero ee la heli karo.",

    adminDashboard: "🔐 Maamulka Ammaan Ah",
    adminOnly:
      "Waxaa geli kara oo keliya maamulayaasha la oggolaaday",

    finalTitle:
      "Hal Arday. Hal Mustaqbal. Hal Fursad.",
    finalText:
      "Ku biir Akadeemiyada Elmi Guray adigoo ah arday, taageere, lataliye, mutadawac, ama lammaane mustaqbal.",
    beginJourney: "Bilow Safarkaaga",

    footerText:
      "Hindise waxbarasho oo ay leedahay Mu’asasada Elmi Guray",
    footerMotto:
      "U Baro Ujeeddo. Ku Dhis Daacadnimo. Ku Hoggaami Adeeg.",
    footerFounder:
      "Waxaa aasaasay Mohammed Elmi Issak",
    copyright:
      "© 2026 Mu’asasada Elmi Guray. Dhammaan xuquuqdu way dhowran tahay.",
  },
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const [language, setLanguage] =
    useState<Language>("en");

  const t = translations[language];

  const isTablet = width >= 700;
  const isDesktop = width >= 1050;

  const twoColumnCardWidth = isTablet ? "48.8%" : "100%";

  const threeColumnCardWidth = isDesktop
    ? "31.8%"
    : isTablet
      ? "48.8%"
      : "100%";

  const topActionButtonWidth = isDesktop
    ? "23.5%"
    : isTablet
      ? "48.5%"
      : "100%";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedLanguage =
      window.localStorage.getItem("ega_language");

    if (
      savedLanguage === "en" ||
      savedLanguage === "so"
    ) {
      setLanguage(savedLanguage);
    }

    const recoveryData =
      `${window.location.search}${window.location.hash}`;

    if (
      recoveryData.includes("error_code=otp_expired") ||
      recoveryData.includes("error=access_denied")
    ) {
      router.replace(
        "/admin-dashboard?adminError=expired_link",
      );

      return;
    }

    if (recoveryData.includes("type=recovery")) {
      router.replace(
        `/reset-password${window.location.search}${window.location.hash}`,
      );
    }
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "ega_language",
        nextLanguage,
      );
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.languageSwitcher}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use English"
              onPress={() => changeLanguage("en")}
              style={({ pressed }) => [
                styles.languageButton,
                language === "en" &&
                  styles.languageButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === "en" &&
                    styles.languageButtonTextActive,
                ]}
              >
                English
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Isticmaal Af Soomaali"
              onPress={() => changeLanguage("so")}
              style={({ pressed }) => [
                styles.languageButton,
                language === "so" &&
                  styles.languageButtonActive,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === "so" &&
                    styles.languageButtonTextActive,
                ]}
              >
                Soomaali
              </Text>
            </Pressable>
          </View>

          <Image
            source={require("../../assets/images/ega-logo.png")}
            style={[
              styles.logoImage,
              isTablet && styles.logoImageLarge,
            ]}
            resizeMode="contain"
            accessibilityLabel="Elmi Guray Academy logo"
          />

          <Text style={styles.foundationName}>
            {t.foundation}
          </Text>

          <Text
            style={[
              styles.title,
              isTablet && styles.titleLarge,
            ]}
          >
            {t.academy}
          </Text>

          <Text
            style={[
              styles.heroHeading,
              isTablet && styles.heroHeadingLarge,
            ]}
          >
            {t.heroHeading}
          </Text>

          <Text style={styles.subtitle}>
            {t.subtitle}
          </Text>

          <View
            style={[
              styles.heroButtons,
              isTablet && styles.heroButtonsWide,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                { width: topActionButtonWidth },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.primaryButtonText}>
                {t.register}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.learnerPortalButton,
                { width: topActionButtonWidth },
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push("/learner-portal")
              }
            >
              <Text style={styles.learnerPortalButtonText}>
                {t.learnerPortal}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.paymentButton,
                { width: topActionButtonWidth },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/payments")}
            >
              <Text style={styles.paymentButtonText}>
                {t.payments}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                { width: topActionButtonWidth },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/payments")}
            >
              <Text style={styles.secondaryButtonText}>
                {t.supportEga}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.coursePreviewSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.coursePreviewLabel}>📚 EGA Courses</Text>

          <Text style={styles.coursePreviewTitle}>
            🤖 AI Developer Course + 🌐 Web Development Courses
          </Text>

          <Text style={styles.coursePreviewText}>
            Learn practical AI tools, programming, HTML, CSS, JavaScript, projects, and modern digital skills.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.coursePreviewButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/explore")}
          >
            <Text style={styles.coursePreviewButtonText}>
              ▶ Watch EGA Course Preview
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabel}>
            {t.ourPurpose}
          </Text>

          <Text style={styles.sectionTitle}>
            {t.purposeTitle}
          </Text>

          <Text style={styles.sectionText}>
            {t.purposeText1}
          </Text>

          <Text style={styles.sectionText}>
            {t.purposeText2}
          </Text>
        </View>
      </View>

      <View style={styles.impactSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabelLight}>
            {t.ourImpact}
          </Text>

          <Text style={styles.impactTitle}>
            {t.impactTitle}
          </Text>

          <View style={styles.cardGrid}>
            <View
              style={[
                styles.impactCard,
                { width: twoColumnCardWidth },
              ]}
            >
              <Text style={styles.impactIcon}>🎓</Text>
              <Text style={styles.impactNumber}>
                {t.students}
              </Text>
              <Text style={styles.impactText}>
                {t.studentsText}
              </Text>
            </View>

            <View
              style={[
                styles.impactCard,
                { width: twoColumnCardWidth },
              ]}
            >
              <Text style={styles.impactIcon}>❤️</Text>
              <Text style={styles.impactNumber}>
                {t.scholarships}
              </Text>
              <Text style={styles.impactText}>
                {t.scholarshipsText}
              </Text>
            </View>

            <View
              style={[
                styles.impactCard,
                { width: twoColumnCardWidth },
              ]}
            >
              <Text style={styles.impactIcon}>💻</Text>
              <Text style={styles.impactNumber}>
                {t.projects}
              </Text>
              <Text style={styles.impactText}>
                {t.projectsText}
              </Text>
            </View>

            <View
              style={[
                styles.impactCard,
                { width: twoColumnCardWidth },
              ]}
            >
              <Text style={styles.impactIcon}>📜</Text>
              <Text style={styles.impactNumber}>
                {t.certificates}
              </Text>
              <Text style={styles.impactText}>
                {t.certificatesText}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabel}>
            {t.participateLabel}
          </Text>

          <Text style={styles.sectionTitle}>
            {t.participateTitle}
          </Text>

          <View style={styles.cardGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                { width: threeColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/register")}
            >
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIcon}>🎓</Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {t.becomeStudent}
                </Text>

                <Text style={styles.actionText}>
                  {t.becomeStudentText}
                </Text>

                <Text style={styles.actionLink}>
                  {t.registerNow}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                { width: threeColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/payments")}
            >
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIcon}>🤝</Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {t.sponsorStudent}
                </Text>

                <Text style={styles.actionText}>
                  {t.sponsorStudentText}
                </Text>

                <Text style={styles.actionLink}>
                  {t.supportLearner}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                { width: threeColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/payments")}
            >
              <View style={styles.actionIconBox}>
                <Text style={styles.actionIcon}>❤️</Text>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {t.supportTitle}
                </Text>

                <Text style={styles.actionText}>
                  {t.supportText}
                </Text>

                <Text style={styles.actionLink}>
                  {t.makeImpact}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.learningSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabel}>
            {t.learnLabel}
          </Text>

          <Text style={styles.sectionTitle}>
            {t.learnTitle}
          </Text>

          <View style={styles.cardGrid}>
            <View
              style={[
                styles.courseCard,
                { width: threeColumnCardWidth },
              ]}
            >
              <Text style={styles.courseIcon}>🌐</Text>
              <Text style={styles.courseTitle}>
                {t.webDevelopment}
              </Text>
              <Text style={styles.courseText}>
                {t.webDevelopmentText}
              </Text>
            </View>

            <View
              style={[
                styles.courseCard,
                { width: threeColumnCardWidth },
              ]}
            >
              <Text style={styles.courseIcon}>🤖</Text>
              <Text style={styles.courseTitle}>
                {t.artificialIntelligence}
              </Text>
              <Text style={styles.courseText}>
                {t.artificialIntelligenceText}
              </Text>
            </View>

            <View
              style={[
                styles.courseCard,
                { width: threeColumnCardWidth },
              ]}
            >
              <Text style={styles.courseIcon}>💡</Text>
              <Text style={styles.courseTitle}>
                {t.careerSkills}
              </Text>
              <Text style={styles.courseText}>
                {t.careerSkillsText}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.exploreButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/explore")}
          >
            <Text style={styles.exploreButtonText}>
              {t.exploreCourses}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.scholarshipWrapper}>
        <View style={styles.scholarshipSection}>
          <Text style={styles.scholarshipIcon}>🌱</Text>

          <Text style={styles.scholarshipTitle}>
            {t.scholarshipTitle}
          </Text>

          <Text style={styles.scholarshipText}>
            {t.scholarshipText1}
          </Text>

          <Text style={styles.scholarshipText}>
            {t.scholarshipText2}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.scholarshipButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.scholarshipButtonText}>
              {t.registerInterest}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.founderSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabelLight}>
            {t.founderLabel}
          </Text>

          <Text style={styles.quoteMark}>“</Text>

          <Text style={styles.founderQuote}>
            {t.founderQuote}
          </Text>

          <Text style={styles.founderName}>
            {t.founderName}
          </Text>

          <Text style={styles.founderRole}>
            {t.founderRole1}
          </Text>

          <Text style={styles.founderRole}>
            {t.founderRole2}
          </Text>
        </View>
      </View>

      <View style={styles.navigationSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionLabel}>
            {t.platformLabel}
          </Text>

          <Text style={styles.sectionTitle}>
            {t.journeyTitle}
          </Text>

          <View style={styles.cardGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.navigationCard,
                { width: twoColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/explore")}
            >
              <Text style={styles.navigationTitle}>
                {t.exploreNavigation}
              </Text>
              <Text style={styles.navigationText}>
                {t.exploreNavigationText}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.navigationCard,
                { width: twoColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push("/learner-portal")
              }
            >
              <Text style={styles.navigationTitle}>
                {t.learnerNavigation}
              </Text>
              <Text style={styles.navigationText}>
                {t.learnerNavigationText}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.navigationCard,
                { width: twoColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/leaderboard")}
            >
              <Text style={styles.navigationTitle}>
                {t.leaderboard}
              </Text>
              <Text style={styles.navigationText}>
                {t.leaderboardText}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.navigationCard,
                { width: twoColumnCardWidth },
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push("/payments")}
            >
              <Text style={styles.navigationTitle}>
                {t.paymentsSupport}
              </Text>
              <Text style={styles.navigationText}>
                {t.paymentsSupportText}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.adminCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push("/admin-dashboard")
            }
          >
            <Text style={styles.adminTitle}>
              {t.adminDashboard}
            </Text>

            <Text style={styles.adminText}>
              {t.adminOnly}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.finalCallSection}>
        <View style={styles.contentContainer}>
          <Text style={styles.finalCallTitle}>
            {t.finalTitle}
          </Text>

          <Text style={styles.finalCallText}>
            {t.finalText}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.finalCallButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.finalCallButtonText}>
              {t.beginJourney}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.contentContainer}>
          <Text style={styles.footerTitle}>
            {t.academy}
          </Text>

          <Text style={styles.footerText}>
            {t.footerText}
          </Text>

          <Text style={styles.footerMotto}>
            {t.footerMotto}
          </Text>

          <Text style={styles.footerFounder}>
            {t.footerFounder}
          </Text>

          <Text style={styles.footerCopyright}>
            {t.copyright}
          </Text>
        </View>
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
    flexGrow: 1,
  },

  contentContainer: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },

  hero: {
    backgroundColor: "#12326b",
    paddingTop: 28,
    paddingBottom: 58,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
  },

  heroInner: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    alignItems: "center",
  },

  languageSwitcher: {
    flexDirection: "row",
    backgroundColor: "#0b2556",
    borderRadius: 28,
    padding: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#5373a8",
  },

  languageButton: {
    minWidth: 100,
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  languageButtonActive: {
    backgroundColor: "#facc15",
  },

  languageButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  languageButtonTextActive: {
    color: "#12326b",
  },

  logoImage: {
    width: 190,
    height: 190,
    marginBottom: 18,
    borderRadius: 22,
  },

  logoImageLarge: {
    width: 235,
    height: 235,
  },

  foundationName: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },

  title: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
  },

  titleLarge: {
    fontSize: 52,
  },

  heroHeading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 33,
    marginTop: 16,
  },

  heroHeadingLarge: {
    fontSize: 31,
    lineHeight: 41,
  },

  subtitle: {
    color: "#dbeafe",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 27,
    marginTop: 17,
    maxWidth: 750,
  },

  heroButtons: {
    width: "100%",
    maxWidth: 480,
    marginTop: 31,
    gap: 13,
    alignItems: "center",
  },

  heroButtonsWide: {
    maxWidth: 1100,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
  },

  primaryButton: {
    backgroundColor: "#facc15",
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#12326b",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  learnerPortalButton: {
    backgroundColor: "#ffffff",
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  learnerPortalButtonText: {
    color: "#12326b",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  paymentButton: {
    backgroundColor: "#22c55e",
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentButtonText: {
    color: "#052e16",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  secondaryButton: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },

  coursePreviewSection: {
    paddingVertical: 28,
    backgroundColor: "#f8fafc",
  },

  coursePreviewLabel: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#0f172a",
  },

  coursePreviewTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 32,
    color: "#0f172a",
    marginBottom: 12,
  },

  coursePreviewText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#475569",
    maxWidth: 720,
    alignSelf: "center",
    marginBottom: 18,
  },

  coursePreviewButton: {
    alignSelf: "center",
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
  },

  coursePreviewButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  section: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 40,
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
    lineHeight: 38,
    marginTop: 10,
    marginBottom: 20,
  },

  sectionText: {
    color: "#475569",
    fontSize: 17,
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 14,
    maxWidth: 820,
    alignSelf: "center",
  },

  cardGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 14,
  },

  impactSection: {
    backgroundColor: "#12326b",
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 52,
  },

  impactTitle: {
    color: "#ffffff",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 28,
  },

  impactCard: {
    backgroundColor: "#ffffff",
    minHeight: 190,
    padding: 23,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  impactIcon: {
    fontSize: 36,
    marginBottom: 9,
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
    marginTop: 8,
  },

  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#dbe5f2",
    minHeight: 285,
  },

  actionIconBox: {
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: "#e7efff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  actionIcon: {
    fontSize: 28,
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
    lineHeight: 25,
    marginTop: 8,
  },

  actionLink: {
    color: "#1d4ed8",
    fontSize: 16,
    fontWeight: "800",
    marginTop: "auto",
    paddingTop: 15,
  },

  learningSection: {
    backgroundColor: "#edf3ff",
    paddingHorizontal: 18,
    paddingVertical: 52,
    marginTop: 18,
  },

  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 19,
    padding: 23,
    minHeight: 245,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  courseIcon: {
    fontSize: 36,
    marginBottom: 12,
  },

  courseTitle: {
    color: "#12326b",
    fontSize: 21,
    fontWeight: "900",
  },

  courseText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginTop: 9,
  },

  exploreButton: {
    backgroundColor: "#12326b",
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 31,
    borderRadius: 29,
    alignSelf: "center",
    marginTop: 28,
    minWidth: 225,
    alignItems: "center",
    justifyContent: "center",
  },

  exploreButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  scholarshipWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  scholarshipSection: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    backgroundColor: "#fff7d6",
    paddingHorizontal: 23,
    paddingVertical: 38,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f4d96d",
  },

  scholarshipIcon: {
    fontSize: 46,
    marginBottom: 11,
  },

  scholarshipTitle: {
    color: "#12326b",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 37,
    textAlign: "center",
  },

  scholarshipText: {
    color: "#475569",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 720,
  },

  scholarshipButton: {
    backgroundColor: "#12326b",
    minHeight: 55,
    paddingVertical: 15,
    paddingHorizontal: 29,
    borderRadius: 29,
    marginTop: 24,
    justifyContent: "center",
  },

  scholarshipButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  founderSection: {
    backgroundColor: "#12326b",
    paddingHorizontal: 22,
    paddingVertical: 54,
    alignItems: "center",
  },

  quoteMark: {
    color: "#facc15",
    fontSize: 72,
    fontWeight: "900",
    height: 67,
    marginTop: 12,
    textAlign: "center",
  },

  founderQuote: {
    color: "#ffffff",
    fontSize: 19,
    lineHeight: 31,
    textAlign: "center",
    fontStyle: "italic",
    maxWidth: 800,
    alignSelf: "center",
  },

  founderName: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 26,
    textAlign: "center",
  },

  founderRole: {
    color: "#dbeafe",
    fontSize: 15,
    textAlign: "center",
    marginTop: 5,
  },

  navigationSection: {
    paddingHorizontal: 16,
    paddingVertical: 52,
  },

  navigationCard: {
    backgroundColor: "#ffffff",
    padding: 22,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#dbe5f2",
    minHeight: 150,
  },

  navigationTitle: {
    color: "#12326b",
    fontSize: 21,
    fontWeight: "900",
  },

  navigationText: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 9,
  },

  adminCard: {
    backgroundColor: "#e2e8f0",
    padding: 21,
    borderRadius: 19,
    marginTop: 17,
    borderWidth: 1,
    borderColor: "#cbd5e1",
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
    paddingVertical: 52,
    alignItems: "center",
  },

  finalCallTitle: {
    color: "#12326b",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 40,
  },

  finalCallText: {
    color: "#334155",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 700,
    alignSelf: "center",
  },

  finalCallButton: {
    backgroundColor: "#12326b",
    minHeight: 56,
    paddingVertical: 16,
    paddingHorizontal: 33,
    borderRadius: 29,
    marginTop: 25,
    alignSelf: "center",
    justifyContent: "center",
  },

  finalCallButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  footer: {
    backgroundColor: "#081a38",
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 48,
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
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 21,
    maxWidth: 620,
    alignSelf: "center",
  },

  footerFounder: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 21,
  },

  footerCopyright: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 19,
  },
});