(function () {
  // защита от дублей: если скрипт уже есть, второй раз не запускаем
  if (window.__mkAccHeightV3) return;
  window.__mkAccHeightV3 = true;

  function toArr(list) { return Array.prototype.slice.call(list || []); }
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
    var chipText = "(" + pad2(key) + ")";
    els.heading.forEach(function (el) { el.textContent = title || ""; });
    els.chip.forEach(function (el) { el.textContent = chipText; });
  }

  /* ====== HEIGHT ENGINE (Tilda-proof) ======
     Ставим height на tn-elem с !important.
     Это пробивает фиксированные размеры Zero Block.
  */

  function getSizingBox(itemEl) {
    // 1) самый частый случай: класс на внутреннем блоке, высота на tn-elem
    var box = itemEl.closest(".tn-elem");
    if (box) return box;

    // 2) иногда внутри тильдовский контейнер другого класса
    box = itemEl.closest(".t396__elem");
    if (box) return box;

    // 3) fallback: сам элемент
    return itemEl;
  }

  function setTransitionImportant(el) {
    if (!el) return;
    // height transition + overflow hidden — чтобы контент не торчал
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("transition", "height .75s cubic-bezier(.16, 1, .3, 1)", "important");
    el.style.setProperty("will-change", "height", "important");
  }

  function getPaddingPx(el) {
    var cs = window.getComputedStyle(el);
    return {
      pt: parseFloat(cs.paddingTop) || 0,
      pb: parseFloat(cs.paddingBottom) || 0
    };
  }

  function measureClosedHeight(itemEl) {
    var title = itemEl.querySelector(".mk-acc-title");
    if (!title) return null;
    var pad = getPaddingPx(itemEl);
    return Math.ceil(title.getBoundingClientRect().height + pad.pt + pad.pb);
  }

  function measureOpenHeight(itemEl) {
    var title = itemEl.querySelector(".mk-acc-title");
    var body = itemEl.querySelector(".mk-acc-body");
    if (!title) return null;

    var pad = getPaddingPx(itemEl);

    var bodyH = 0;
    var bodyMt = 0;
    if (body) {
      bodyH = body.scrollHeight; // полная высота контента
      bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0;
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function applyHeightForItem(itemEl) {
    var box = getSizingBox(itemEl);
    setTransitionImportant(box);

    var h = itemEl.classList.contains("is-active") ? measureOpenHeight(itemEl) : measureClosedHeight(itemEl);
    if (h == null) return;

    // ВАЖНО: ставим height на tn-elem с !important (пробивает Zero)
    box.style.setProperty("height", h + "px", "important");
  }

  function applyHeights(items) {
    items.forEach(applyHeightForItem);
  }

  function initOne(root) {
    if (!root || root.__mkAccInitedV3) return;
    root.__mkAccInitedV3 = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    function keyOf(el) { return el ? el.getAttribute("data-acc") : null; }

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

      // дать браузеру применить классы, потом мерить высоты
      requestAnimationFrame(function () {
        applyHeights(items);
      });
    }

    function closeToDefault() {
      var first = items[0];
      var k = keyOf(first) || "1";

      items.forEach(function (i) { i.classList.remove("is-active"); });

      media.forEach(function (m) { m.classList.remove("is-active"); });
      var defMedia = media.find(function (m) { return keyOf(m) === k; }) || media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(title, k);

      requestAnimationFrame(function () {
        applyHeights(items);
      });
    }

    // init default
    var defaultKey = keyOf(items[0]) || "1";
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

    // первичная подгонка высот
    requestAnimationFrame(function () {
      applyHeights(items);
    });

    // resize
    window.addEventListener("resize", function () {
      applyHeights(items);
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
