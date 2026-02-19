(function () {
  function toArr(list) { return Array.prototype.slice.call(list || []); }
  function pad2(n) { n = String(n || ""); return n.length >= 2 ? n : "0" + n; }

  function init(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    const items = toArr(root.querySelectorAll(".mk-acc-item"));
    const media = toArr(root.querySelectorAll(".mk-acc-media"));
    const chipEl = root.querySelector(".mk-acc-chip, [data-mk-chip]");
    const headingEl = root.querySelector(".mk-acc-heading, [data-mk-heading]");
    if (!items.length) return;

    const keyOf = (el) => el && el.getAttribute("data-acc");
    const panelOf = (item) => item && item.querySelector(".mk-acc-body");

    const defaultItem = items[0];
    const defaultKey = keyOf(defaultItem) || "1";
    const defaultTitle = (defaultItem && defaultItem.getAttribute("data-title")) || "";

    function setLeftHeader(title, key) {
      if (headingEl) headingEl.textContent = title || "";
      if (chipEl) chipEl.textContent = "(" + pad2(key) + ")";
    }

    function openPanel(item, isOpen) {
      const panel = panelOf(item);
      if (!panel) return 0;

      if (!isOpen) {
        panel.style.maxHeight = "0px";
        return 0;
      }
      const h = panel.scrollHeight || 0;
      panel.style.maxHeight = h + "px";
      return h;
    }

    function relayout() {
      // сброс
      items.forEach((it) => it.style.setProperty("--mk-shift", "0px"));

      let shift = 0;

      items.forEach((it) => {
        it.style.setProperty("--mk-shift", shift + "px");

        if (it.classList.contains("is-active")) {
          const panel = panelOf(it);
          const extra = panel ? (panel.scrollHeight || 0) : 0;

          // воздух между карточками, подстрой если надо
          shift += extra + 14;
        }
      });
    }

    function setActive(key) {
      const activeItem = items.find((i) => keyOf(i) === key);
      if (!activeItem) return;

      const title = activeItem.getAttribute("data-title") || "";

      items.forEach((i) => {
        const is = keyOf(i) === key;
        i.classList.toggle("is-active", is);
        openPanel(i, is);
      });

      media.forEach((m) => m.classList.toggle("is-active", keyOf(m) === key));
      setLeftHeader(title, key);

      requestAnimationFrame(relayout);
      setTimeout(relayout, 60);
    }

    function closeAllKeepDefaultMedia() {
      items.forEach((i) => {
        i.classList.remove("is-active");
        openPanel(i, false);
      });

      media.forEach((m) => m.classList.remove("is-active"));
      const defMedia = media.find((m) => keyOf(m) === defaultKey) || media[0];
      if (defMedia) defMedia.classList.add("is-active");

      setLeftHeader(defaultTitle, defaultKey);

      requestAnimationFrame(relayout);
      setTimeout(relayout, 60);
    }

    // init
    setActive(defaultKey);

    // click
    root.addEventListener("click", function (e) {
      const item = e.target.closest(".mk-acc-item");
      if (!item || !root.contains(item)) return;

      const key = keyOf(item);
      if (!key) return;

      if (item.classList.contains("is-active")) closeAllKeepDefaultMedia();
      else setActive(key);
    }, true);

    // resize fix
    window.addEventListener("resize", function () {
      const active = items.find((i) => i.classList.contains("is-active"));
      if (active) openPanel(active, true);
      relayout();
    });

    setTimeout(relayout, 300);
    setTimeout(relayout, 1200);
  }

  function boot() {
    document.querySelectorAll(".mk-acc").forEach(init);
  }

  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
