/* mk-accordion.js
   Accordion for Tilda Zero Block:
   - Click: switches .is-active on .mk-acc-item and .mk-acc-media
   - Updates global header: .mk-acc-heading / [data-mk-heading], .mk-acc-chip / [data-mk-chip]
   - Sizes each card by OPEN-shape (.mk-acc-open-shape):
       closed: width = shape width, height = title height + paddings
       open:   width = shape width, height = shape height
   - Body reveal: maxHeight = scrollHeight (no hardcoded 240px)
*/

(function () {
  "use strict";

  /* ---------------- utils ---------------- */
  function toArr(list) {
    return Array.prototype.slice.call(list || []);
  }
  function pad2(n) {
    var s = String(n || "");
    return s.length >= 2 ? s : "0" + s;
  }
  function px(n) {
    return Math.round(n) + "px";
  }

  function pickTextNode(el) {
    if (!el) return null;
    return el.querySelector(".tn-atom") || el;
  }

  function getGlobalHeaderEls() {
    var headingSrc = toArr(
      document.querySelectorAll(".mk-acc-heading, [data-mk-heading]")
    );
    var chipSrc = toArr(
      document.querySelectorAll(".mk-acc-chip, [data-mk-chip]")
    );

    return {
      heading: headingSrc.map(pickTextNode).filter(Boolean),
      chip: chipSrc.map(pickTextNode).filter(Boolean),
    };
  }

  function setGlobalHeader(title, key) {
    var els = getGlobalHeaderEls();
    var chipText = "(" + pad2(key) + ")";
    els.heading.forEach(function (el) {
      el.textContent = title || "";
    });
    els.chip.forEach(function (el) {
      el.textContent = chipText;
    });
  }

  function keyOf(el) {
    return el ? el.getAttribute("data-acc") : null;
  }

  function ensureTitleClass(item) {
    // If .mk-acc-title is not set, try to guess the title:
    // first .tn-atom inside item that is not inside .mk-acc-body
    if (!item) return;
    if (item.querySelector(".mk-acc-title")) return;

    var body = item.querySelector(".mk-acc-body");
    var atoms = toArr(item.querySelectorAll(".tn-atom"));

    var guessed = atoms.find(function (a) {
      return !body || !body.contains(a);
    });

    if (guessed) guessed.classList.add("mk-acc-title");
  }

  /* ---------------- sizing by shape ---------------- */
  function getShapeEl(item) {
    return item ? item.querySelector(".mk-acc-open-shape") : null;
  }

  function getTitleEl(item) {
    return item ? item.querySelector(".mk-acc-title") : null;
  }

  function getPaddings(item) {
    var cs = getComputedStyle(item);
    return {
      pt: parseFloat(cs.paddingTop) || 0,
      pb: parseFloat(cs.paddingBottom) || 0,
    };
  }

  function closeBody(item) {
    var body = item.querySelector(".mk-acc-body");
    if (!body) return;

    body.style.maxHeight = "0px";
    body.style.opacity = "0";
    body.style.transform = "translateY(6px)";
  }

  function openBody(item) {
    var body = item.querySelector(".mk-acc-body");
    if (!body) return;

    body.style.opacity = "1";
    body.style.transform = "translateY(0)";
    body.style.maxHeight = body.scrollHeight + "px";
  }

  function setClosedSize(item) {
    var sh = getShapeEl(item);
    var title = getTitleEl(item);
    if (!sh || !title) return;

    // width by shape
    var sw = sh.getBoundingClientRect().width;
    item.style.width = px(sw);

    // height by title + paddings
    var pads = getPaddings(item);
    var th = title.getBoundingClientRect().height;
    item.style.height = px(th + pads.pt + pads.pb);

    closeBody(item);
  }

  function setOpenSize(item) {
    var sh = getShapeEl(item);
    if (!sh) return;

    var r = sh.getBoundingClientRect();
    item.style.width = px(r.width);
    item.style.height = px(r.height);

    openBody(item);
  }

  function syncSizes(root) {
    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    items.forEach(function (item) {
      ensureTitleClass(item);

      if (item.classList.contains("is-active")) setOpenSize(item);
      else setClosedSize(item);
    });
  }

  /* ---------------- main accordion logic ---------------- */
  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    // Make sure title class exists before first sizing
    items.forEach(ensureTitleClass);

    // Default key is first item key
    var defaultKey = keyOf(items[0]) || "1";

    function setActive(key) {
      if (!key) return;

      var activeItem = items.find(function (i) {
        return keyOf(i) === key;
      });
      var titleText = activeItem ? activeItem.getAttribute("data-title") || "" : "";

      items.forEach(function (i) {
        var isA = keyOf(i) === key;
        i.classList.toggle("is-active", isA);
        if (isA) openBody(i);
        else closeBody(i);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(titleText, key);

      // sizing after state set
      syncSizes(root);
    }

    function closeToDefault() {
      setActive(defaultKey);
    }

    // Init state
    setActive(defaultKey);

    // Click delegation
    root.addEventListener(
      "click",
      function (e) {
        var item = e.target.closest(".mk-acc-item");
        if (!item || !root.contains(item)) return;

        var key = keyOf(item);
        if (!key) return;

        if (item.classList.contains("is-active")) closeToDefault();
        else setActive(key);
      },
      true
    );

    // Resync on resize
    window.addEventListener("resize", function () {
      syncSizes(root);

      // If active body content changes its height after fonts load, keep it correct
      var active = root.querySelector(".mk-acc-item.is-active");
      if (active) openBody(active);
    });

    // Observe shape changes (Zero block can reflow)
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        syncSizes(root);
        var active = root.querySelector(".mk-acc-item.is-active");
        if (active) openBody(active);
      });

      items.forEach(function (i) {
        var sh = getShapeEl(i);
        if (sh) ro.observe(sh);
      });
    }

    // First sizing pass (after initial layout)
    setTimeout(function () {
      syncSizes(root);
      var active = root.querySelector(".mk-acc-item.is-active");
      if (active) openBody(active);
    }, 0);
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll(".mk-acc"));
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
