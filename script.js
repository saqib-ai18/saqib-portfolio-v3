// Marquee: duplicate items so the loop is seamless
const track = document.querySelector('.track');
if (track) track.append(...[...track.children].map(n => n.cloneNode(true)));

// Highlight the nav link for the section in view
const links = [...document.querySelectorAll('.nav nav a')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main>section[id]').forEach(s => io.observe(s));

// Orbit: rings and particles circling the portrait
(() => {
  const el = document.getElementById('orbit');
  if (!window.THREE || !el) return;
  let r;
  try { r = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true }); } catch (e) { return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, 1, .1, 50), g = new THREE.Group();
  cam.position.z = 8.5; scene.add(g);

  const rings = [[2.9, 1.2, .3, 0x5fe3d9], [3.3, -.9, 1.1, 0xa78bfa], [3.1, .3, -.8, 0x5fe3d9]].map(([rad, rx, rz, col]) => {
    const pts = Array.from({ length: 129 }, (_, i) => { const a = i / 128 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0); });
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .95 }));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 16), new THREE.MeshBasicMaterial({ color: col }));
    dot.position.x = rad; line.add(dot); line.rotation.set(rx, 0, rz); g.add(line); return line;
  });

  const p = [];
  for (let i = 0; i < 1000; i++) {
    const rad = 2.4 + Math.random() * 1.1, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    p.push(rad * Math.sin(b) * Math.cos(a), rad * Math.sin(b) * Math.sin(a), rad * Math.cos(b));
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: .06, color: 0xbfe6ff, transparent: true, opacity: 1 })));

  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 2), new THREE.MeshBasicMaterial({ color: 0x5fe3d9, wireframe: true, transparent: true, opacity: .28 })));

  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const size = () => { const w = el.clientWidth; r.setSize(w, w, false); };
  addEventListener('resize', size); size();
  const draw = () => {
    if (!reduce) { g.rotation.y += .0025; rings.forEach((l, i) => (l.rotation.z += .004 * (i + 1))); }
    g.rotation.x += (my * .4 - g.rotation.x) * .05;
    g.rotation.z = scrollY * .0006;
    r.render(scene, cam);
    if (!reduce) requestAnimationFrame(draw);
  };
  draw();
})();

// Projects: live-demo button always visible, summary reveals on hover or focus (tap on touch screens)
document.querySelectorAll('.proj').forEach(card => {
  const body = card.lastElementChild, detail = document.createElement('div'), inner = document.createElement('div');
  detail.className = 'detail'; inner.className = 'inner';
  [...body.children].filter(n => n.matches('p:not(.cat), .stats')).forEach(n => inner.append(n));
  detail.append(inner); body.append(detail);
  card.classList.add('js-proj'); card.tabIndex = 0;
  card.addEventListener('click', e => {
    if (!matchMedia('(hover: hover)').matches && !e.target.closest('a')) card.classList.toggle('open');
  });
});

