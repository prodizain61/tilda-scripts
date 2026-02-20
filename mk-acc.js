(function () {
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

  /* ===== HEIGHT ENGINE (fix for Zero Block fixed tn-elem size) ===== */

  function getBoxForSizing(itemEl){
    // если класс на tn-atom — поднимаемся к tn-elem, у него реальная height в инлайне
    return itemEl.closest(".tn-elem") || itemEl;
  }

  function getPaddingPx(el){
    var cs = window.getComputedStyle(el);
    return {
      pt: parseFloat(cs.paddingTop) || 0,
      pb: parseFloat(cs.paddingBottom) || 0
    };
  }

  function setBoxTransition(box){
    // чтобы не зависеть от твоего общего CSS, фиксируем transition на высоту у box
    if(!box) return;
    box.style.overflow = "hidden";
    box.style.transition = "height .75s cubic-bezier(.16, 1, .3, 1)";
    box.style.willChange = "height";
  }

  function measureClosedHeight(itemEl){
    var title = itemEl.querySelector(".mk-acc-title");
    if(!title) return null;
    var pad = getPaddingPx(itemEl);
    return Math.ceil(title.getBoundingClientRect().height + pad.pt + pad.pb);
  }

  function measureOpenHeight(itemEl){
    var title = itemEl.querySelector(".mk-acc-title");
    var body  = itemEl.querySelector(".mk-acc-body");
    if(!title) return null;

    var pad = getPaddingPx(itemEl);

    var bodyH = 0;
    var bodyMt = 0;
    if(body){
      bodyH = body.scrollHeight; // полная высота контента даже при max-height:0
      bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0;
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function applyHeights(items){
    items.forEach(function(itemEl){
      var box = getBoxForSizing(itemEl);
      setBoxTransition(box);

      // выставляем “правильную” высоту по текущему состоянию
      var h = itemEl.classList.contains("is-active") ? measureOpenHeight(itemEl) : measureClosedHeight(itemEl);
      if(h != null) box.style.height = h + "px";
    });
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
        i.classList.toggle("is-active", keyOf(i) === key);
      });

      media.forEach(function (m) {
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(title, key);

      // после смены классов — применяем высоты
      setTimeout(function(){ applyHeights(items); }, 0);
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

      setTimeout(function(){ applyHeights(items); }, 0);
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

    // first sizing + resize
    setTimeout(function(){ applyHeights(items); }, 0);
    window.addEventListener("resize", function(){
      applyHeights(items);
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
