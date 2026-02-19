/* mk-acc.js
   Аккордион + смена медиа + обновление (01) и заголовка
   Разметка (важно):
   - На контейнер блока: class="mk-acc"
   - На каждый пункт: class="mk-acc-item" + data-acc="1|2|3" + data-title="Брендам одежды"
   - На каждую сцену медиа: class="mk-acc-media" + data-acc="1|2|3"
   - На текст с номером (01): атрибут data-mk-chip="1" (value любое)
   - На текст с заголовком: атрибут data-mk-heading="1" (value любое)

   Контент пункта (раскрывающаяся часть) желательно завернуть в отдельную группу
   и дать ей class="mk-acc-body" (или data-mk-body="1").
   Если тела нет, скрипт все равно будет менять активный пункт, медиа, heading/chip.
*/

(function () {
  "use strict";

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  const DUR = 520; // мягче, как Framer
  const FADE = 420;

  const SEL = {
    root: ".mk-acc",
    item: ".mk-acc-item",
    media: ".mk-acc-media",
    body: ".mk-acc-body, [data-mk-body]",
    heading: "[data-mk-heading]",
    chip: "[data-mk-chip]",
  };

  function pad2(n) {
    n = String(n || "");
    return n.length >= 2 ? n : "0" + n;
  }

  function qs(root, sel) {
    return root.querySelector(sel);
  }
  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function ensureMediaLayout(mediaEls) {
    if (!mediaEls.length) return;
    const parent = mediaEls[0].parentElement;
    if (!parent) return;

    // чтобы сцены лежали друг на друге
    const st = window.getComputedStyle(parent);
    if (st.position === "static") parent.style.position = "relative";

    mediaEls.forEach((el) => {
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.transition = `opacity ${FADE}ms ${EASE}, transform ${FADE}ms ${EASE}`;
      el.style.willChange = "opacity, transform";
    });
  }

  function setMedia(root, acc) {
    const scenes = qsa(root, SEL.media);
    if (!scenes.length) return;

    ensureMediaLayout(scenes);

    scenes.forEach((scene) => {
      const a = scene.getAttribute("data-acc");
      const isOn = String(a) === String(acc);

      if (isOn) {
        scene.style.opacity = "1";
        scene.style.pointerEvents = "auto";
        scene.style.transform = "translateY(0px)";
        scene.style.visibility = "visible";
      } else {
        scene.style.opacity = "0";
        scene.style.pointerEvents = "none";
        scene.style.transform = "translateY(8px)";
        scene.style.visibility = "hidden";
      }
    });
  }

  function updateHeadingChip(root, acc, title) {
    const h = qs(root, SEL.heading);
    const c = qs(root, SEL.chip);

    if (h) h.textContent = title || "";
    if (c) c.textContent = "(" + pad2(acc) + ")";
  }

  function getBody(item) {
    return item.querySelector(SEL.body);
  }

  function prepBody(body) {
    if (!body) return;
    body.style.overflow = "hidden";
    body.style.willChange = "max-height, opacity, transform";
    body.style.transition = [
      `max-height ${DUR}ms ${EASE}`,
      `opacity ${Math.min(DUR, 420)}ms ${EASE}`,
      `transform ${Math.min(DUR, 420)}ms ${EASE}`,
    ].join(", ");
  }

  function closeBody(body) {
    if (!body) return;
    prepBody(body);
    body.style.maxHeight = "0px";
    body.style.opacity = "0";
    body.style.transform = "translateY(-4px)";
  }

  function openBody(body) {
    if (!body) return;
    prepBody(body);

    // сначала в "почти открытое" состояние, потом поднимаем max-height до scrollHeight
    body.style.opacity = "1";
    body.style.transform = "translateY(0px)";

    // max-height анимируется только если известна высота
    body.style.maxHeight = "0px";
    requestAnimationFrame(() => {
      const h = body.scrollHeight || 0;
      body.style.maxHeight = h + "px";
    });
  }

  function normalizeItems(root) {
    const items = qsa(root, SEL.item);
    items.forEach((item) => {
      const body = getBody(item);
      if (body) prepBody(body);
    });
    return items;
  }

  function setActive(root, items, acc, opts) {
    const keepOpen = !!(opts && opts.keepOpen);
    const target = items.find((it) => String(it.getAttribute("data-acc")) === String(acc));

    // если клик по активному и toggle включен, то закрываем
    const alreadyActive = target && target.classList.contains("is-active");
    const shouldClose = alreadyActive && !keepOpen && opts && opts.toggle === true;

    items.forEach((it) => {
      const isTarget = it === target;
      const body = getBody(it);

      if (isTarget && !shouldClose) {
        it.classList.add("is-active");
        openBody(body);
      } else {
        it.classList.remove("is-active");
        closeBody(body);
      }
    });

    if (target && !shouldClose) {
      const title = target.getAttribute("data-title") || "";
      updateHeadingChip(root, acc, title);
      setMedia(root, acc);
    }
  }

  function initRoot(root) {
    const items = normalizeItems(root);
    if (!items.length) return;

    // Выбираем стартовый пункт:
    // 1) тот, что уже is-active
    // 2) иначе первый по data-acc
    let start = items.find((it) => it.classList.contains("is-active")) || items[0];
    const startAcc = start.getAttribute("data-acc") || "1";

    // Принудительно приводим к нормальному состоянию (чтобы не были все раскрыты)
    setActive(root, items, startAcc, { keepOpen: true, toggle: true });

    // Клик по пунктам
    root.addEventListener("click", (e) => {
      const item = e.target.closest(SEL.item);
      if (!item || !root.contains(item)) return;

      const acc = item.getAttribute("data-acc");
      if (!acc) return;

      setActive(root, items, acc, { toggle: true });
    });
  }

  function boot() {
    const roots = qsa(document, SEL.root);
    roots.forEach(initRoot);
  }

  // Tilda иногда дорисовывает DOM после ready, поэтому делаем 2 прохода
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      boot();
      setTimeout(boot, 400);
      setTimeout(boot, 1200);
    });
  } else {
    boot();
    setTimeout(boot, 400);
    setTimeout(boot, 1200);
  }
})();
