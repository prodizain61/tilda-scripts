/* mk-acc.js
   Accordion + media switch for Tilda Zero
   Uses:
   - root: .mk-acc
   - items: .mk-acc-item  (each needs data-acc="1|2|3" and data-title="...")
   - media: .mk-acc-media (each needs data-acc="1|2|3")
   - left heading (optional): elements with data-mk-heading
   - left chip (optional): elements with data-mk-chip
*/

(function () {
  function toArr(list) {
    return Array.prototype.slice.call(list || []);
  }

  function pad2(n) {
    var s = String(n || "");
    return s.length >= 2 ? s : "0" + s;
  }

  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));

    // IMPORTANT: in Tilda there can be multiple copies (breakpoints),
    // so we update ALL matches, not only the first.
    var headingEls = toArr(root.querySelectorAll("[data-mk-heading]"));
    var chipEls = toArr(root.querySelectorAll("[data-mk-chip]"));

    if (!items.length) return;

    function getKey(el) {
      return el ? el.getAttribute("data-acc") : null;
    }

    function setLeftHeader(title, key) {
      headingEls.forEach(function (el) {
        el.textContent = title || "";
      });
      chipEls.forEach(function (el) {
        el.textContent = "(" + pad2(key) + ")";
      });
    }

    function setActive(key) {
      if (!key) return;

      var activeItem = items.find(function (i) {
        return getKey(i) === key;
      });

      items.forEach(function (i) {
        i.classList.toggle("is-active", getKey(i) === key);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", getKey(m) === key);
      });

      // Update left header from active card title
      var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";
      setLeftHeader(title, key);
    }

    function closeAllToDefault() {
      var first = items[0];
      var k = getKey(first) || "1";

      items.forEach(function (i) {
        i.classList.remove("is-active");
      });

      media.forEach(function (m) {
        m.classList.remove("is-active");
      });

      // Keep default media visible (nice UX)
      var defMedia = media.find(function (m) {
        return getKey(m) === k;
      });
      if (!defMedia && media[0]) defMedia = media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setLeftHeader(title, k);
    }

    // Initial state: open first
    var defaultKey = getKey(items[0]) || "1";
    setActive(defaultKey);

    // Click handlers (toggle)
    items.forEach(function (item) {
      item.style.cursor = "pointer";
      item.addEventListener("click", function () {
        var key = getKey(item);
        if (!key) return;

        if (item.classList.contains("is-active")) {
          closeAllToDefault();
          return;
        }
        setActive(key);
      });
    });
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll(".mk-acc"));
    if (!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry() {
    var tries = 0;
    var maxTries = 60; // 60 * 150ms = 9s
    var delay = 150;

    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") {
    bootWithRetry();
  } else {
    window.addEventListener("load", bootWithRetry);
  }
})();
