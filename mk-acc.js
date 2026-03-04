(function () {
  if (window.__mkAccHeightPushV1) return;
  window.__mkAccHeightPushV1 = true;

  function toArr(list){ return Array.prototype.slice.call(list || []); }
  function pad2(n){ var s = String(n || ""); return s.length >= 2 ? s : "0" + s; }

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
    var chipText = "(" + pad2(key) + ")";
    els.heading.forEach(function(el){ el.textContent = title || ""; });
    els.chip.forEach(function(el){ el.textContent = chipText; });
  }

  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

  function getItemMetrics(item){
    var title = item.querySelector(".mk-acc-title");
    var body = item.querySelector(".mk-acc-body");
    if(!title) return { closedH: 122, openH: 122 };

    var csItem = getComputedStyle(item);
    var pt = parseFloat(csItem.paddingTop) || 0;
    var pb = parseFloat(csItem.paddingBottom) || 0;

    var titleH = title.getBoundingClientRect().height;

    var bodyMt = 0;
    var bodyH = 0;
    if(body){
      bodyMt = parseFloat(getComputedStyle(body).marginTop) || 0; // должно быть 20
      bodyH = body.scrollHeight || 0;
    }

    var closedH = Math.ceil(titleH + pt + pb);
    var openH = Math.ceil(titleH + bodyMt + bodyH + pt + pb);

    // страховка, чтобы не было "слишком мало"
    if (closedH < 80) closedH = 80;
    if (openH < closedH) openH = closedH;

    return { closedH: closedH, openH: openH };
  }

  function applyLayout(rec){
    var items = toArr(rec.querySelectorAll(".mk-acc-item"));
    if(!items.length) return;

    // актуальные размеры
    var metrics = items.map(function(item){
      var m = getItemMetrics(item);
      return {
        item: item,
        closedH: m.closedH,
        openH: m.openH
      };
    });

    var activeIndex = items.findIndex(function(i){ return i.classList.contains("is-active"); });
    if(activeIndex < 0) activeIndex = 0;

    var delta = metrics[activeIndex].openH - metrics[activeIndex].closedH;

    // 1) высоты
    metrics.forEach(function(m, idx){
      var h = (idx === activeIndex) ? m.openH : m.closedH;
      m.item.style.setProperty("--mk-h", h + "px");
    });

    // 2) раздвижение вниз (только те, что ниже активной)
    metrics.forEach(function(m, idx){
      var shift = (idx > activeIndex) ? delta : 0;
      m.item.style.setProperty("--mk-shift", shift + "px");
    });
  }

  function initOne(rec){
    if(!rec || rec.__mkAccInited) return;
    rec.__mkAccInited = true;

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

      media.forEach(function(m){
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      setGlobalHeader(title, key);
      requestAnimationFrame(function(){ applyLayout(rec); });
    }

    function closeToDefault(){
      var first = items[0];
      var k = keyOf(first) || "1";

      items.forEach(function(i){ i.classList.remove("is-active"); });

      // media default
      media.forEach(function(m){ m.classList.remove("is-active"); });
      var defMedia = media.find(function(m){ return keyOf(m) === k; }) || media[0];
      if(defMedia) defMedia.classList.add("is-active");

      var title = (first && first.getAttribute("data-title")) || "";
      setGlobalHeader(title, k);

      requestAnimationFrame(function(){ applyLayout(rec); });
    }

    // init default open first
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    // click delegate
    rec.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !rec.contains(item)) return;

      var key = keyOf(item);
      if(!key) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(key);
    }, true);

    // on resize recalc heights
    window.addEventListener("resize", function(){
      applyLayout(rec);
    });
  }

  function bootOnce(){
    var recs = toArr(document.querySelectorAll("#rec1932878341, #rec850499661"));
    if(!recs.length) return false;
    recs.forEach(initOne);
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

  if (document.readyState === "complete") bootWithRetry();
  else window.addEventListener("load", bootWithRetry);
})();
