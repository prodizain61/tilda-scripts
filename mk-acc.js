(function () {
  if (window.__mkAccStickyV1) return;
  window.__mkAccStickyV1 = true;

  const REC_IDS = ["rec1932878341", "rec850499661"];
  const EASE = "cubic-bezier(.16,1,.3,1)";

  const toArr = (x) => Array.prototype.slice.call(x || []);
  const px = (n) => Math.round(n) + "px";
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  function pad2(n){ n = String(n || ""); return n.length >= 2 ? n : "0" + n; }
  function pickTextNode(el){ return (el && (el.querySelector(".tn-atom") || el)) || null; }

  function getGlobalHeaderEls(){
    const headingSrc = toArr(document.querySelectorAll(".mk-acc-heading, [data-mk-heading]"));
    const chipSrc = toArr(document.querySelectorAll(".mk-acc-chip, [data-mk-chip]"));
    return {
      heading: headingSrc.map(pickTextNode).filter(Boolean),
      chip: chipSrc.map(pickTextNode).filter(Boolean)
    };
  }

  function setGlobalHeader(title, key){
    const els = getGlobalHeaderEls();
    els.heading.forEach((el) => el.textContent = title || "");
    els.chip.forEach((el) => el.textContent = "(" + pad2(key) + ")");
  }

  function setImp(el, prop, value){
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  }

  function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }
  function getGroup(item){
    return item.closest(".t396__group") || item.closest(".tn-group") || item;
  }

  function getBaseTop(group){
    const inlineTop = group.style.top ? num(group.style.top) : 0;
    if (inlineTop) return inlineTop;
    const dataTop = num(group.getAttribute("data-group-top-value"));
    if (dataTop) return dataTop;
    return num(getComputedStyle(group).top);
  }

  function setGroupHeight(group, h){
    const H = Math.max(0, Math.round(h));
    group.setAttribute("data-group-height-value", String(H));
    setImp(group, "height", px(H));
    setImp(group, "min-height", "0px");
    setImp(group, "max-height", "none");
    setImp(group, "overflow", "hidden");
    setImp(group, "will-change", "height, top");
    setImp(group, "transition", "height .75s " + EASE + ", top .75s " + EASE);
  }

  function setGroupTop(group, topPx){
    const T = Math.round(topPx);
    group.setAttribute("data-group-top-value", String(T));
    setImp(group, "top", px(T));
  }

  function getPaddings(item){
    const cs = getComputedStyle(item);
    return { pt: num(cs.paddingTop), pb: num(cs.paddingBottom) };
  }

  function measureClosedH(item){
    const title = item.querySelector(".mk-acc-title");
    if (!title) return 0;
    const pad = getPaddings(item);
    return Math.ceil(title.getBoundingClientRect().height + pad.pt + pad.pb);
  }

  function measureOpenH(item){
    const title = item.querySelector(".mk-acc-title");
    const body = item.querySelector(".mk-acc-body");
    if (!title) return 0;

    const pad = getPaddings(item);
    let bodyH = 0;
    let bodyMt = 0;

    if (body){
      bodyH = body.scrollHeight;
      bodyMt = num(getComputedStyle(body).marginTop); // у тебя должно быть 20px
    }

    return Math.ceil(title.getBoundingClientRect().height + bodyMt + bodyH + pad.pt + pad.pb);
  }

  function initRec(rec){
    if (!rec || rec.__mkAccStickyInited) return;
    rec.__mkAccStickyInited = true;

    const items = toArr(rec.querySelectorAll(".mk-acc-item"));
    const media = toArr(rec.querySelectorAll(".mk-acc-media"));
    if (!items.length) return;

    // Модель карточек
    const map = items.map((item) => {
      const group = getGroup(item);
      return {
        item,
        group,
        key: keyOf(item),
        baseTop: getBaseTop(group),
        closedH: 0,
        openH: 0
      };
    }).sort((a,b) => a.baseTop - b.baseTop);

    function recalc(){
      map.forEach((m) => {
        m.closedH = measureClosedH(m.item) || m.closedH || 0;
        m.openH = measureOpenH(m.item) || m.openH || m.closedH || 0;
      });
    }

    function applyLayout(){
      recalc();

      let activeIndex = map.findIndex((m) => m.item.classList.contains("is-active"));
      if (activeIndex < 0) activeIndex = 0;

      // высоты
      map.forEach((m, idx) => {
        const h = (idx === activeIndex) ? m.openH : m.closedH;
        if (h) setGroupHeight(m.group, h);
      });

      // tops лесенкой
      let curTop = map[0].baseTop;
      map.forEach((m, idx) => {
        setGroupTop(m.group, curTop);

        const h = (idx === activeIndex) ? m.openH : m.closedH;
        let mb = num(getComputedStyle(m.item).marginBottom);
        if (!mb) mb = 14;

        curTop += h + mb;
      });
    }

    // липкая поддержка: если Тильда перерисовала, мы вернем как надо
    let raf = 0;
    function schedule(){
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyLayout();
      });
    }

    // клики
    rec.addEventListener("click", (e) => {
      const item = e.target.closest(".mk-acc-item");
      if (!item || !rec.contains(item)) return;

      const k = keyOf(item);
      if (!k) return;

      if (item.classList.contains("is-active")){
        // close to default
        items.forEach((i) => i.classList.remove("is-active"));

        // дефолт: первое фото и тексты
        const first = items[0];
        const dk = keyOf(first) || "1";

        media.forEach((m) => m.classList.remove("is-active"));
        const defMedia = media.find((m) => keyOf(m) === dk) || media[0];
        if (defMedia) defMedia.classList.add("is-active");

        setGlobalHeader(first.getAttribute("data-title") || "", dk);
        schedule();
        return;
      }

      items.forEach((i) => i.classList.toggle("is-active", keyOf(i) === k));
      media.forEach((m) => m.classList.toggle("is-active", keyOf(m) === k));

      const activeItem = items.find((i) => keyOf(i) === k);
      setGlobalHeader((activeItem && activeItem.getAttribute("data-title")) || "", k);

      schedule();
    }, true);

    // init first open
    const first = items[0];
    const dk = keyOf(first) || "1";
    items.forEach((i) => i.classList.toggle("is-active", keyOf(i) === dk));
    schedule();

    // наблюдаем любые изменения от Тильды и возвращаем наши размеры
    const obs = new MutationObserver(schedule);
    obs.observe(rec, { attributes: true, subtree: true, attributeFilter: ["style", "data-group-height-value", "data-group-top-value"] });

    window.addEventListener("resize", () => {
      map.forEach((m) => m.baseTop = getBaseTop(m.group));
      map.sort((a,b) => a.baseTop - b.baseTop);
      schedule();
    });

    // подстраховка: первые 3 секунды часто идут пересчеты t396
    let t = 0;
    const timer = setInterval(() => {
      t += 1;
      schedule();
      if (t >= 20) clearInterval(timer);
    }, 150);
  }

  function boot(){
    let ok = false;
    REC_IDS.forEach((id) => {
      const rec = document.getElementById(id);
      if (rec) { initRec(rec); ok = true; }
    });
    return ok;
  }

  function bootRetry(){
    let tries = 0;
    const max = 140;
    const timer = setInterval(() => {
      tries += 1;
      const ok = boot();
      if (ok || tries >= max) clearInterval(timer);
    }, 150);
  }

  if (document.readyState === "complete") bootRetry();
  else window.addEventListener("load", bootRetry);
})();
