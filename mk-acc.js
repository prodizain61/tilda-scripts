(function () {
  if (window.__mkAccPushV1) return;
  window.__mkAccPushV1 = true;

  function toArr(x) { return Array.prototype.slice.call(x || []); }
  function pad2(n) { n = String(n || ""); return n.length >= 2 ? n : "0" + n; }

  function pickTextNode(el) {
    if (!el) return null;
    return el.querySelector(".tn-atom") || el;
  }

  function getGlobalHeaderEls() {
    var headingSrc = toArr(document.querySelectorAll(".mk-acc-heading, [data-mk-heading]"));
    var chipSrc = toArr(document.querySelectorAll(".mk-acc-chip, [data-mk-chip]"));
    return {
      heading: headingSrc.map(pickTextNode).filter(Boolean),
      chip: chipSrc.map(pickTextNode).filter(Boolean)
    };
  }

  function setGlobalHeader(title, key) {
    var els = getGlobalHeaderEls();
    els.heading.forEach(function (el) { el.textContent = title || ""; });
    els.chip.forEach(function (el) { el.textContent = "(" + pad2(key) + ")"; });
  }

  // --- Tilda wrapper helpers ---
  function getWrapperForItem(item) {
    // чаще всего высота/топ живут тут
    return item.closest(".t396__elem") || item.closest(".tn-elem") || item;
  }

  function setImportant(el, prop, value) {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  }

  function px(n) { return Math.round(n) + "px"; }

  function getTopPx(el) {
    var v = (el.style && el.style.top) ? el.style.top : "";
    if (v && v.indexOf("px") > -1) return parseFloat(v);

    var csTop = window.getComputedStyle(el).top;
    if (csTop && csTop.indexOf("px") > -1) return parseFloat(csTop);

    // fallback
    return 0;
  }

  function getPaddings(item) {
    var cs = window.getComputedStyle(item);
    return {
      pt: parseFloat(cs.paddingTop) || 0,
      pb: parseFloat(cs.paddingBottom) || 0
    };
  }

  function measureClosedH(item) {
    var title = item.querySelector(".mk-acc-title");
    if (!title) return null;
    var pad = getPaddings(item);
    return Math.ceil(title.getBoundingClientRect().height + pad.pt + pad.pb);
  }

  function measureOpenH(item) {
    var title = item.querySelector(".mk-acc-title");
    var body = item.querySelector(".mk-acc-body");
    if (!title) return null;

    var pad = getPaddings(item);

    var bodyH = 0;
    var bodyMt = 0;
    if (body) {
      bodyH = body.scrollHeight; // полная высота текста
      bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0; // у тебя 20px
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function setSmooth(wrapper) {
    // чтобы top/height анимировались
    setImportant(wrapper, "transition", "top .75s cubic-bezier(.16, 1, .3, 1), height .75s cubic-bezier(.16, 1, .3, 1)");
    setImportant(wrapper, "will-change", "top,height");
    setImportant(wrapper, "overflow", "hidden");
  }

  function initOne(root) {
    if (!root || root.__mkAccInitedPush) return;
    root.__mkAccInitedPush = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    function keyOf(el) { return el ? el.getAttribute("data-acc") : null; }

    // Снимаем “карту”: wrapper + базовый top (чтобы потом возвращать)
    var map = items.map(function (item) {
      var wrap = getWrapperForItem(item);
      setSmooth(wrap);
      return {
        item: item,
        wrap: wrap,
        key: keyOf(item),
        baseTop: getTopPx(wrap),
        closedH: 0,
        openH: 0
      };
    });

    // сортируем по вертикали (на всякий)
    map.sort(function (a, b) { return a.baseTop - b.baseTop; });

    function recalcHeights() {
      map.forEach(function (m) {
        m.closedH = measureClosedH(m.item) || m.closedH || 0;
        m.openH = measureOpenH(m.item) || m.openH || m.closedH || 0;
      });
    }

    function applyLayout() {
      recalcHeights();

      var activeIndex = map.findIndex(function (m) { return m.item.classList.contains("is-active"); });
      if (activeIndex < 0) activeIndex = 0;

      // Сначала ставим высоты
      map.forEach(function (m, idx) {
        var h = (idx === activeIndex) ? m.openH : m.closedH;
        if (h > 0) setImportant(m.wrap, "height", px(h));
      });

      // Потом “раздвигаем вниз” все элементы ниже активного
      var delta = (map[activeIndex].openH - map[activeIndex].closedH) || 0;

      map.forEach(function (m, idx) {
        var shift = (idx > activeIndex) ? delta : 0;
        setImportant(m.wrap, "top", px(m.baseTop + shift));
      });
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

      setGlobalHeader(title, key);

      // дать примениться классам, потом мерить и раскладывать
      requestAnimationFrame(applyLayout);
    }

    function closeToDefault() {
      var first = map[0] ? map[0].item : items[0];
      var k = keyOf(first) || "1";

      items.forEach(function (i) { i.classList.remove("is-active"); });

      // медиа оставляем дефолтным
      media.forEach(function (m) { m.classList.remove("is-active"); });
      var defMedia = media.find(function (m) { return keyOf(m) === k; }) || media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var t = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(t, k);

      requestAnimationFrame(applyLayout);
    }

    // init: открыть первый
    var defaultKey = map[0] ? (map[0].key || "1") : (keyOf(items[0]) || "1");
    setActive(defaultKey);

    // click
    root.addEventListener("click", function (e) {
      var item = e.target.closest(".mk-acc-item");
      if (!item || !root.contains(item)) return;

      var key = keyOf(item);
      if (!key) return;

      if (item.classList.contains("is-active")) closeToDefault();
      else setActive(key);
    }, true);

    // first layout + resize
    requestAnimationFrame(applyLayout);
    window.addEventListener("resize", function () {
      // при ресайзе базовые top могут “поплыть”, пересчитаем их заново
      map.forEach(function (m) { m.baseTop = getTopPx(m.wrap); });
      requestAnimationFrame(applyLayout);
    });
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll("#rec850499661 .mk-acc, #rec1932878341 .mk-acc"));
    if (!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry() {
    var tries = 0, maxTries = 120, delay = 150;
    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
