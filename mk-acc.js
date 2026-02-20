(function () {
  "use strict";

  function init(root) {
    const items = Array.from(root.querySelectorAll(".mk-acc-item"));
    const media = Array.from(root.querySelectorAll(".mk-acc-media"));

    // Заголовки слева можно брать глобально (как у тебя раньше)
    const chipEl =
      document.querySelector(".mk-acc-chip, [data-mk-chip]") ||
      root.querySelector(".mk-acc-chip, [data-mk-chip]");
    const headingEl =
      document.querySelector(".mk-acc-heading, [data-mk-heading]") ||
      root.querySelector(".mk-acc-heading, [data-mk-heading]");

    if (!items.length) return;

    const keyOf = (el) => el.getAttribute("data-acc");

    const defaultItem = items[0];
    const defaultKey = keyOf(defaultItem) || "1";
    const defaultTitle = defaultItem.getAttribute("data-title") || "";

    function setLeftHeader(title, key) {
      const k = String(key || "").padStart(2, "0");
      if (headingEl) (headingEl.querySelector(".tn-atom") || headingEl).textContent = title || "";
      if (chipEl) (chipEl.querySelector(".tn-atom") || chipEl).textContent = `(${k})`;
    }

    function setActive(key) {
      const activeItem = items.find((i) => keyOf(i) === key);
      if (!activeItem) return;

      items.forEach((i) => i.classList.toggle("is-active", keyOf(i) === key));
      media.forEach((m) => m.classList.toggle("is-active", keyOf(m) === key));

      setLeftHeader(activeItem.getAttribute("data-title") || "", key);
    }

    function closeAll() {
      items.forEach((i) => i.classList.remove("is-active"));
      media.forEach((m) => m.classList.remove("is-active"));

      setLeftHeader(defaultTitle, defaultKey);

      const defaultMedia = media.find((m) => keyOf(m) === defaultKey) || media[0];
      if (defaultMedia) defaultMedia.classList.add("is-active");
    }

    // старт
    setActive(defaultKey);

    items.forEach((i) => {
      i.addEventListener("click", () => {
        const key = keyOf(i);
        if (!key) return;

        if (i.classList.contains("is-active")) {
          closeAll(); // toggle close
          return;
        }
        setActive(key);
      });
    });
  }

  function boot() {
    document.querySelectorAll(".mk-acc").forEach(init);
  }

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
