// Motion layer for tempohub.shop: hero flow field, wordmark intro, staggered
// reveals, card spotlight, scroll progress, click sparks, stat pops.
// Pure decoration - if this file fails to load, nothing on the page breaks.
(() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------- wordmark letters
  const word = document.querySelector(".wordmark");
  if (word && !calm) {
    let i = 0;
    const split = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of n.textContent) {
            const s = document.createElement("span");
            s.className = "ch";
            s.style.setProperty("--i", i++);
            s.textContent = c;
            frag.append(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("wm-hub")) split(n);
      }
    };
    split(word);
  }

  // ---------------------------------------------- stagger siblings that reveal together
  const groups = new Map();
  for (const el of $$(".reveal")) {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  }
  for (const list of groups.values()) {
    if (list.length > 1) list.forEach((el, n) => el.style.setProperty("--d", Math.min(n, 6) * 90 + "ms"));
  }

  // ---------------------------------------------- spotlight that follows the cursor
  const spots = $$(".gcard, .plan, .exi, .ex, .step, .clip, .faq details");
  for (const el of spots) {
    el.classList.add("spot");
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--mx", "-500px");
      el.style.setProperty("--my", "-500px");
    });
  }

  // ---------------------------------------------- scroll progress in the nav
  // Only on a nav that stays on screen: on a static nav the bar has nothing to
  // sit under and floats across the page.
  const nav = document.querySelector("nav");
  const pinned = nav && /sticky|fixed/.test(getComputedStyle(nav).position);
  if (pinned && !calm) {
    const bar = document.createElement("div");
    bar.className = "progress";
    nav.append(bar);
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------------------------------------------- sparks on the buy buttons
  if (!calm) {
    document.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".btn-primary, [data-buy], [data-paypal]");
      if (!b) return;
      for (let n = 0; n < 14; n++) {
        const s = document.createElement("i");
        s.className = "spark";
        const a = (Math.PI * 2 * n) / 14 + Math.random() * 0.4;
        const d = 40 + Math.random() * 50;
        s.style.left = e.clientX - 3 + "px";
        s.style.top = e.clientY - 3 + "px";
        s.style.setProperty("--dx", Math.cos(a) * d + "px");
        s.style.setProperty("--dy", Math.sin(a) * d + "px");
        document.body.append(s);
        setTimeout(() => s.remove(), 800);
      }
    });
  }

  // ---------------------------------------------- stat numbers count to their new value
  for (const id of ["stMembers", "stOnline"]) {
    const el = document.getElementById(id);
    if (!el || calm) continue;
    let shown = parseInt(el.textContent.replace(/\D/g, ""), 10) || 0;
    let busy = false;
    new MutationObserver(() => {
      if (busy) return;
      const to = parseInt(el.textContent.replace(/\D/g, ""), 10);
      if (!Number.isFinite(to) || to === shown) return;
      const from = shown, t0 = performance.now(), dur = 900;
      shown = to;
      busy = true;
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString();
        if (k < 1) requestAnimationFrame(step);
        else { el.textContent = to.toLocaleString(); busy = false; }
      };
      requestAnimationFrame(step);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }

  // ---------------------------------------------- hero flow field
  // Particles ride a smooth, slowly changing current made of layered sines,
  // leaving fading ice-blue trails. They swirl away from the cursor. Paused
  // whenever the hero is off screen or the tab is hidden.
  const hero = document.querySelector(".hero");
  if (!hero || calm) return;
  for (const k of ["a1", "a2", "a3"]) {
    const a = document.createElement("div");
    a.className = "aurora " + k;
    hero.prepend(a);
  }
  const cv = document.createElement("canvas");
  cv.className = "flow";
  cv.setAttribute("aria-hidden", "true");
  hero.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return;

  let W = 0, H = 0, dpr = 1, parts = [], running = false, visible = true, raf = 0;
  const mouse = { x: -9999, y: -9999 };

  function spawn(p, anywhere) {
    p.x = anywhere ? Math.random() * W : Math.random() < 0.5 ? -10 : Math.random() * W;
    p.y = Math.random() * H;
    p.vx = 0; p.vy = 0;
    p.life = 0;
    p.max = 180 + Math.random() * 260;
    p.hot = Math.random() < 0.06; // the odd bright spark
    return p;
  }

  function resize() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(1.5, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = Math.round(Math.min(340, Math.max(90, (W * H) / 4200)));
    parts = Array.from({ length: want }, () => spawn({}, true));
  }

  function field(x, y, t) {
    return (
      Math.sin(x * 0.0019 + t * 0.00021) * 1.4 +
      Math.cos(y * 0.0026 - t * 0.00017) * 1.2 +
      Math.sin((x + y) * 0.0011 + t * 0.00011) * 0.9
    );
  }

  function frame(t) {
    raf = 0;
    if (!running) return;
    // fade what's there toward transparent instead of painting black, so the
    // grid and aurora behind the canvas stay visible
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.075)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    for (const p of parts) {
      const a = field(p.x, p.y, t);
      p.vx = p.vx * 0.9 + (Math.cos(a) * 0.9 + 0.55) * 0.1;
      p.vy = p.vy * 0.9 + Math.sin(a) * 0.9 * 0.1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 150 * 150) {
        const f = (1 - Math.sqrt(d2) / 150) * 0.9;
        p.vx += (dx * 0.012 - dy * 0.02) * f;
        p.vy += (dy * 0.012 + dx * 0.02) * f;
      }
      const ox = p.x, oy = p.y;
      p.x += p.vx * 1.6; p.y += p.vy * 1.6;
      p.life++;
      const fade = Math.min(1, p.life / 30) * Math.min(1, (p.max - p.life) / 40);
      if (p.hot) {
        ctx.strokeStyle = `rgba(235,248,255,${0.75 * fade})`;
        ctx.lineWidth = 1.6;
      } else {
        ctx.strokeStyle = `rgba(124,196,255,${0.32 * fade})`;
        ctx.lineWidth = 1;
      }
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (p.life > p.max || p.x > W + 20 || p.x < -30 || p.y < -30 || p.y > H + 30) spawn(p, false);
    }
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on) {
    running = on;
    if (on && !raf) raf = requestAnimationFrame(frame);
  }

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden); }).observe(hero);
  document.addEventListener("visibilitychange", () => setRunning(visible && !document.hidden));
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  resize();
  setRunning(true);
})();
