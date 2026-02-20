(function () {
  "use strict";

  var RECS = ["rec850499661", "rec1932878341"];

  function toArr(list) {
    return Array.prototype.slice.call(list || []);
  }

  function pad2(n) {
    var s = String(n || "");
    return s.length >= 2 ? s : "0" + s;
  }

  function pickTextNode(el) {
    if (!el) return null;
    return el.querySelector(".tn-atom") || el;
  }

  function keyOf(el) {
    return el ? el.getAttribute("data-acc") : null;
  }

  function initOneRec(recEl) {
    if (!recEl || recEl.__mkAccInited) return;
    recEl.__mkAccInited = true;

    // accordion roots in this rec
    var roots = toArr(recEl.querySelectorAll(".mk-acc"));
    if (!roots.length) return;

    // IMPORTANT: media can be anywhere inside the same rec
    var mediaAll = toArr(recEl.querySelectorAll(".mk-acc-media"));

    // global header/chip inside this rec
    var headingEls = toArr(recEl.querySelectorAll(".mk-acc-heading, [data-mk-heading]"))
      .map(pickTextNode)
      .filter(Boolean);
    var chipEls = toArr(recEl.querySelectorAll(".mk-acc-chip, [data-mk-chip]"))
      .map(pickTextNode)
      .filter(Boolean);

    function setHeader(title, key) {
      var chipText = "(" + pad2(key) + ")";
      headingEls.forEach(function (el) { el.textContent = title || ""; });
      chipEls.forEach(function (el) { el.textContent = chipText; });
    }

    roots.forEach(function (root) {
      if (root.__mkAccRootInited) return;
      root.__mkAccRootInited = true;

      var items = toArr(root.querySelectorAll(".mk-acc-item"));
      if (!items.length) return;

      // default = first item
      var first = items[0];
      var defaultKey = keyOf(first) || "1";
      var defaultTitle = (first && first.getAttribute("data-title")) || "";

      function setActive(key) {
        if (!key) return;

        var activeItem = items.find(function (i) { return keyOf(i) === key; });
        var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";

        // items
        items.forEach(function (i) {
          i.classList.toggle("is-active", keyOf(i) === key);
        });

        // media (across whole rec)
        if (mediaAll.length) {
          mediaAll.forEach(function (m) {
            m.classList.toggle("is-active", keyOf(m) === key);
          });
        }

        // header/chip
        setHeader(title, key);
      }

      function closeToDefault() {
        // close all items
        items.forEach(function (i) { i.classList.remove("is-active"); });

        // keep default media visible (to avoid empty)
        if (mediaAll.length) {
          mediaAll.forEach(function (m) { m.classList.remove("is-active"); });
          var defMedia = mediaAll.find(function (m) { return keyOf(m) === defaultKey; }) || mediaAll[0];
          if (defMedia) defMedia.classList.add("is-active");
        }

        setHeader(defaultTitle, defaultKey);
      }

      // init
      setActive(defaultKey);

      // click delegation
      root.addEventListener("click", function (e) {
        var item = e.target.closest(".mk-acc-item");
        if (!item || !root.contains(item)) return;

        var key = keyOf(item);
        if (!key) return;

        if (item.classList.contains("is-active")) closeToDefault();
        else setActive(key);
      }, true);
    });
  }

  function boot() {
    RECS.forEach(function (id) {
      var rec = document.getElementById(id);
      if (rec) initOneRec(rec);
    });
  }

  // Tilda может дорисовать Zero позже — сделаем повторную инициализацию
  function bootWithRetry() {
    var tries = 0;
    var maxTries = 100;
    var timer = setInterval(function () {
      tries += 1;
      boot();
      if (tries >= maxTries) clearInterval(timer);
    }, 200);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);

})();
