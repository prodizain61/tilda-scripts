(function(){
  function qsa(root, sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  function init(root){
    var items = qsa(root, '.mk-acc-item');
    var media = qsa(root, '.mk-acc-media');
    var chipEl = root.querySelector('.mk-acc-chip');
    var headingEl = root.querySelector('.mk-acc-heading');

    if(!items.length || !media.length) return;

    function keyOf(el){ return el.getAttribute('data-acc'); }

    var defaultItem = items[0];
    var defaultKey = keyOf(defaultItem) || '1';
    var defaultTitle = defaultItem.getAttribute('data-title') || '';

    function setLeftHeader(title, key){
      if(headingEl) headingEl.textContent = title || '';
      if(chipEl){
        var n = String(key || '').padStart(2,'0');
        chipEl.textContent = '(' + n + ')';
      }
    }

    function setActive(key){
      var activeItem = items.find(function(i){ return keyOf(i) === key; });
      if(!activeItem) return;

      items.forEach(function(i){
        i.classList.toggle('is-active', keyOf(i) === key);
      });

      media.forEach(function(m){
        m.classList.toggle('is-active', keyOf(m) === key);
      });

      setLeftHeader(activeItem.getAttribute('data-title') || '', key);
    }

    function closeAll(){
      items.forEach(function(i){ i.classList.remove('is-active'); });
      media.forEach(function(m){ m.classList.remove('is-active'); });

      setLeftHeader(defaultTitle, defaultKey);

      var defMedia = media.find(function(m){ return keyOf(m) === defaultKey; }) || media[0];
      if(defMedia) defMedia.classList.add('is-active');
    }

    setActive(defaultKey);

    items.forEach(function(i){
      i.addEventListener('click', function(){
        var key = keyOf(i);
        if(!key) return;

        if(i.classList.contains('is-active')){
          closeAll();
          return;
        }
        setActive(key);
      });
    });
  }

  function boot(){
    document.querySelectorAll('.mk-acc').forEach(function(root){
      init(root);
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
