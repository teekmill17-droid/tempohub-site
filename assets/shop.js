// Where the checkout Worker lives. Empty = checkout not live yet, and the buy
// buttons keep their fallback link. Set it to the workers.dev URL after deploy.
window.TEMPO_SHOP = "https://tempo-shop.teekhub.workers.dev";
// Shows the PayPal buttons. OFF: the PayPal account was shut down
// (2026-09-29). Card checkout (Stripe) is the only way to pay.
window.TEMPO_PAYPAL = false;

// Checkout buttons, and referral codes.
//
// A code comes from a share link (?ref=CODE) or the code box by the plans. It
// is checked with the Worker, remembered in this browser for 30 days, shown on
// the prices, and sent along to checkout, where the Worker checks it again and
// takes the discount off. Nothing here decides a price: a code the Worker
// doesn't know just means full price.
(() => {
  const SHOP = window.TEMPO_SHOP;
  if (!SHOP) return;
  const KEY = "tempo_ref";
  const KEEP_MS = 30 * 86400000;
  const $ = (id) => document.getElementById(id);
  const money = (c) => "$" + (c / 100).toFixed(2);
  let ref = null; // { code, prices, discount } once checked
  let sale = null; // { percent, end, prices: { plan: { was, now } } } while a sale runs
  const FIRST = { weekly: " first week", monthly: " first month" };
  const FIRST_SHORT = { weekly: " 1st wk", monthly: " 1st mo" }; // the hero strip

  function stored() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && r.code && Date.now() - r.at < KEEP_MS) return r.code;
    } catch {}
    return null;
  }
  function remember(code) {
    try {
      if (code) localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
      else localStorage.removeItem(KEY);
    } catch {}
  }

  function wire() {
    const q = ref ? `?ref=${encodeURIComponent(ref.code)}` : "";
    document.querySelectorAll("[data-buy]").forEach((a) => {
      a.href = `${SHOP}/buy/${a.dataset.buy}${q}`;
      a.removeAttribute("target");
    });
    document.querySelectorAll("[data-price]").forEach((el) => {
      const plan = el.dataset.price;
      el.textContent = "";
      const onSale = sale && sale.prices[plan];
      if (onSale) {
        // the sale beats a code (they don't stack); renewals are full price
        const was = document.createElement("span");
        was.className = "was";
        was.textContent = el.dataset.full;
        el.append(was, money(onSale.now));
      } else if (ref && ref.prices[plan]) {
        const was = document.createElement("span");
        was.className = "was";
        was.textContent = el.dataset.full;
        el.append(was, money(ref.prices[plan]));
      } else {
        el.append(el.dataset.full);
      }
      const per = document.createElement("small");
      per.textContent = onSale && FIRST[plan] ? (el.classList.contains("amt") ? FIRST_SHORT : FIRST)[plan] : el.dataset.per;
      el.append(per);
    });
    const msg = $("codeMsg");
    if (msg) {
      msg.className = "msg" + (ref ? " ok" : "");
      msg.textContent = ref
        ? (sale ? `Code ${ref.code} saved - the ${sale.percent}% sale is better, so you get that (codes don't stack).` : `Code ${ref.code} applied: ${ref.discount}% off.`)
        : (sale ? `${sale.percent}% off your first payment today - no code needed.` : "Have a code? Enter it here.");
      if (ref) {
        const x = document.createElement("button");
        x.type = "button";
        x.textContent = "remove";
        x.addEventListener("click", () => { ref = null; remember(null); wire(); });
        msg.append(x);
      }
    }
  }

  async function check(code, landed) {
    try {
      const r = await fetch(`${SHOP}/ref?code=${encodeURIComponent(code)}${landed ? "&land=1" : ""}`);
      const d = await r.json();
      return d.ok ? d : null;
    } catch {
      return null;
    }
  }

  // PayPal has no field of its own for these, so the Discord name (for the
  // Premium role) and the code ride along in the URL.
  if (window.TEMPO_PAYPAL) {
    const box = $("dname");
    if (box) box.hidden = false;
    document.querySelectorAll("[data-paypal]").forEach((a) => {
      a.hidden = false;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        const name = (($("dnameInput") || {}).value || "").trim();
        if (name) q.set("discord", name);
        if (ref) q.set("ref", ref.code);
        location.href = `${SHOP}/paypal/buy/${a.dataset.paypal}` + (q.toString() ? "?" + q : "");
      });
    });
  }

  const form = $("codeForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = $("codeInput").value.trim();
      if (!code) return;
      const d = await check(code, false);
      if (!d) {
        const msg = $("codeMsg");
        msg.className = "msg bad";
        msg.textContent = "That code doesn't exist.";
        return;
      }
      ref = d;
      remember(d.code);
      $("codeInput").value = "";
      wire();
    });
  }

  wire();

  // ONE-DAY SALE: the Worker says if one is running (GET /sale). The bar at the
  // top becomes the sale bar with a countdown to the end.
  fetch(`${SHOP}/sale`).then((r) => r.json()).then((d) => {
    if (!d || !d.on) return;
    sale = d;
    wire();
    const bar = document.querySelector(".promo .wrap");
    if (!bar) return;
    bar.parentElement.classList.add("sale");
    bar.textContent = "";
    const t = document.createElement("span");
    const b = document.createElement("b");
    b.textContent = `${d.percent}% OFF`;
    const cd = document.createElement("span");
    cd.className = "cd";
    t.append(b, ` · today only · your first payment on any plan `, cd);
    const full = document.createElement("span");
    full.className = "full";
    full.textContent = Object.entries(d.prices).map(([p, v]) => `${p[0].toUpperCase() + p.slice(1)} ${money(v.now)}`).join(" · ");
    bar.append(t, full);
    const end = Date.parse(d.end);
    const tick = () => {
      const left = end - Date.now();
      if (left <= 0) {
        // over: back to normal prices (and a saved code's own prices) at once
        cd.textContent = "· ended";
        clearInterval(iv);
        sale = null;
        if (ref) check(ref.code, false).then((r) => { ref = r; wire(); });
        else wire();
        return;
      }
      const h = Math.floor(left / 3600e3), m = Math.floor(left / 60e3) % 60, s = Math.floor(left / 1e3) % 60;
      cd.textContent = `· ends in ${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };
    const iv = setInterval(tick, 1000);
    tick();
  }).catch(() => {});

  // A share link wins over a remembered code, and is counted as a click.
  const params = new URLSearchParams(location.search);
  const linked = params.get("ref");
  if (linked) {
    params.delete("ref");
    const clean = location.pathname + (params.toString() ? "?" + params : "") + location.hash;
    history.replaceState(null, "", clean);
  }
  const code = linked || stored();
  if (code) {
    check(code, Boolean(linked)).then((d) => {
      if (d) { ref = d; remember(d.code); }
      else if (!linked) remember(null);
      wire();
    });
  }
})();
