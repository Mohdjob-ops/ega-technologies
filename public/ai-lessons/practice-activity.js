(() => {
    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

    const findSection = (headingText) =>
        Array.from(document.querySelectorAll("section")).find((section) => {
            const heading = section.querySelector("h2");
            return heading && normalizeText(heading.textContent || "") === headingText;
        });

    const activitySection = findSection("Multiple-Choice Practice Activity");
    const answerKeySection = findSection("Answer Key");
    const form = activitySection?.querySelector("form");

    if (!activitySection || !answerKeySection || !form) {
        return;
    }

    const fieldsets = Array.from(form.querySelectorAll("fieldset"));
    const answerItems = Array.from(answerKeySection.querySelectorAll("ol > li"));

    if (fieldsets.length === 0 || fieldsets.length !== answerItems.length) {
        return;
    }

    const answers = answerItems.map((item) => {
        const explanation = normalizeText(item.textContent || "");
        const match = explanation.match(/^([A-Z])\s*[—–-]/i);
        return {
            value: match ? match[1].toLowerCase() : "",
            explanation,
        };
    });

    if (answers.some((answer) => !answer.value)) {
        return;
    }

    answerKeySection.hidden = true;
    answerKeySection.setAttribute("aria-hidden", "true");

    const attempts = fieldsets.map(() => 0);
    const completed = fieldsets.map(() => false);

    const feedbackRows = fieldsets.map((fieldset, index) => {
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        feedback.style.fontWeight = "700";
        feedback.style.marginBottom = "0";
        feedback.dataset.practiceFeedback = String(index + 1);
        fieldset.appendChild(feedback);
        return feedback;
    });

    const overallFeedback = document.createElement("p");
    overallFeedback.setAttribute("role", "status");
    overallFeedback.setAttribute("aria-live", "polite");
    overallFeedback.style.fontWeight = "700";
    form.appendChild(overallFeedback);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        fieldsets.forEach((fieldset, index) => {
            if (completed[index]) {
                return;
            }

            const selected = fieldset.querySelector("input[type='radio']:checked");
            const feedback = feedbackRows[index];

            if (!selected) {
                feedback.textContent = "Choose an answer, then try again.";
                return;
            }

            attempts[index] += 1;

            if (selected.value.toLowerCase() === answers[index].value) {
                completed[index] = true;
                feedback.textContent = "✅ Correct! Great — now you understand why.";
                fieldset.querySelectorAll("input[type='radio']").forEach((input) => {
                    input.disabled = true;
                });
                return;
            }

            const nextAttempt = attempts[index] + 1;

            if (attempts[index] === 1) {
                feedback.textContent = `❌ Not quite — try again. Attempt ${nextAttempt} — Think carefully and try again.`;
            } else if (attempts[index] === 2) {
                feedback.textContent = `Hint: Review the related lesson section above and eliminate choices that do not match it. Attempt ${nextAttempt} — Think carefully and try again.`;
            } else {
                feedback.textContent = `Correct answer and explanation: ${answers[index].explanation} You can keep trying until you select it. Attempt ${nextAttempt} — Think carefully and try again.`;
            }
        });

        overallFeedback.textContent = completed.every(Boolean)
            ? "✅ Practice complete! Every answer is correct. These practice attempts are not recorded as an official quiz score."
            : "Practice mode: keep trying until every answer is correct. Attempts are not recorded as official quiz scores.";
    });
})();
