(function () {
  function toArr(list) { return Array.prototype.slice.call(list || []); }
  function pad2(n) { var s = String(n || ""); return s.length >= 2 ? s : "0" + s; }

  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    var headingEls = toArr(root.querySelectorAll("[data-mk-heading]"));
    var chipEls = toArr(root.querySelectorAll("[data-mk-chip]"));

    if (!items.length) return;

    function keyOf(el) { return el ? el.getAttribute("data-acc") : null; }

    function setLeft(title, key) {
      headingEls.forEach(function (el) { el.textContent = title || ""; });
      chipEls.forEach(function (el) { el.textContent = "(" + pad2(key) + ")"; });
    }

    function setActive(key) {
      if (!key) return;

      var activeItem = items.find(function (i) { return keyOf(i) === key; });
      var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";

      items.forEach(function (i) {
        i.classList.toggle("is-active", keyOf(i) === key);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setLeft(title, key);
    }

    function closeAllToDefault() {
      var first = items[0];
      var k = keyOf(first) || "1";

      items.forEach(function (i) { i.classList.remove("is-active"); });
      media.forEach(function (m) { m.classList.remove("is-active"); });

      var defMedia = media.find(function (m) { return keyOf(m) === k; }) || media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setLeft(title, k);
    }

    // init default
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    // ONE handler on root (event delegation) - Tilda friendly
    root.addEventListener("click", function (e) {
      var item = e.target.closest(".mk-acc-item");
      if (!item || !root.contains(item)) return;

      var key = keyOf(item);
      if (!key) return;

      if (item.classList.contains("is-active")) {
        closeAllToDefault();
      } else {
        setActive(key);
      }
    });
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll(".mk-acc"));
    if (!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry() {
    var tries = 0, maxTries = 60, delay = 150;
    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
