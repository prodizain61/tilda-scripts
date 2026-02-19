/* mk-acc.js
   Accordion + media switch for Tilda Zero
   Uses:
   - root: .mk-acc
   - items: .mk-acc-item  (each needs data-acc="1|2|3" and data-title="...")
   - media: .mk-acc-media (each needs data-acc="1|2|3")
   - left header (optional): element with data-mk-heading
   - left chip (optional): element with data-mk-chip
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

    // Optional: left-side title + chip
    var headingEl = root.querySelector("[data-mk-heading]");
    var chipEl = root.querySelector("[data-mk-chip]");

    // If no media, do not stop items from working.
    // We still allow accordion to operate even without media.
    if (!items.length) return;

    function getKey(el) {
      return el ? el.getAttribute("data-acc") : null;
    }

    function setLeftHeader(title, key) {
      if (headingEl) headingEl.textContent = title || "";
      if (chipEl) chipEl.textContent = "(" + pad2(key) + ")";
    }

    function setActive(key) {
      if (!key) return;

      // Find matching item
      var activeItem = items.find(function (i) {
        return getKey(i) === key;
      });

      items.forEach(function (i) {
        i.classList.toggle("is-active", getKey(i) === key);
      });

      // Media can be absent, do not break logic
      media.forEach(function (m) {
        m.classList.toggle("is-active", getKey(m) === key);
      });

      if (activeItem) {
        var title = activeItem.getAttribute("data-title") || "";
        setLeftHeader(title, key);
      } else {
        setLeftHeader("", key);
      }
    }

    function closeAllToDefault() {
      // Default is first item key (or "1")
      var first = items[0];
      var k = getKey(first) || "1";

      // Keep media default visible
      items.forEach(function (i) {
        i.classList.remove("is-active");
      });

      media.forEach(function (m) {
        m.classList.remove("is-active");
      });

      // Show default media, but keep accordion closed (no active items)
      var defMedia = media.find(function (m) {
        return getKey(m) === k;
      });
      if (!defMedia && media[0]) defMedia = media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setLeftHeader(title, k);
    }

    // Initial state: first item active (accordion open)
    var defaultKey = getKey(items[0]) || "1";
    setActive(defaultKey);

    // Click handlers with toggle close on active item
    items.forEach(function (item) {
      item.style.cursor = "pointer";
      item.addEventListener("click", function () {
        var key = getKey(item);
        if (!key) return;

        if (item.classList.contains("is-active")) {
          // Toggle: close active back
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

  // Tilda can render Zero content after initial DOM ready, so we retry.
  if (document.readyState === "complete") {
    bootWithRetry();
  } else {
    window.addEventListener("load", bootWithRetry);
  }
})();
