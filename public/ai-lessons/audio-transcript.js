(function () {
  "use strict";

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/ai-lessons/audio-transcript.css";
  document.head.appendChild(stylesheet);

  function parseTime(value) {
    const parts = value.trim().replace(",", ".").split(":");
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }

  function parseCues(vtt) {
    return vtt
      .replace(/^\uFEFF/, "")
      .split(/\r?\n\r?\n/)
      .map((block) => block.trim().split(/\r?\n/))
      .map((lines) => {
        const timingIndex = lines.findIndex((line) => line.includes(" --> "));
        if (timingIndex < 0) return null;
        const [start, endWithSettings] = lines[timingIndex].split(" --> ");
        const end = endWithSettings.trim().split(/\s+/)[0];
        const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
        return text ? { start: parseTime(start), end: parseTime(end), text } : null;
      })
      .filter(Boolean);
  }

  async function initializeReader(reader) {
    const audio = reader.querySelector("audio[data-transcript]");
    const transcript = reader.querySelector(".ega-transcript");
    if (!audio || !transcript) return;

    try {
      const response = await fetch(audio.dataset.transcript);
      if (!response.ok) throw new Error("Transcript could not be loaded.");
      const cues = parseCues(await response.text());
      if (!cues.length) throw new Error("Transcript has no timed lines.");

      transcript.textContent = "";
      const buttons = cues.map((cue, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ega-transcript-line";
        button.textContent = cue.text;
        button.dataset.cueIndex = String(index);
        button.addEventListener("click", () => {
          audio.currentTime = cue.start + 0.01;
          audio.play().catch(() => {});
        });
        transcript.appendChild(button);
        return button;
      });

      let activeIndex = -1;
      function updateActiveLine() {
        const time = audio.currentTime;
        let nextIndex = cues.findIndex((cue) => time >= cue.start && time < cue.end);
        if (nextIndex < 0) {
          for (let index = cues.length - 1; index >= 0; index -= 1) {
            if (time >= cues[index].start) {
              nextIndex = index;
              break;
            }
          }
        }
        if (nextIndex === activeIndex) return;
        if (activeIndex >= 0) buttons[activeIndex].classList.remove("is-active");
        activeIndex = nextIndex;
        if (activeIndex >= 0) {
          const activeButton = buttons[activeIndex];
          activeButton.classList.add("is-active");
          activeButton.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      audio.addEventListener("timeupdate", updateActiveLine);
      audio.addEventListener("seeked", updateActiveLine);
      updateActiveLine();
    } catch (error) {
      transcript.innerHTML = '<p class="ega-transcript-status">The synchronized transcript is unavailable.</p>';
    }
  }

  function initializeAllReaders() {
    document.querySelectorAll(".ega-audio-reader").forEach(initializeReader);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAllReaders);
  } else {
    initializeAllReaders();
  }
})();
