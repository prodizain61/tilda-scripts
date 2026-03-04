(function () {
  if (window.__mkAccHardT396V1) return;
  window.__mkAccHardT396V1 = true;

  function toArr(x){ return Array.prototype.slice.call(x || []); }
  function pad2(n){ n = String(n || ""); return n.length >= 2 ? n : "0" + n; }
  function px(n){ return Math.round(n) + "px"; }
  function num(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }

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

  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

  function getGroup(item){
    return item.closest(".t396__group") || item.closest(".tn-group") || item;
  }

  function setGroupHeight(group, h){
    var H = Math.max(0, Math.round(h));
    // Тильда часто читает из data-group-height-value
    group.setAttribute("data-group-height-value", String(H));
    // и из inline style
    group.style.height = px(H);
    group.style.maxHeight = "none";
    group.style.minHeight = "0";
    // чтобы не ломало содержимое
    group.style.overflow = "hidden";
    group.style.willChange = "height, top";
    // плавность
    group.style.transition = "height .75s cubic-bezier(.16,1,.3,1), top .75s cubic-bezier(.16,1,.3,1)";
  }

  function setGroupTop(group, topPx){
    var T = Math.round(topPx);
    group.setAttribute("data-group-top-value", String(T));
    group.style.top = px(T);
  }

  function getBaseTop(group){
    // берём приоритетно inline top, иначе data-group-top-value
    var t = group.style.top ? num(group.style.top) : num(group.getAttribute("data-group-top-value"));
    if(!t){
      // fallback computed
      t = num(getComputedStyle(group).top);
    }
    return t;
  }

  function getPaddings(item){
    var cs = getComputedStyle(item);
    return {
      pt: num(cs.paddingTop),
      pb: num(cs.paddingBottom)
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
      bodyMt = num(getComputedStyle(body).marginTop); // у тебя должно быть 20px
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function initRec(rec){
    if(!rec || rec.__mkAccHardInited) return;
    rec.__mkAccHardInited = true;

    var items = toArr(rec.querySelectorAll(".mk-acc-item"));
    var media = toArr(rec.querySelectorAll(".mk-acc-media"));
    if(!items.length) return;

    // карта: порядок DOM = порядок сверху вниз
    var map = items.map(function(item){
      var group = getGroup(item);
      return {
        item: item,
        group: group,
        key: keyOf(item),
        baseTop: getBaseTop(group),
        closedH: 0,
        openH: 0,
        gap: 14 // твой margin-bottom визуальный; если у тебя другой - можно поменять
      };
    });

    // фиксируем базовые top один раз (чтобы не уплывали)
    // и сортируем по baseTop (на всякий)
    map.sort(function(a,b){ return a.baseTop - b.baseTop; });

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

      // 1) выставляем высоты групп
      map.forEach(function(m, idx){
        var h = (idx === activeIndex) ? m.openH : m.closedH;
        if(h > 0) setGroupHeight(m.group, h);
      });

      // 2) считаем новые top "лесенкой" от baseTop первого
      var startTop = map[0].baseTop;
      var currentTop = startTop;

      map.forEach(function(m, idx){
        setGroupTop(m.group, currentTop);

        var h = (idx === activeIndex) ? m.openH : m.closedH;

        // расстояние между карточками - берём из реального margin-bottom item,
        // иначе дефолт 14
        var mb = num(getComputedStyle(m.item).marginBottom);
        if(!mb) mb = m.gap;

        currentTop += h + mb;
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

      // медиа: дефолт
      media.forEach(function(m){ m.classList.remove("is-active"); });
      var defMedia = media.find(function(m){ return keyOf(m) === k; }) || media[0];
      if(defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(title, k);

      requestAnimationFrame(applyLayout);
    }

    // init
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

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
      // при ресайзе переснимаем базовые top заново (Тильда может пересчитать)
      map.forEach(function(m){
        m.baseTop = getBaseTop(m.group);
      });
      map.sort(function(a,b){ return a.baseTop - b.baseTop; });
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
    var tries = 0, maxTries = 140, delay = 150;
    var timer = setInterval(function(){
      tries += 1;
      var ok = bootOnce();
      if(ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
