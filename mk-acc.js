(function () {
  if (window.__mkAccPushV2) return;
  window.__mkAccPushV2 = true;

  function toArr(x){ return Array.prototype.slice.call(x || []); }
  function pad2(n){ n = String(n || ""); return n.length >= 2 ? n : "0" + n; }

  function pickTextNode(el){
    if(!el) return null;
    return el.querySelector(".tn-atom") || el;
  }

  function getGlobalHeaderEls(){
    var headingSrc = toArr(document.querySelectorAll(".mk-acc-heading, [data-mk-heading]"));
    var chipSrc = toArr(document.querySelectorAll(".mk-acc-chip, [data-mk-chip]"));
    return {
      heading: headingSrc.map(pickTextNode).filter(Boolean),
      chip: chipSrc.map(pickTextNode).filter(Boolean)
    };
  }

  function setGlobalHeader(title, key){
    var els = getGlobalHeaderEls();
    els.heading.forEach(function(el){ el.textContent = title || ""; });
    els.chip.forEach(function(el){ el.textContent = "(" + pad2(key) + ")"; });
  }

  function setImportant(el, prop, value){
    if(!el) return;
    el.style.setProperty(prop, value, "important");
  }

  function px(n){ return Math.round(n) + "px"; }

  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

  function getWrapper(item){
    // где реально сидит размер/позиция
    return item.closest(".t396__elem") || item.closest(".tn-elem") || item;
  }

  function getPaddings(item){
    var cs = window.getComputedStyle(item);
    return {
      pt: parseFloat(cs.paddingTop) || 0,
      pb: parseFloat(cs.paddingBottom) || 0
    };
  }

  function measureClosedH(item){
    var title = item.querySelector(".mk-acc-title");
    if(!title) return null;
    var pad = getPaddings(item);
    return Math.ceil(title.getBoundingClientRect().height + pad.pt + pad.pb);
  }

  function measureOpenH(item){
    var title = item.querySelector(".mk-acc-title");
    var body = item.querySelector(".mk-acc-body");
    if(!title) return null;

    var pad = getPaddings(item);

    var bodyH = 0;
    var bodyMt = 0;
    if(body){
      bodyH = body.scrollHeight;
      bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0; // у тебя 20px
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function prepareWrapper(wrap){
    // height анимируем, shift делаем через transform
    setImportant(wrap, "overflow", "hidden");
    setImportant(
      wrap,
      "transition",
      "height .75s cubic-bezier(.16, 1, .3, 1), transform .75s cubic-bezier(.16, 1, .3, 1)"
    );
    setImportant(wrap, "will-change", "height, transform");
  }

  function applyTransformShift(m, shiftPx){
    // сохраняем базовый transform и добавляем translateY
    var base = m.baseTransform;
    if(!base || base === "none") base = "";
    // важно: добавляем translateY последним, чтобы “дожимало” вниз
    var t = (base ? base + " " : "") + "translateY(" + px(shiftPx) + ")";
    setImportant(m.wrap, "transform", t);
  }

  function initOne(root){
    if(!root || root.__mkAccInitedPushV2) return;
    root.__mkAccInitedPushV2 = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if(!items.length) return;

    // карта элементов в порядке как в DOM (обычно это верх->низ)
    var map = items.map(function(item){
      var wrap = getWrapper(item);
      prepareWrapper(wrap);
      return {
        item: item,
        wrap: wrap,
        key: keyOf(item),
        closedH: 0,
        openH: 0,
        baseTransform: window.getComputedStyle(wrap).transform || ""
      };
    });

    function recalc(){
      map.forEach(function(m){
        m.closedH = measureClosedH(m.item) || m.closedH || 0;
        m.openH = measureOpenH(m.item) || m.openH || m.closedH || 0;
      });
    }

    function applyLayout(){
      recalc();

      var activeIndex = map.findIndex(function(m){ return m.item.classList.contains("is-active"); });
      if(activeIndex < 0) activeIndex = 0;

      // 1) высоты
      map.forEach(function(m, idx){
        var h = (idx === activeIndex) ? m.openH : m.closedH;
        if(h > 0) setImportant(m.wrap, "height", px(h));
      });

      // 2) сдвиг вниз для тех, кто ниже активного
      var delta = (map[activeIndex].openH - map[activeIndex].closedH) || 0;

      map.forEach(function(m, idx){
        var shift = (idx > activeIndex) ? delta : 0;
        applyTransformShift(m, shift);
      });
    }

    function setActive(key){
      if(!key) return;

      var activeItem = items.find(function(i){ return keyOf(i) === key; });
      var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";

      items.forEach(function(i){
        i.classList.toggle("is-active", keyOf(i) === key);
      });

      media.forEach(function(m){
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(title, key);

      requestAnimationFrame(applyLayout);
    }

    function closeToDefault(){
      var first = items[0];
      var k = keyOf(first) || "1";

      items.forEach(function(i){ i.classList.remove("is-active"); });

      media.forEach(function(m){ m.classList.remove("is-active"); });
      var defMedia = media.find(function(m){ return keyOf(m) === k; }) || media[0];
      if(defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(title, k);

      requestAnimationFrame(applyLayout);
    }

    // init: открыть первый
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    root.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !root.contains(item)) return;

      var k = keyOf(item);
      if(!k) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(k);
    }, true);

    // первичный расчёт + ресайз
    requestAnimationFrame(applyLayout);
    window.addEventListener("resize", function(){
      // на ресайзе базовый transform мог поменяться — обновим
      map.forEach(function(m){
        m.baseTransform = window.getComputedStyle(m.wrap).transform || "";
      });
      requestAnimationFrame(applyLayout);
    });
  }

  function bootOnce(){
    var roots = toArr(document.querySelectorAll("#rec850499661 .mk-acc, #rec1932878341 .mk-acc"));
    if(!roots.length) return false;
    roots.forEach(initOne);
    return true;
  }

  function bootWithRetry(){
    var tries = 0, maxTries = 120, delay = 150;
    var timer = setInterval(function(){
      tries += 1;
      var ok = bootOnce();
      if(ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if(document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
