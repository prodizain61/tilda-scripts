(function () {
  if (window.__mkAccTildaGroupV1) return;
  window.__mkAccTildaGroupV1 = true;

  function toArr(x){ return Array.prototype.slice.call(x || []); }
  function pad2(n){ n = String(n || ""); return n.length >= 2 ? n : "0" + n; }
  function px(n){ return Math.round(n) + "px"; }

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

  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

  function getWrapper(item){
    // ВАЖНО: у тебя item сам является .t396__group, это и есть нужная оболочка
    return item.closest(".t396__group") || item.closest(".tn-group") || item;
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
      bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0; // у тебя должно быть 20px
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function prepareWrapper(wrap){
    setImportant(wrap, "overflow", "hidden");
    setImportant(wrap, "will-change", "height, transform");
    setImportant(
      wrap,
      "transition",
      "height .75s cubic-bezier(.16, 1, .3, 1), transform .75s cubic-bezier(.16, 1, .3, 1)"
    );
  }

  function applyShift(wrap, baseTransform, shiftPx){
    var base = baseTransform || "";
    if(base === "none") base = "";
    var t = (base ? base + " " : "") + "translateY(" + px(shiftPx) + ")";
    setImportant(wrap, "transform", t);
  }

  function initRec(rec){
    if(!rec || rec.__mkAccGroupInited) return;
    rec.__mkAccGroupInited = true;

    // ВАЖНО: не ищем .mk-acc wrapper - работаем прямо внутри rec
    var items = toArr(rec.querySelectorAll(".mk-acc-item"));
    var media = toArr(rec.querySelectorAll(".mk-acc-media"));
    if(!items.length) return;

    // карта элементов в порядке DOM (у тебя это порядок сверху вниз)
    var map = items.map(function(item){
      var wrap = getWrapper(item);
      prepareWrapper(wrap);
      return {
        item: item,
        wrap: wrap,
        key: keyOf(item),
        baseTransform: window.getComputedStyle(wrap).transform || "",
        closedH: 0,
        openH: 0
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

      // 2) раздвижение вниз
      var delta = (map[activeIndex].openH - map[activeIndex].closedH) || 0;

      map.forEach(function(m, idx){
        var shift = (idx > activeIndex) ? delta : 0;
        applyShift(m.wrap, m.baseTransform, shift);
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

      // медиа оставляем дефолтным
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

    // click delegation
    rec.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !rec.contains(item)) return;

      var k = keyOf(item);
      if(!k) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(k);
    }, true);

    requestAnimationFrame(applyLayout);

    window.addEventListener("resize", function(){
      // переснять baseTransform (Тильда может менять)
      map.forEach(function(m){
        m.baseTransform = window.getComputedStyle(m.wrap).transform || "";
      });
      requestAnimationFrame(applyLayout);
    });
  }

  function bootOnce(){
    var recs = toArr(document.querySelectorAll("#rec850499661, #rec1932878341"));
    if(!recs.length) return false;
    recs.forEach(initRec);
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
