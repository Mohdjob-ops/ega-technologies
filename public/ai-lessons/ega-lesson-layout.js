(() => {
  const body = document.body;
  if (!body || body.dataset.egaLayoutApplied === "true") return;

  body.dataset.egaLayoutApplied = "true";
  body.classList.add("ega-layout-page");

  const lessonNumber = Number((location.pathname.match(/lesson[-_\s]*(\d+)/i) || [])[1]) || 1;
  const existingHeading = document.querySelector("header h1, h1");
  const pageTitle = (document.title || "").replace(/\s*\|\s*EGA\s*$/i, "").trim();
  const headingText = (existingHeading?.textContent || "").replace(/\s+/g, " ").trim();
  const titleSource = /^EGA\s+AI\s+Developer\s+Course$/i.test(headingText) ? pageTitle : headingText || pageTitle;
  const lessonTitle = titleSource
    .replace(new RegExp(`^.*?Lesson\\s*${lessonNumber}\\s*[:\\-–—]?\\s*`, "i"), "")
    .replace(/^Lesson\s*\d+\s*[:\-–—]?\s*/i, "")
    .trim() || `Lesson ${lessonNumber}`;

  const oldTopNav = document.querySelector("nav.ega-lesson-nav") ||
    [...document.querySelectorAll("nav")].find((nav) =>
      nav.querySelector('a[href*="learner-portal"]') && nav.querySelector('a[href*="lesson-"]')
    );
  const oldNavLinks = oldTopNav ? [...oldTopNav.querySelectorAll("a")] : [];
  const previousLink = oldNavLinks.find((link) => /previous/i.test(link.textContent || ""));
  const nextLink = oldNavLinks.find((link) => /next/i.test(link.textContent || ""));

  if (oldTopNav) oldTopNav.classList.add("ega-layout-legacy-top-nav");
  if (existingHeading?.closest("header")) existingHeading.closest("header").classList.add("ega-layout-legacy-header");
  document.querySelectorAll(".ega-restored-lesson-back, .ega-back-to-portal, .ega-lesson-back")
    .forEach((element) => element.classList.add("ega-layout-legacy-back"));

  const englishTarget = document.getElementById("english") || document.querySelector("main section, main article");
  if (englishTarget && !englishTarget.id) englishTarget.id = "english";

  const guidedHeading = [...document.querySelectorAll("h2, h3, h4")].find((heading) => /guided learning/i.test(heading.textContent || ""));
  const guidedTarget = document.getElementById("guided-learning") || guidedHeading?.closest("section, article") || guidedHeading?.parentElement;
  if (guidedTarget && !guidedTarget.id) guidedTarget.id = "guided-learning";

  const activityHeading = [...document.querySelectorAll("h2, h3, h4")].find((heading) => /activity|quiz/i.test(heading.textContent || ""));
  const activityTarget = document.getElementById("activity") || activityHeading?.closest("section, article") || activityHeading?.parentElement;
  if (activityTarget && !activityTarget.id) activityTarget.id = "activity";

  const sectionTargets = [
    ["English", englishTarget],
    ["Guided Learning", guidedTarget],
    ["Activity", activityTarget],
  ];
  const sectionNav = document.createElement("nav");
  sectionNav.className = "ega-layout-section-nav";
  sectionNav.setAttribute("aria-label", "Lesson sections");
  sectionTargets.forEach(([label, target]) => {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = `#${target?.id || "top"}`;
    sectionNav.append(link);
  });

  const header = document.createElement("header");
  header.className = "ega-course-header";
  header.innerHTML = '<img class="ega-layout-logo" src="/ega-logo.png" alt="Elmi Guray Academy logo"><h1>EGA AI Developer Course</h1>';
  const lessonHeading = document.createElement("p");
  lessonHeading.className = "ega-layout-lesson-title";
  lessonHeading.textContent = `Lesson ${lessonNumber}: ${lessonTitle}`;
  const author = document.createElement("p");
  author.className = "ega-layout-author";
  author.innerHTML = 'Created by <strong>Mohammed Elmi Issak</strong><br>Founder &amp; President, Elmi Guray Academy';
  header.append(lessonHeading, author, sectionNav);

  const topNav = document.createElement("nav");
  topNav.className = "ega-layout-nav";
  topNav.setAttribute("aria-label", "Lesson navigation");
  const previous = document.createElement(previousLink ? "a" : "span");
  previous.textContent = "Previous";
  if (previousLink) previous.href = previousLink.href;
  else previous.className = "ega-layout-disabled";
  const portal = document.createElement("a");
  portal.className = "ega-layout-portal";
  portal.href = "/learner-portal";
  portal.textContent = "Learner Portal";
  const next = document.createElement(nextLink ? "a" : "span");
  next.textContent = "Next";
  if (nextLink) next.href = nextLink.href;
  else next.className = "ega-layout-disabled";
  topNav.append(previous, portal, next);

  const note = document.querySelector(".ega-layout-note, .ega-important-note") || document.createElement("aside");
  note.classList.add("ega-layout-note");
  note.setAttribute("aria-label", "Important note");
  if (!note.querySelector("strong")) {
    note.innerHTML = '<strong>Important Note:</strong>Study this lesson carefully. Take notes, practice the examples, and complete the quiz/activity before moving to the next lesson.';
  }

  const main = document.querySelector("main");
  if (!note.isConnected) {
    if (main) main.prepend(note);
    else body.prepend(note);
  }
  body.prepend(header);
  body.prepend(topNav);

  const oldSectionNav = [...document.querySelectorAll("nav")].find((nav) =>
    nav !== topNav && nav !== sectionNav && nav.querySelector('a[href^="#"]') && nav.closest("header")
  );
  if (oldSectionNav) oldSectionNav.classList.add("ega-layout-legacy-section-nav");
})();