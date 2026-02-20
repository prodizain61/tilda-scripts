/* =========================
   FINAL JS (replace полностью)
   Works with:
   - .mk-acc container
   - .mk-acc-item[data-acc][data-title]
   - .mk-acc-media[data-acc]
   - .mk-acc-chip / [data-mk-chip]
   - .mk-acc-heading / [data-mk-heading]
   ========================= */

(function () {
  "use strict";

  function toArr(list) {
    return Array.prototype.slice.call(list || []);
  }

  function pickTextNode(el) {
    if (!el) return null;
    return el.querySelector(".tn-atom") || el;
  }

  function pad2(n) {
    var s = String(n || "");
    return s.length >= 2 ? s : "0" + s;
  }

  function keyOf(el) {
    return el ? el.getAttribute("data-acc") : null;
  }

  function getGlobalHeaderEls() {
    var headingSrc = toArr(document.querySelectorAll(".mk-acc-heading, [data-mk-heading]"));
    var chipSrc = toArr(document.querySelectorAll(".mk-acc-chip, [data-mk-chip]"));

    return {
      heading: headingSrc.map(pickTextNode).filter(Boolean),
      chip: chipSrc.map(pickTextNode).filter(Boolean),
    };
  }

  function setGlobalHeader(title, key) {
    var els = getGlobalHeaderEls();
    els.heading.forEach(function (el) {
      el.textContent = title || "";
    });
    els.chip.forEach(function (el) {
      el.textContent = "(" + pad2(key) + ")";
    });
  }

  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    var defaultItem = items[0];
    var defaultKey = keyOf(defaultItem) || "1";
    var defaultTitle = (defaultItem && defaultItem.getAttribute("data-title")) || "";

    function setActive(key) {
      var activeItem = items.find(function (i) {
        return keyOf(i) === key;
      });
      if (!activeItem) return;

      items.forEach(function (i) {
        i.classList.toggle("is-active", keyOf(i) === key);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(activeItem.getAttribute("data-title") || "", key);
    }

    function closeAll() {
      items.forEach(function (i) {
        i.classList.remove("is-active");
      });

      media.forEach(function (m) {
        m.classList.remove("is-active");
      });

      setGlobalHeader(defaultTitle, defaultKey);

      // оставим дефолтное фото, чтобы не было пустоты
      var defaultMedia = media.find(function (m) {
        return keyOf(m) === defaultKey;
      }) || media[0];

      if (defaultMedia) defaultMedia.classList.add("is-active");
    }

    // init: открыт первый
    setActive(defaultKey);

    // click handling
    items.forEach(function (i) {
      i.addEventListener("click", function () {
        var key = keyOf(i);
        if (!key) return;

        if (i.classList.contains("is-active")) {
          closeAll();
          return;
        }
        setActive(key);
      });
    });
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll("#rec850499661 .mk-acc"));
    if (!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry() {
    var tries = 0;
    var maxTries = 80;
    var delay = 150;

    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
