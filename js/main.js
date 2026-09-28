/* DILMAR – interakcije i animacije */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- godine tradicije + godina u podnožju ---------- */
  const now = new Date();
  const founded = new Date(1997, 11, 16);
  let years = now.getFullYear() - 1997;
  if (now < new Date(now.getFullYear(), 11, 16)) years--;
  $$('[data-years]').forEach(el => { el.dataset.count = years; el.textContent = years; });
  $$('[data-year]').forEach(el => { el.textContent = now.getFullYear(); });

  /* ---------- split naslova na riječi ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--d', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ---------- loader ---------- */
  const loader = $('.loader');
  const start = performance.now();
  const ready = () => body.classList.add('is-ready');
  const finishLoader = () => {
    body.classList.remove('is-loading');
    if (!loader) { ready(); return; }
    if (reduced || store.get('dilmar-seen')) {
      loader.classList.add('is-quick'); ready();
    } else {
      loader.classList.add('is-done');
      setTimeout(ready, 520);
    }
    store.set('dilmar-seen', '1');
    setTimeout(() => loader.remove(), 1600);
  };
  const firstPlate = $('.plate');
  const imgReady = new Promise(res => {
    if (!firstPlate || firstPlate.complete) return res();
    firstPlate.addEventListener('load', res, { once: true });
    firstPlate.addEventListener('error', res, { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minTime = (reduced || store.get('dilmar-seen')) ? 0 : 1700;
  Promise.race([
    Promise.all([imgReady, fontsReady]),
    new Promise(r => setTimeout(r, 3200))
  ]).then(() => setTimeout(finishLoader, Math.max(0, minTime - (performance.now() - start))));

  /* ---------- header ---------- */
  const header = $('#header');
  let lastY = scrollY;

  /* ---------- mobilni izbornik ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    body.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open'))); header.classList.remove('is-hidden'); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 800); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- aktivni link u navigaciji ---------- */
  const navLinks = $$('.nav a');
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['o-nama', 'proizvodi', 'tradicija', 'partneri', 'kontakt'].forEach(id => { const s = document.getElementById(id); s && secIO.observe(s); });

  /* ---------- pozornica (hero karusel) ---------- */
  const stage = $('#stage');
  if (stage) {
    const plates = $$('.plate', stage);
    const nameEl = $('.stage__name', stage), descEl = $('.stage__desc', stage), textEl = $('.stage__text', stage);
    const numEl = $('.stage__num b', stage), totEl = $('.stage__num i', stage);
    const dotsWrap = $('.stage__dots', stage), ringWrap = $('.stage__ringwrap', stage);
    const DUR = 5500;
    let cur = 0, timer = null, remaining = DUR, startedAt = 0, paused = false, heroVisible = true, ringA = 0;
    stage.style.setProperty('--dur', DUR + 'ms');
    totEl.textContent = String(plates.length).padStart(2, '0');
    const dots = plates.map((p, i) => {
      const b = document.createElement('button');
      b.className = 'stage__dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', p.dataset.name);
      b.addEventListener('click', () => go(i, i > cur ? 1 : -1));
      dotsWrap.appendChild(b);
      return b;
    });
    // lazy slike učitaj odmah nakon prve
    plates.slice(1).forEach(p => { p.loading = 'eager'; });

    const ease = 'cubic-bezier(.19,.8,.22,1)';
    function go(n, dir = 1) {
      n = (n + plates.length) % plates.length;
      if (n === cur) return;
      const out = plates[cur], inn = plates[n];
      [out, inn].forEach(el => el.getAnimations().forEach(a => a.cancel()));
      out.classList.remove('is-active');
      inn.classList.add('is-active');
      if (!reduced) {
        out.animate([
          { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${-50 - 55 * dir}%,-42%) rotate(${-22 * dir}deg) scale(.7)`, opacity: 0 }
        ], { duration: 750, easing: 'cubic-bezier(.55,0,.75,.3)' });
        inn.animate([
          { transform: `translate(${-50 + 55 * dir}%,-58%) rotate(${22 * dir}deg) scale(.7)`, opacity: 0 },
          { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 }
        ], { duration: 1150, delay: 160, easing: ease, fill: 'backwards' });
        ringA += 40 * dir;
        ringWrap.style.setProperty('--ra', ringA + 'deg');
      }
      cur = n;
      numEl.textContent = String(n + 1).padStart(2, '0');
      nameEl.textContent = inn.dataset.name;
      descEl.textContent = inn.dataset.desc;
      textEl.classList.remove('is-swap'); void textEl.offsetWidth; textEl.classList.add('is-swap');
      dots.forEach((d, i) => { d.classList.toggle('is-active', i === n); d.setAttribute('aria-selected', i === n); });
      restart();
    }
    function schedule(ms) { clearTimeout(timer); startedAt = performance.now(); remaining = ms; timer = setTimeout(() => go(cur + 1, 1), ms); }
    function restart() { remaining = DUR; if (!paused && heroVisible && !reduced) schedule(DUR); }
    function pause() { if (paused) return; paused = true; clearTimeout(timer); remaining -= performance.now() - startedAt; stage.classList.add('is-paused'); }
    function resume() { if (!paused) return; paused = false; stage.classList.remove('is-paused'); if (heroVisible && !reduced) schedule(Math.max(400, remaining)); }

    $('.stage__btn--next', stage).addEventListener('click', () => go(cur + 1, 1));
    $('.stage__btn--prev', stage).addEventListener('click', () => go(cur - 1, -1));
    if (matchMedia('(hover: hover)').matches) {
      stage.addEventListener('mouseenter', pause);
      stage.addEventListener('mouseleave', resume);
    }
    // swipe
    let sx = 0, sy = 0, tracking = false;
    stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; tracking = true; sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', e => {
      if (!tracking) return; tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
    stage.addEventListener('pointercancel', () => { tracking = false; });
    stage.tabIndex = 0;
    stage.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') go(cur + 1, 1);
      if (e.key === 'ArrowLeft') go(cur - 1, -1);
    });
    // pauza kad hero nije vidljiv / kartica skrivena
    new IntersectionObserver(([en]) => {
      heroVisible = en.isIntersecting;
      if (!heroVisible) { clearTimeout(timer); stage.classList.add('is-paused'); }
      else if (!paused) { stage.classList.remove('is-paused'); schedule(Math.max(400, remaining)); }
    }, { threshold: .15 }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });
    // miš – lagani parallax
    const hero = $('.hero');
    if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty('--mx', (x * 26).toFixed(1) + 'px');
        stage.style.setProperty('--my', (y * 18).toFixed(1) + 'px');
      });
      hero.addEventListener('pointerleave', () => { stage.style.setProperty('--mx', '0px'); stage.style.setProperty('--my', '0px'); });
    }
    const kick = () => { if (!reduced) schedule(DUR); };
    if (body.classList.contains('is-ready')) kick(); else {
      const mo = new MutationObserver(() => { if (body.classList.contains('is-ready')) { mo.disconnect(); kick(); } });
      mo.observe(body, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ---------- reveal na scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    let k = 0;
    entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left).forEach(en => {
      const el = en.target;
      if (el.hasAttribute('data-reveal')) el.style.setProperty('--rd', (k++ * 90) + 'ms');
      el.classList.add('is-in');
      revealIO.unobserve(el);
      if (el.dataset.count !== undefined) countUp(el);
      $$('[data-count]', el).forEach(countUp);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-reveal], [data-split], .smoke__frame').forEach(el => revealIO.observe(el));

  /* ---------- brojači ---------- */
  function countUp(el) {
    if (el.dataset.counted) return; el.dataset.counted = '1';
    const to = +el.dataset.count, from = el.dataset.from ? +el.dataset.from : 0;
    if (reduced) { el.textContent = to; return; }
    const dur = 1800, t0 = performance.now();
    const tick = t => {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- filteri proizvoda ---------- */
  const filters = $('.filters');
  const pill = $('.filters__pill');
  const chips = $$('.chip');
  const cards = $$('.card');
  const movePill = chip => {
    pill.style.width = chip.offsetWidth + 'px';
    pill.style.transform = `translate(${chip.offsetLeft}px, ${chip.offsetTop}px)`;
  };
  const activeChip = () => chips.find(c => c.classList.contains('is-active'));
  requestAnimationFrame(() => movePill(activeChip()));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => movePill(activeChip()));
  addEventListener('resize', () => movePill(activeChip()));
  chips.forEach(chip => chip.addEventListener('click', () => {
    if (chip.classList.contains('is-active')) return;
    chips.forEach(c => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-selected', c === chip); });
    movePill(chip);
    filters.scrollTo({ left: chip.offsetLeft - filters.clientWidth / 2 + chip.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
    const f = chip.dataset.filter;
    const show = cards.filter(c => f === 'all' || c.dataset.cat === f);
    const visibleNow = cards.filter(c => !c.classList.contains('is-hidden'));
    const outs = visibleNow.filter(c => !show.includes(c));
    const doIn = () => {
      cards.forEach(c => c.classList.toggle('is-hidden', !show.includes(c)));
      if (reduced) return;
      show.forEach((c, i) => c.animate([
        { opacity: 0, transform: 'translateY(24px) scale(.97)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 700, delay: Math.min(i, 10) * 45, easing: 'cubic-bezier(.19,.8,.22,1)', fill: 'backwards' }));
    };
    if (reduced || !outs.length) return doIn();
    const anims = visibleNow.map(c => c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }));
    Promise.all(anims.map(a => a.finished)).then(() => { anims.forEach(a => a.cancel()); doIn(); });
  }));

  /* ---------- detalji proizvoda (dialog) ---------- */
  const DATA = JSON.parse($('#products-data').textContent);
  const sheet = $('#sheet');
  const sImg = $('.sheet__media img', sheet), sCat = $('.sheet__cat', sheet), sTitle = $('.sheet__title', sheet);
  const sPrep = $('.sheet__prep', sheet), sText = $('.sheet__text', sheet), sCta = $('.sheet__cta', sheet);
  let currentProduct = null;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function openSheet(id) {
    const p = DATA[id]; if (!p) return;
    currentProduct = p;
    sImg.src = `img/p/${id}.webp`; sImg.alt = 'Dilmar – ' + p.name.toLowerCase();
    sCat.textContent = p.cat; sTitle.textContent = p.name;
    sPrep.innerHTML = p.prep.map(t => { const [ico, label] = t.split('|'); return `<span class="tag"><svg class="ico"><use href="#i-${ico}"/></svg>Priprema: ${esc(label.toLowerCase())}</span>`; }).join('');
    const paras = p.long.length ? p.long : [p.short];
    sText.innerHTML = paras.map(t => `<p>${esc(t)}</p>`).join('');
    sheet.classList.remove('is-closing');
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    body.classList.add('menu-open');
    const scroller = $('.sheet__body', sheet); scroller.scrollTop = 0; $('.sheet__inner', sheet).scrollTop = 0;
  }
  function closeSheet() {
    if (!sheet.open) return;
    if (reduced) { sheet.close(); return; }
    sheet.classList.add('is-closing');
    setTimeout(() => { sheet.classList.remove('is-closing'); sheet.close(); }, 330);
  }
  sheet.addEventListener('close', () => body.classList.remove('menu-open'));
  sheet.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  $('.sheet__close', sheet).addEventListener('click', closeSheet);
  sCta.addEventListener('click', e => {
    e.preventDefault();
    const subj = $('#form [name="naslov"]');
    if (subj && currentProduct) subj.value = 'Upit za proizvod: ' + currentProduct.name;
    closeSheet();
    setTimeout(() => $('#kontakt').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 360);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) { e.preventDefault(); openSheet(b.dataset.open); }
  });

  /* ---------- obrazac → e-mail ---------- */
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('.form__msg', form);
    let ok = true;
    $$('input, textarea', form).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = 'Molimo, ispunite sva polja prije slanja upita.'; return; }
    const v = n => form.elements[n].value.trim();
    const bodyTxt = `${v('poruka')}\n\n—\n${v('ime')}\n${v('email')}`;
    location.href = `mailto:info@dilmar.hr?subject=${encodeURIComponent(v('naslov'))}&body=${encodeURIComponent(bodyTxt)}`;
    msg.textContent = 'Otvaramo vašu aplikaciju za e-poštu… Hvala na upitu!';
  });
  $$('.field input, .field textarea').forEach(f => f.addEventListener('input', () => f.closest('.field').classList.remove('is-invalid')));

  /* ---------- dim (canvas) ---------- */
  const canvas = $('.smoke__canvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
    const sc = sprite.getContext('2d');
    const g = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(235,225,215,.55)'); g.addColorStop(.45, 'rgba(220,210,200,.2)'); g.addColorStop(1, 'rgba(220,210,200,0)');
    sc.fillStyle = g; sc.fillRect(0, 0, 128, 128);
    let W = 0, H = 0, parts = [], running = false, raf = 0;
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (y) => ({ x: Math.random() * W, y: y ?? H + 40, r: 40 + Math.random() * 70, vy: .25 + Math.random() * .45, vx: (Math.random() - .5) * .25, a: 0, life: 0, max: 380 + Math.random() * 300, ph: Math.random() * 6.28 });
    const init = () => { size(); parts = Array.from({ length: 34 }, () => { const p = spawn(Math.random() * H); p.life = Math.random() * p.max; return p; }); };
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      parts.forEach((p, i) => {
        p.life++; p.y -= p.vy; p.ph += .01; p.x += p.vx + Math.sin(p.ph) * .3; p.r += .12;
        const t = p.life / p.max;
        p.a = t < .2 ? t / .2 : 1 - (t - .2) / .8;
        if (t >= 1 || p.y < -p.r) parts[i] = spawn();
        ctx.globalAlpha = clamp(p.a, 0, 1) * .32;
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      });
      if (running) raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { if (!W) init(); running = true; loop(); }
      else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
    addEventListener('resize', () => { if (W) size(); });
  }

  /* ---------- priča: aktivni korak ---------- */
  const steps = $$('.step');
  const stepNum = $('.story__step');
  const stepIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      steps.forEach(s => s.classList.toggle('is-active', s === en.target));
      if (stepNum) stepNum.textContent = String(en.target.dataset.step).padStart(2, '0');
    });
  }, { rootMargin: '-42% 0px -42% 0px' });
  steps.forEach(s => stepIO.observe(s));
  if (steps[0]) steps[0].classList.add('is-active');

  /* ---------- scroll efekti (jedan rAF) ---------- */
  const parallax = $$('[data-parallax]');
  const tlLine = $('.timeline__line span'), timeline = $('[data-timeline]');
  const storySec = $('.story'), storyPlate = $('.story__plate img');
  const fab = $('.fab'), hero = $('.hero'), footer = $('.footer'), giant = $('.footer__giant');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    // header
    header.classList.toggle('is-scrolled', y > 20);
    if (!body.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > 500) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 500) header.classList.remove('is-hidden');
    }
    lastY = y;
    // fab
    if (fab) {
      const fr = footer.getBoundingClientRect().top;
      fab.classList.toggle('is-visible', y > hero.offsetHeight * .75 && fr > vh - 40);
    }
    if (reduced) return;
    parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.translate = `0 ${(c * +el.dataset.parallax).toFixed(1)}px`;
    });
    if (timeline && tlLine) {
      const r = timeline.getBoundingClientRect();
      const vertical = innerWidth <= 560;
      const p = vertical ? (vh * .75 - r.top) / r.height : (vh * .9 - r.top) / (vh * .45);
      tlLine.parentElement.style.setProperty('--p', clamp(p, 0, 1).toFixed(3));
    }
    if (storySec && storyPlate) {
      const r = storySec.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp((vh - r.top) / (r.height + vh), 0, 1);
        storyPlate.style.setProperty('--rot', (p * 150 - 60).toFixed(1) + 'deg');
        storyPlate.style.setProperty('--sc', (0.9 + Math.sin(p * Math.PI) * .12).toFixed(3));
      }
    }
    if (giant) {
      const r = footer.getBoundingClientRect();
      const p = clamp((vh - r.top) / r.height, 0, 1);
      giant.style.setProperty('--gy', ((1 - p) * 60).toFixed(1) + '%');
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
