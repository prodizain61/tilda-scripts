/* =========================
   FINAL JS (replace полностью)
   Target: #rec1932878341
   - init via MutationObserver (Tilda Zero loads late)
   - toggle active item
   - sync media by data-acc
   - updates mk-acc-chip / mk-acc-heading (inside rec)
   - body раскрывается по scrollHeight
   ========================= */

(function () {
  "use strict";

  var REC_ID = "rec1932878341";

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

  function setBodyOpen(item, open) {
    var body = item.querySelector(".mk-acc-body");
    if (!body) return;

    if (!open) {
      body.style.maxHeight = "0px";
      return;
    }

    // два кадра, чтобы корректно посчитать высоту после смены классов/шрифтов
    requestAnimationFrame(function () {
      body.style.maxHeight = body.scrollHeight + "px";
      requestAnimationFrame(function () {
        body.style.maxHeight = body.scrollHeight + "px";
      });
    });
  }

  function initAccordion(accRoot, recRoot) {
    if (!accRoot || accRoot.__mkInited) return;
    accRoot.__mkInited = true;

    var items = toArr(accRoot.querySelectorAll(".mk-acc-item"));
    if (!items.length) return;

    var media = toArr(recRoot.querySelectorAll(".mk-acc-media"));
    var chipEl = pickTextNode(recRoot.querySelector(".mk-acc-chip, [data-mk-chip]"));
    var headingEl = pickTextNode(recRoot.querySelector(".mk-acc-heading, [data-mk-heading]"));

    var defaultItem = items[0];
    var defaultKey = keyOf(defaultItem) || "1";
    var defaultTitle = defaultItem.getAttribute("data-title") || "";

    function setLeftHeader(title, key) {
      if (headingEl) headingEl.textContent = title || "";
      if (chipEl) chipEl.textContent = "(" + pad2(key) + ")";
    }

    function setActive(key) {
      var activeItem = items.find(function (i) { return keyOf(i) === key; });
      if (!activeItem) return;

      items.forEach(function (i) {
        var isA = keyOf(i) === key;
        i.classList.toggle("is-active", isA);
        setBodyOpen(i, isA);
      });

      if (media.length) {
        media.forEach(function (m) {
          m.classList.toggle("is-active", keyOf(m) === key);
        });
      }

      setLeftHeader(activeItem.getAttribute("data-title") || "", key);
    }

    function closeAll() {
      items.forEach(function (i) {
        i.classList.remove("is-active");
        setBodyOpen(i, false);
      });

      if (media.length) {
        media.forEach(function (m) { m.classList.remove("is-active"); });

        var defaultMedia = media.find(function (m) { return keyOf(m) === defaultKey; }) || media[0];
        if (defaultMedia) defaultMedia.classList.add("is-active");
      }

      setLeftHeader(defaultTitle, defaultKey);
    }

    // init
    setActive(defaultKey);

    // click
    items.forEach(function (i) {
      i.addEventListener("click", function () {
        var key = keyOf(i);
        if (!key) return;

        if (i.classList.contains("is-active")) closeAll();
        else setActive(key);
      });
    });

    // resize: пересчитать maxHeight активного
    window.addEventListener("resize", function () {
      var active = accRoot.querySelector(".mk-acc-item.is-active");
      if (active) setBodyOpen(active, true);
    });
  }

  function boot() {
    var recRoot = document.getElementById(REC_ID);
    if (!recRoot) return;

    var accs = toArr(recRoot.querySelectorAll(".mk-acc"));
    if (!accs.length && recRoot.classList.contains("mk-acc")) accs = [recRoot];

    accs.forEach(function (accRoot) {
      initAccordion(accRoot, recRoot);
    });
  }

  // Boot now + observe late render
  boot();

  var obs = new MutationObserver(function () {
    boot();
  });

  document.addEventListener("DOMContentLoaded", boot);
  window.addEventListener("load", boot);

  obs.observe(document.documentElement, { childList: true, subtree: true });

  // safety: stop observing after 15s
  setTimeout(function () {
    try { obs.disconnect(); } catch (e) {}
  }, 15000);
})();