// Soft glow that follows the pointer (mouse devices, motion allowed)
if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const glow = document.createElement('div'); glow.className = 'cursor-glow'; document.body.append(glow);
  addEventListener('pointermove', e => { glow.style.transform = `translate(${e.clientX - 220}px, ${e.clientY - 220}px)`; });
}

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 3D tilt toward the pointer on cards, buttons and the photo
if (!calm && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.card, .edu, .facts li, .photo, .form, .links a, .btn, .link, .step, .proj').forEach(el => {
    const k = el.matches('.btn, .link') ? 10 : el.matches('.proj') ? 4 : 12;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(800px) rotateX(${-y * k}deg) rotateY(${x * k}deg) translateZ(8px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// 3D scroll: sections tip back and recede as they enter or leave the screen
if (!calm) {
  const secs = [...document.querySelectorAll('main>section')], clamp = v => Math.min(1, Math.max(0, v));
  let queued = false;
  const update = () => {
    queued = false;
    const vh = innerHeight;
    secs.forEach(s => {
      const r = s.getBoundingClientRect();
      const into = clamp((r.top - vh * .6) / (vh * .5)), out = clamp((vh * .4 - r.bottom) / (vh * .5));
      s.style.transform = `rotateX(${into * 14 - out * 8}deg) translateZ(${-(into + out) * 120}px)`;
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();
}

// Contact form: sends through FormSubmit, falls back to the visitor's email app
const form = document.getElementById('mailform'), note = document.getElementById('formnote');
form && form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const d = new FormData(form);
  if (d.get('_honey')) return;
  note.textContent = 'Sending...';
  try {
    const res = await fetch('https://formsubmit.co/ajax/saqibsaakii@gmail.com', { method: 'POST', headers: { Accept: 'application/json' }, body: d });
    const out = await res.json();
    if (!res.ok || String(out.success) !== 'true') throw new Error('send failed');
    note.textContent = 'Thanks, your message was sent. I’ll reply soon.'; form.reset();
  } catch {
    const body = encodeURIComponent(`${d.get('message')}\n\n${d.get('name')} (${d.get('email')})`);
    note.innerHTML = 'Could not send from this page. <a href="mailto:saqibsaakii@gmail.com?subject=Portfolio%20message&body=' + body + '">Send it from your email app</a> instead.';
  }
});

// v3: scroll progress, cards flying in from depth, hero parallax, fixed 3D background that you fly through
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.createElement('div'); bar.className = 'progress'; document.body.append(bar);
  const prog = () => Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
  const tick = () => { bar.style.transform = `scaleX(${prog()})`; };
  addEventListener('scroll', tick, { passive: true }); tick();
  if (calm) return;

  const items = document.querySelectorAll('.card, .facts li, .step, .proj, .tl li, .form, .links a, .edu, .two blockquote');
  items.forEach(el => { el.style.setProperty('--i', [...el.parentElement.children].indexOf(el) % 6); el.classList.add('rv'); });
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => seen.observe(el));

  const orb = document.querySelector('.orbit-wrap'), txt = document.querySelector('.hero-text');
  addEventListener('scroll', () => {
    const y = Math.min(scrollY, 900);
    if (orb) orb.style.translate = `0 ${y * .12}px ${-y * .35}px`;
    if (txt) txt.style.translate = `0 ${y * .05}px ${-y * .1}px`;
  }, { passive: true });

  if (!window.THREE) return;
  const cv = document.createElement('canvas'); cv.className = 'bg3d'; cv.setAttribute('aria-hidden', 'true'); document.body.prepend(cv);
  let r; try { r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); } catch (e) { cv.remove(); return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, .1, 120);
  const geos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TorusGeometry(1, .3, 8, 20), new THREE.BoxGeometry(1.4, 1.4, 1.4)];
  const shapes = Array.from({ length: 22 }, (_, i) => {
    const m = new THREE.Mesh(geos[i % 4], new THREE.MeshBasicMaterial({ color: i % 3 ? 0x5fe3d9 : 0xa78bfa, wireframe: true, transparent: true, opacity: .32 }));
    m.position.set((i % 2 ? 1 : -1) * (3 + Math.random() * 7), (Math.random() - .5) * 12, -i * 2.4);
    m.scale.setScalar(.6 + Math.random() * 1.2); sc.add(m); return m;
  });
  const pts = []; for (let i = 0; i < 500; i++) pts.push((Math.random() - .5) * 28, (Math.random() - .5) * 16, 6 - Math.random() * 60);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  sc.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: .07, color: 0xbfe6ff, transparent: true, opacity: .7 })));
  let mx = 0, my = 0, cz = 6;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  const size = () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  addEventListener('resize', size); size();
  const loop = () => {
    cz += ((6 - prog() * 54) - cz) * .06;
    cam.position.set(mx * 1.5, -my * 1, cz);
    shapes.forEach((m, i) => { m.rotation.x += .003 + (i % 3) * .001; m.rotation.y += .004; });
    r.render(sc, cam); requestAnimationFrame(loop);
  };
  loop();
})();
