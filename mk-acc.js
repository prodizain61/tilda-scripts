(function () {
  function toArr(list) { return Array.prototype.slice.call(list || []); }
  function pad2(n) { var s = String(n || ""); return s.length >= 2 ? s : "0" + s; }

  function getGlobalHeaderEls(root) {
    // Ищем внутри конкретного аккордеона, чтобы не путать с другими блоками
    var heading = toArr(root.querySelectorAll('[data-mk-heading], .mk-acc-heading'));
    var chip = toArr(root.querySelectorAll('[data-mk-chip], .mk-acc-chip'));
    return { heading: heading, chip: chip };
  }

  function setGlobalHeader(root, title, key) {
    var els = getGlobalHeaderEls(root);
    els.heading.forEach(function (el) { el.textContent = title || ""; });
    els.chip.forEach(function (el) { el.textContent = "(" + pad2(key) + ")"; });
  }

  function getPanel(item){
    // ты используешь mk-acc-body как раскрывающийся текст
    return item.querySelector(".mk-acc-body");
  }

  function setPanelOpen(item, open){
    var panel = getPanel(item);
    if (!panel) return;

    if (open) {
      // меряем реальную высоту и ставим max-height
      panel.style.maxHeight = panel.scrollHeight + "px";
    } else {
      panel.style.maxHeight = "0px";
    }
  }

  function initOne(root) {
    if (!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    function keyOf(el) { return el ? el.getAttribute("data-acc") : null; }

    function setActive(key) {
      if (!key) return;

      var activeItem = items.find(function (i) { return keyOf(i) === key; });
      var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";

      items.forEach(function (i) {
        var is = (keyOf(i) === key);
        i.classList.toggle("is-active", is);
        setPanelOpen(i, is);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(root, title, key);
    }

    function closeAllKeepMediaDefault() {
      // Закрываем все панели
      items.forEach(function (i) {
        i.classList.remove("is-active");
        setPanelOpen(i, false);
      });

      // Медиа оставляем по первому ключу (или 1)
      var first = items[0];
      var k = keyOf(first) || "1";

      media.forEach(function (m) { m.classList.remove("is-active"); });
      var defMedia = media.find(function (m) { return keyOf(m) === k; }) || media[0];
      if (defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(root, title, k);
    }

    // init default
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    // Делегирование клика (самое надежное в Tilda)
    root.addEventListener("click", function (e) {
      var item = e.target.closest(".mk-acc-item");
      if (!item || !root.contains(item)) return;

      var key = keyOf(item);
      if (!key) return;

      // toggle: клик по активному закрывает все обратно
      if (item.classList.contains("is-active")) {
        closeAllKeepMediaDefault();
      } else {
        setActive(key);
      }
    }, true);

    // Пересчет высоты панели при ресайзе (чтобы не ломалось на мобиле)
    window.addEventListener("resize", function(){
      var active = items.find(function(i){ return i.classList.contains("is-active"); });
      if (active) setPanelOpen(active, true);
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
