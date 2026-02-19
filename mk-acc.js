/* mk-acc.js
   Рабочий для Tilda Zero:
   - Переключает active пункт (is-active)
   - Меняет медиа сцены (mk-acc-media по data-acc)
   - Обновляет (01) и заголовок глобально (data-mk-chip / data-mk-heading)
   - Делает аккордеон, если есть mk-acc-body (или data-mk-body)

   Разметка:
   1) Корень блока: mk-acc
   2) Пункты: mk-acc-item + data-acc="1|2|3" + data-title="..."
   3) Медиа: mk-acc-media + data-acc="1|2|3"
   4) Чип: data-mk-chip="1" (value любое)
   5) Заголовок: data-mk-heading="1" (value любое)
   6) Тело аккордеона: mk-acc-body (или data-mk-body="1") внутри каждого mk-acc-item
*/

(function () {
  "use strict";

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  const DUR = 560;

  const SEL = {
    root: ".mk-acc",
    item: ".mk-acc-item",
    media: ".mk-acc-media",
    body: ".mk-acc-body, [data-mk-body]",
    headingAll: "[data-mk-heading]",
    chipAll: "[data-mk-chip]",
  };

  function pad2(n) {
    const s = String(n || "");
    return s.length >= 2 ? s : "0" + s;
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function setGlobalHeadingChip(acc, title) {
    const heads = qsa(document, SEL.headingAll);
    const chips = qsa(document, SEL.chipAll);

    heads.forEach((el) => (el.textContent = title || ""));
    chips.forEach((el) => (el.textContent = "(" + pad2(acc) + ")"));
  }

  function ensureMediaStack(mediaEls) {
    if (!mediaEls.length) return;
    const parent = mediaEls[0].parentElement;
    if (!parent) return;

    const st = window.getComputedStyle(parent);
    if (st.position === "static") parent.style.position = "relative";

    mediaEls.forEach((el) => {
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.transition = `opacity ${DUR}ms ${EASE}, transform ${DUR}ms ${EASE}`;
      el.style.willChange = "opacity, transform";
    });
  }

  function setMedia(root, acc) {
    const scenes = qsa(root, SEL.media);
    if (!scenes.length) return;

    ensureMediaStack(scenes);

    scenes.forEach((scene) => {
      const a = scene.getAttribute("data-acc");
      const on = String(a) === String(acc);

      if (on) {
        scene.style.opacity = "1";
        scene.style.transform = "translateY(0px)";
        scene.style.pointerEvents = "auto";
        scene.style.visibility = "visible";
      } else {
        scene.style.opacity = "0";
        scene.style.transform = "translateY(8px)";
        scene.style.pointerEvents = "none";
        scene.style.visibility = "hidden";
      }
    });
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
    body.style.opacity = "1";
    body.style.transform = "translateY(0px)";
    body.style.maxHeight = "0px";
    requestAnimationFrame(() => {
      body.style.maxHeight = (body.scrollHeight || 0) + "px";
    });
  }

  function setActive(root, acc, toggleIfActive) {
    const items = qsa(root, SEL.item);
    if (!items.length) return;

    const target = items.find((it) => String(it.getAttribute("data-acc")) === String(acc));
    if (!target) return;

    const wasActive = target.classList.contains("is-active");
    const shouldClose = toggleIfActive && wasActive;

    items.forEach((it) => {
      const body = it.querySelector(SEL.body);

      if (!shouldClose && it === target) {
        it.classList.add("is-active");
        openBody(body);
      } else {
        it.classList.remove("is-active");
        closeBody(body);
      }
    });

    // медиа и заголовки обновляем только при открытии
    if (!shouldClose) {
      const title = target.getAttribute("data-title") || "";
      setGlobalHeadingChip(acc, title);
      setMedia(root, acc);
    }
  }

  function initRoot(root) {
    if (!root || root.__mkInited) return;
    root.__mkInited = true;

    // закрываем все тела на старте, чтобы не было "все раскрыто"
    qsa(root, SEL.item).forEach((it) => closeBody(it.querySelector(SEL.body)));

    // стартовое: первый пункт
    const first = root.querySelector(SEL.item);
    const startAcc = (first && first.getAttribute("data-acc")) || "1";
    setActive(root, startAcc, false);

    // делегирование клика внутри блока
    root.addEventListener("click", (e) => {
      const item = e.target.closest(SEL.item);
      if (!item || !root.contains(item)) return;

      const acc = item.getAttribute("data-acc");
      if (!acc) return;

      setActive(root, acc, true);
    });
  }

  function boot() {
    qsa(document, SEL.root).forEach(initRoot);
  }

  // Tilda может дорисовывать DOM позже, поэтому несколько проходов
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      boot();
      setTimeout(boot, 300);
      setTimeout(boot, 900);
      setTimeout(boot, 1600);
    });
  } else {
    boot();
    setTimeout(boot, 300);
    setTimeout(boot, 900);
    setTimeout(boot, 1600);
  }
})();
