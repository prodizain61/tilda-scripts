(function () {
  if (window.__mkAccRealAccordionV2) return;
  window.__mkAccRealAccordionV2 = true;

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

  function getItemHeights(item){
    var title = item.querySelector(".mk-acc-title");
    var body = item.querySelector(".mk-acc-body");

    var cs = getComputedStyle(item);
    var pt = parseFloat(cs.paddingTop) || 0;
    var pb = parseFloat(cs.paddingBottom) || 0;

    var titleH = title ? title.getBoundingClientRect().height : 0;

    var bodyMt = 0;
    var bodyH = 0;
    if(body){
      bodyMt = parseFloat(getComputedStyle(body).marginTop) || 0; // должно быть 20
      bodyH = body.scrollHeight || 0;
    }

    var closedH = Math.ceil(titleH + pt + pb);
    var openH = Math.ceil(titleH + bodyMt + bodyH + pt + pb);

    if (closedH < 80) closedH = 80;
    if (openH < closedH) openH = closedH;

    return { closedH: closedH, openH: openH };
  }

  function applyLayout(root){
    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    if(!items.length) return;

    var activeIndex = items.findIndex(function(i){ return i.classList.contains("is-active"); });
    if(activeIndex < 0) activeIndex = 0;

    var heights = items.map(function(item){ return getItemHeights(item); });
    var delta = heights[activeIndex].openH - heights[activeIndex].closedH;

    items.forEach(function(item, idx){
      var h = (idx === activeIndex) ? heights[idx].openH : heights[idx].closedH;
      item.style.setProperty("--mk-h", h + "px");

      var shift = (idx > activeIndex) ? delta : 0;
      item.style.setProperty("--mk-shift", shift + "px");
    });
  }

  function initOne(root){
    if(!root || root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
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

      requestAnimationFrame(function(){ applyLayout(root); });
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

      requestAnimationFrame(function(){ applyLayout(root); });
    }

    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    root.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !root.contains(item)) return;

      var key = keyOf(item);
      if(!key) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(key);
    }, true);

    window.addEventListener("resize", function(){
      applyLayout(root);
    });
  }

  function bootOnce(){
    var roots = toArr(document.querySelectorAll("#rec1932878341 .mk-acc, #rec850499661 .mk-acc"));
    if(!roots.length) return false;
    roots.forEach(initOne);
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
