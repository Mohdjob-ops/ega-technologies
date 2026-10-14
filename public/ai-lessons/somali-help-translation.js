(function () {
  const targets = document.querySelectorAll(".sht[data-so]");
  if (!targets.length) return;

  const popup = document.createElement("div");
  popup.className = "somali-translation-popup";
  popup.id = "somali-translation-popup";
  popup.setAttribute("role", "tooltip");
  popup.hidden = true;
  document.body.appendChild(popup);

  let activeTarget = null;
  let lastPointerType = "";

  function closePopup() {
    if (activeTarget) activeTarget.removeAttribute("aria-describedby");
    activeTarget = null;
    popup.hidden = true;
  }

  function showPopup(target) {
    if (activeTarget && activeTarget !== target) closePopup();
    activeTarget = target;
    popup.textContent = target.dataset.so;
    popup.hidden = false;
    target.setAttribute("aria-describedby", popup.id);

    const targetRect = target.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const maxLeft = window.innerWidth - popupRect.width - 12;
    const left = Math.max(12, Math.min(targetRect.left + (targetRect.width - popupRect.width) / 2, maxLeft));
    let top = targetRect.bottom + 8;
    if (top + popupRect.height > window.innerHeight - 12) {
      top = targetRect.top - popupRect.height - 8;
    }
    popup.style.left = left + "px";
    popup.style.top = Math.max(12, top) + "px";
  }

  targets.forEach(function (target) {
    target.addEventListener("pointerdown", function (event) {
      lastPointerType = event.pointerType;
    });
    target.addEventListener("mouseenter", function () {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) showPopup(target);
    });
    target.addEventListener("mouseleave", function () {
      if (activeTarget === target && window.matchMedia("(hover: hover) and (pointer: fine)").matches) closePopup();
    });
    target.addEventListener("focus", function () {
      if (lastPointerType !== "touch") showPopup(target);
    });
    target.addEventListener("blur", function () {
      if (activeTarget === target) closePopup();
    });
    target.addEventListener("click", function () {
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        if (activeTarget === target) closePopup();
        else showPopup(target);
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closePopup();
    else lastPointerType = "keyboard";
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".sht")) closePopup();
  });
  window.addEventListener("resize", function () {
    if (activeTarget) showPopup(activeTarget);
  });
})();