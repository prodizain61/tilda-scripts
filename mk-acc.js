(function(){
  function init(root){
    const items = Array.from(root.querySelectorAll('.mk-acc-item'));
    const media = Array.from(root.querySelectorAll('.mk-acc-media'));
    const chipEl = root.querySelector('.mk-acc-chip, [data-mk-chip]');
    const headingEl = root.querySelector('.mk-acc-heading, [data-mk-heading]');
    if(!items.length || !media.length) return;

    const keyOf = (el) => el.getAttribute('data-acc');

    const defaultItem = items[0];
    const defaultTitle = defaultItem ? (defaultItem.getAttribute('data-title') || '') : '';
    const defaultKey = defaultItem ? (keyOf(defaultItem) || '1') : '1';

    function setLeftHeader(title, key){
      if(headingEl) headingEl.textContent = title || '';
      if(chipEl) chipEl.textContent = '(' + String(key || '').padStart(2,'0') + ')';
    }

    function setActive(key){
      const activeItem = items.find(i => keyOf(i) === key);
      if(!activeItem) return;

      items.forEach(i => i.classList.toggle('is-active', keyOf(i) === key));
      media.forEach(m => m.classList.toggle('is-active', keyOf(m) === key));

      setLeftHeader(activeItem.getAttribute('data-title') || '', key);
    }

    function closeAll(){
      items.forEach(i => i.classList.remove('is-active'));
      media.forEach(m => m.classList.remove('is-active'));

      setLeftHeader(defaultTitle, defaultKey);

      const defaultMedia = media.find(m => keyOf(m) === defaultKey) || media[0];
      if(defaultMedia) defaultMedia.classList.add('is-active');
    }

    // старт: открыт первый пункт
    setActive(defaultKey);

    items.forEach(i=>{
      i.addEventListener('click', ()=>{
        const key = keyOf(i);
        if(!key) return;

        if(i.classList.contains('is-active')){
          closeAll(); // toggle close
          return;
        }
        setActive(key);
      });
    });
  }

  function boot(){
    document.querySelectorAll('.mk-acc').forEach(init);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();
