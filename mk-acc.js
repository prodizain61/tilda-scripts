(function () {
  function toArr(list){ return Array.prototype.slice.call(list || []); }

  function initOne(root){
    if(!root || root.__mkAccHeightInited) return;
    root.__mkAccHeightInited = true;

    var items = toArr(root.querySelectorAll(".mk-acc-item"));
    var media = toArr(root.querySelectorAll(".mk-acc-media"));
    if(!items.length) return;

    function keyOf(el){ return el ? el.getAttribute("data-acc") : null; }

    // считаем высоту закрытого состояния (только заголовок + padding)
    function setClosedHeight(item){
      if(!item) return;
      var title = item.querySelector(".mk-acc-title");
      if(!title) return;

      // временно убираем фикс высоты, чтобы корректно измерить
      item.style.height = "auto";

      var cs = window.getComputedStyle(item);
      var padT = parseFloat(cs.paddingTop) || 0;
      var padB = parseFloat(cs.paddingBottom) || 0;

      var h = title.offsetHeight + padT + padB;
      item.style.height = Math.ceil(h) + "px";
      item.dataset.closedH = String(Math.ceil(h));
    }

    // считаем высоту открытого состояния (весь контент)
    function setOpenHeight(item){
      if(!item) return;

      // раскрываем body для корректного измерения scrollHeight
      var body = item.querySelector(".mk-acc-body");
      var title = item.querySelector(".mk-acc-title");
      if(!title) return;

      // сброс высоты, чтобы взять натуральную
      item.style.height = "auto";

      var cs = window.getComputedStyle(item);
      var padT = parseFloat(cs.paddingTop) || 0;
      var padB = parseFloat(cs.paddingBottom) || 0;

      var bodyH = 0;
      if(body){
        // если body скрыт max-height 0, scrollHeight всё равно даст полную высоту контента
        bodyH = body.scrollHeight;
      }

      // margin-top body (20px) учтём явно
      var bodyMt = 0;
      if(body){
        bodyMt = parseFloat(window.getComputedStyle(body).marginTop) || 0;
      }

      var h = title.offsetHeight + bodyMt + bodyH + padT + padB;
      item.dataset.openH = String(Math.ceil(h));
      // возвращаем height в px для анимации
      item.style.height = Math.ceil(h) + "px";
    }

    function applyHeights(){
      items.forEach(function(item){
        // сначала посчитаем закрытую высоту
        setClosedHeight(item);

        // если активная - посчитаем открытую и применим
        if(item.classList.contains("is-active")){
          setOpenHeight(item);
        }
      });
    }

    function setActive(key){
      items.forEach(function(i){
        var on = keyOf(i) === key;
        i.classList.toggle("is-active", on);
      });

      media.forEach(function(m){
        m.classList.toggle("is-active", keyOf(m) === key);
      });

      // после смены класса - пересчитать и применить высоту
      // (чуть в timeout чтобы браузер успел применить классы)
      setTimeout(function(){
        items.forEach(function(item){
          if(item.classList.contains("is-active")) setOpenHeight(item);
          else setClosedHeight(item);
        });
      }, 0);
    }

    function closeToDefault(){
      // закрываем всё
      items.forEach(function(i){ i.classList.remove("is-active"); });

      // оставляем первое медиа активным (как у тебя было)
      var first = items[0];
      var k = keyOf(first) || "1";

      media.forEach(function(m){ m.classList.remove("is-active"); });
      var defMedia = media.find(function(m){ return keyOf(m) === k; }) || media[0];
      if(defMedia) defMedia.classList.add("is-active");

      setTimeout(function(){
        items.forEach(setClosedHeight);
      }, 0);
    }

    // init: откроем первый
    var defaultKey = keyOf(items[0]) || "1";
    setActive(defaultKey);

    // клик
    root.addEventListener("click", function(e){
      var item = e.target.closest(".mk-acc-item");
      if(!item || !root.contains(item)) return;

      var key = keyOf(item);
      if(!key) return;

      if(item.classList.contains("is-active")) closeToDefault();
      else setActive(key);
    }, true);

    // первичный расчёт и на ресайз
    applyHeights();
    window.addEventListener("resize", function(){
      // перерасчёт высот при адаптиве/переносах
      applyHeights();
    });
  }

  function boot(){
    var roots = toArr(document.querySelectorAll(".mk-acc"));
    if(!roots.length) return;
    roots.forEach(initOne);
  }

  if(document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
