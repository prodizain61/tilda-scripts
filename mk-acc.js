(function () {
  function qsa(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function init(root) {
    // защита от повторной инициализации
    if (root.__mkAccInited) return;
    root.__mkAccInited = true;

    var items = qsa(root, '.mk-acc-item');
    var media = qsa(root, '.mk-acc-media');
    var chipEl = root.querySelector('.mk-acc-chip');
    var headingEl = root.querySelector('.mk-acc-heading');

    // если нет связки, выходим
    if (!items.length || !media.length) return;

    function keyOf(el) {
      return el.getAttribute('data-acc');
    }

    var defaultItem = items[0];
    var defaultKey = keyOf(defaultItem) || '1';
    var defaultTitle = defaultItem.getAttribute('data-title') || '';

    function setLeftHeader(title, key) {
      if (headingEl) headingEl.textContent = title || '';
      if (chipEl) {
        var n = String(key || '').padStart(2, '0');
        chipEl.textContent = '(' + n + ')';
      }
    }

    function setActive(key) {
      var activeItem = items.find(function (i) { return keyOf(i) === key; });
      if (!activeItem) return;

      items.forEach(function (i) {
        i.classList.toggle('is-active', keyOf(i) === key);
      });

      media.forEach(function (m) {
        m.classList.toggle('is-active', keyOf(m) === key);
      });

      setLeftHeader(activeItem.getAttribute('data-title') || '', key);
    }

    function closeAll() {
      items.forEach(function (i) { i.classList.remove('is-active'); });
      media.forEach(function (m) { m.classList.remove('is-active'); });

      setLeftHeader(defaultTitle, defaultKey);

      var defMedia = media.find(function (m) { return keyOf(m) === defaultKey; }) || media[0];
      if (defMedia) defMedia.classList.add('is-active');
    }

    // стартовое состояние
    setActive(defaultKey);

    // клики
    items.forEach(function (i) {
      i.addEventListener('click', function () {
        var key = keyOf(i);
        if (!key) return;

        if (i.classList.contains('is-active')) {
          closeAll(); // toggle закрывает
          return;
        }
        setActive(key);
      });
    });
  }

  function bootOnce() {
    var roots = document.querySelectorAll('.mk-acc');
    if (!roots.length) return false;

    roots.forEach(function (root) { init(root); });
    return true;
  }

  function bootWithRetry() {
    var tries = 0;
    var maxTries = 40;     // 40 * 150мс = 6 секунд
    var delay = 150;

    var timer = setInterval(function () {
      tries += 1;
      var ok = bootOnce();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, delay);
  }

  // запускаем после полной загрузки и с ретраями
  if (document.readyState === 'complete') {
    bootWithRetry();
  } else {
    window.addEventListener('load', bootWithRetry);
  }
})();
