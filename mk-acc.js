(function () {
  if (window.__mkZeroAccV3) return;
  window.__mkZeroAccV3 = true;

  var REC_IDS = ["rec1932878341", "rec850499661"];
  var GAP = 14;         // расстояние между карточками
  var BODY_GAP = 20;    // body на 20px ниже заголовка

  function toArr(list){ return Array.prototype.slice.call(list || []); }
  function num(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function px(n){ return Math.round(n) + "px"; }
  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

  function pad2(n){ n = String(n || ""); return n.length >= 2 ? n : "0" + n; }
  function pickTextNode(el){ return (el && (el.querySelector(".tn-atom") || el)) || null; }

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

  function setImp(el, prop, value){
    if(!el) return;
    el.style.setProperty(prop, value, "important");
  }

  function measureHeights(item){
    var titleEl = item.querySelector(".mk-acc-title");
    var bodyEl = item.querySelector(".mk-acc-body");

    var csItem = getComputedStyle(item);
    var pt = num(csItem.paddingTop);
    var pb = num(csItem.paddingBottom);

    var titleH = titleEl ? titleEl.getBoundingClientRect().height : 0;

    var bodyH = 0;
    if(bodyEl){
      bodyH = bodyEl.scrollHeight || 0;
    }

    // закрыто: только заголовок + паддинги
    var closedH = Math.ceil(titleH + pt + pb);

    // открыто: заголовок + 20px + body + паддинги
    var openH = Math.ceil(titleH + BODY_GAP + bodyH + pt + pb);

    // страховки
    if (closedH < 80) closedH = 80;
    if (openH < closedH) openH = closedH;

    return { closedH: closedH, openH: openH };
  }

  function readBaseTop(group){
    // реальный top, который t396 выставила
    if (group.style.top) return num(group.style.top);
    var d = num(group.getAttribute("data-group-top-value"));
    if (d) return d;
    return num(getComputedStyle(group).top);
  }

  function forceLayout(rec){
    var items = toArr(rec.querySelectorAll(".mk-acc-item"));
    if(!items.length) return;

    // строим модель и сортируем по текущему top
    var model = items.map(function(item){
      return {
        item: item,
        key: keyOf(item),
        baseTop: readBaseTop(item),
        h: measureHeights(item)
      };
    }).sort(function(a,b){ return a.baseTop - b.baseTop; });

    // кто активный
    var activeIndex = model.findIndex(function(m){ return m.item.classList.contains("is-active"); });
    if(activeIndex < 0) activeIndex = 0;

    // пересчитываем лесенку top
    var top = model[0].baseTop;

    model.forEach(function(m, idx){
      var targetH = (idx === activeIndex) ? m.h.openH : m.h.closedH;

      // обновляем data-значения, чтобы t396 меньше “откатывала”
      m.item.setAttribute("data-group-height-value", String(Math.round(targetH)));
      m.item.setAttribute("data-group-top-value", String(Math.round(top)));

      // принудительно держим
      setImp(m.item, "height", px(targetH));
      setImp(m.item, "top", px(top));
      setImp(m.item, "overflow", "hidden");

      top += targetH + GAP;
    });
  }

  function initRec(rec){
    if(!rec || rec.__mkInited) return;
    rec.__mkInited = true;

    var items = toArr(rec.querySelectorAll(".mk-acc-item"));
    var media = toArr(rec.querySelectorAll(".mk-acc-media"));
    if(!items.length) return;

    function setActive(key){
      if(!key) return;

      var activeItem = items.find(function(i){ return keyOf(i) === key; });
      var title = activeItem ? (activeItem.getAttribute("data-title") || "") : "";

      items.forEach(function(i){
        i.classList.toggle("is-active", keyOf(i) === key);
      });

      // media sync
      media.forEach(function(m){
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(title, key);
      requestAnimationFrame(function(){ forceLayout(rec); });
    }

    function closeToDefault(){
      var first = items[0];
      var k = keyOf(first) || "1";

      items.forEach(function(i){ i.classList.remove("is-active"); });

      media.forEach(function(m){ m.classList.remove("is-active"); });
      var defMedia = media.find(function(m){ return keyOf(m) === k; }) || media[0];
      if(defMedia) defMedia.classList.add("is-active");

      setGlobalHeader((first && first.getAttribute("data-title")) || "", k);
      requestAnimationFrame(function(){ forceLayout(rec); });
    }

    // init first
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    rec.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !rec.contains(item)) return;

      var key = keyOf(item);
      if(!key) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(key);
    }, true);

    // ВАЖНО: t396 часто перерасчитывает после клика, ресайза, прокрутки.
    // Мы “держим” лэйаут некоторое время после событий.
    var holdTimer = 0;
    function hold(){
      var t = 0;
      clearInterval(holdTimer);
      holdTimer = setInterval(function(){
        t += 1;
        forceLayout(rec);
        if (t >= 20) clearInterval(holdTimer); // ~3 секунды
      }, 150);
    }

    window.addEventListener("resize", hold);
    window.addEventListener("scroll", function(){
      // редко, но у некоторых блоков пересчет идет от скролла
      hold();
    }, { passive: true });

    // стартовая подстраховка
    hold();
  }

  function boot(){
    var ok = false;
    REC_IDS.forEach(function(id){
      var rec = document.getElementById(id);
      if (rec){ initRec(rec); ok = true; }
    });
    return ok;
  }

  function bootRetry(){
    var tries = 0;
    var max = 140;
    var timer = setInterval(function(){
      tries += 1;
      var ok = boot();
      if (ok || tries >= max) clearInterval(timer);
    }, 150);
  }

  if (document.readyState === "complete") bootRetry();
  else window.addEventListener("load", bootRetry);
})();
