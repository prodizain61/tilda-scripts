(function () {
  function toArr(list) { return Array.prototype.slice.call(list || []); }
  function pad2(n) { var s = String(n || ""); return s.length >= 2 ? s : "0" + s; }

  function getGlobalHeaderEls() {
    var heading = toArr(document.querySelectorAll('[data-mk-heading], .mk-acc-heading'));
    var chip = toArr(document.querySelectorAll('[data-mk-chip], .mk-acc-chip'));
    return { heading: heading, chip: chip };
  }

  function setGlobalHeader(title, key) {
    var els = getGlobalHeaderEls();
    els.heading.forEach(function (el) { el.textContent = title || ""; });
    els.chip.forEach(function (el) { el.textContent = "(" + pad2(key) + ")"; });
  }

  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    function keyOf(el) { return el ? el.getAttribute("data-acc") : null; }

    // ====== ВОТ ЭТО ДОБАВЛЯЕТ "РАЗЪЕЗЖАНИЕ" ======
    function applyShiftLayout() {
      // Считаем итоговые позиции по DOM (как они стоят в макете)
      // и сдвигаем элементы ниже активного на высоту раскрытия.
      // Важно: тильда может иметь свои translate, поэтому работаем через CSS var.
      var activeIndex = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains("is-active")) { activeIndex = i; break; }
      }

      // Если нет активной — обнуляем
      if (activeIndex < 0) {
        items.forEach(function (el) { el.style.setProperty("--mk-shift", "0px"); });
        return;
      }

      // Высота раскрытого контента: берём body если есть, иначе всю карточку
      // (это “умное” приближение, чтобы выглядело как аккордеон)
      var active = items[activeIndex];
      var body = active.querySelector(".mk-acc-body");
      var extra = 0;

      if (body) {
        // scrollHeight даёт реальную высоту текста/контента
        extra = body.scrollHeight;
      } else {
        extra = active.scrollHeight;
      }

      // Немного воздуха как в Framer
      var gap = 18;
      var shift = extra + gap;

      // Всё что ниже активного — сдвигаем
      items.forEach(function (el, idx) {
        var val = (idx > activeIndex) ? shift : 0;
        el.style.setProperty("--mk-shift", val + "px");
      });
    }
    // ============================================

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

      // важное: после смены классов — пересчитать разъезд
      // requestAnimationFrame чтобы тильда успела применить стили
      requestAnimationFrame(applyShiftLayout);
    }

    function closeAll() {
      items.forEach(function (i) { i.classList.remove("is-active"); });
      media.forEach(function (m) { m.classList.remove("is-active"); });
      items.forEach(function (el) { el.style.setProperty("--mk-shift", "0px"); });

      // в шапке оставим первую карточку (по желанию)
      var first = items[0];
      var k = keyOf(first) || "1";
      var t = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(t, k);

      // медиа по умолчанию — первая
      var defMedia = media.find(function (m) { return keyOf(m) === k; }) || media[0];
      if (defMedia) defMedia.classList.add("is-active");
    }

    // init default
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    // делегирование клика (самое надёжное для Tilda)
    root.addEventListener("click", function (e) {
      var item = e.target.closest(".mk-acc-item");
      if (!item || !root.contains(item)) return;

      var key = keyOf(item);
      if (!key) return;

      // toggle: клик по активной — закрыть
      if (item.classList.contains("is-active")) closeAll();
      else setActive(key);
    });

    // на ресайз пересчитываем (адаптив)
    window.addEventListener("resize", function () {
      requestAnimationFrame(applyShiftLayout);
    });
  }

  function bootOnce() {
    var roots = toArr(document.querySelectorAll(".mk-acc"));
    if (!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry() {
    var tries = 0, maxTries = 80, delay = 150;
    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
