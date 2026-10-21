// Where the checkout Worker lives. Empty = checkout not live yet, and the buy
// buttons keep their fallback link. Set it to the workers.dev URL after deploy.
window.TEMPO_SHOP = "https://tempo-shop.teekhub.workers.dev";
// Shows the PayPal buttons. Shut down 2026-09-29, back 2026-10-21 (one-time
// plans, Discord login first - same as card and crypto).
window.TEMPO_PAYPAL = true;
// Which checkout the Buy buttons use. "np" = NOWPayments (crypto, or card
// through their partner) - since 2026-10-21, when Stripe closed the account.
// "" = card checkout (Stripe) at /buy/<plan>.
window.TEMPO_CHECKOUT = "sq"; // "sq" = Square cards (2026-10-21); "Pay with crypto" buttons always go to NOWPayments

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
  let local = null; // { cur, rate, fmt } when the visitor's money isn't USD
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
    // (2026-10-21) weekly / monthly are one-time passes on this checkout (no
    // renewing); only the retired daily plan stays off
    const one = window.TEMPO_CHECKOUT === "np" || window.TEMPO_CHECKOUT === "sq";
    const off = one ? ["daily"] : [];
    document.querySelectorAll("[data-crypto]").forEach((a) => { a.href = `${SHOP}/np/buy/${a.dataset.crypto}${q}`; });
    document.querySelectorAll("[data-paypal]").forEach((a) => {
      a.hidden = !window.TEMPO_PAYPAL;
      a.href = `${SHOP}/paypal/buy/${a.dataset.paypal}${q}`;
    });
    document.querySelectorAll("[data-buy]").forEach((a) => {
      a.removeAttribute("target");
      if (off.includes(a.dataset.buy)) {
        a.removeAttribute("href");
        a.textContent = "Currently unavailable";
        a.setAttribute("aria-disabled", "true");
        a.style.opacity = ".45";
        a.style.pointerEvents = "none";
        return;
      }
      a.href = `${SHOP}/${one ? window.TEMPO_CHECKOUT + "/buy" : "buy"}/${a.dataset.buy}${q}`;
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
      // the same price in the visitor's money (plan cards only, not the hero strip)
      if (local && !el.classList.contains("amt")) {
        const cents = onSale ? onSale.now : ref && ref.prices[plan] ? ref.prices[plan] : Math.round(parseFloat(el.dataset.full.replace(/[^0-9.]/g, "")) * 100);
        const loc = document.createElement("span");
        loc.className = "local";
        loc.textContent = "≈ " + local.fmt.format((cents / 100) * local.rate);
        loc.title = "Charged in US dollars - your bank converts it at its own rate";
        el.append(loc);
      }
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

  // LOCAL PRICES (teek 10-18: "people from brazil saying it's too expensive" -
  // show what it costs in their money). The country comes from the browser's
  // language (pt-BR) or its time zone; rates from open.er-api.com, kept 12 h.
  (async () => {
    const TZ = { "America/Sao_Paulo": "BR", "America/Fortaleza": "BR", "America/Recife": "BR", "America/Bahia": "BR", "America/Manaus": "BR", "America/Belem": "BR", "America/Cuiaba": "BR", "America/Campo_Grande": "BR", "America/Maceio": "BR", "America/Porto_Velho": "BR", "America/Mexico_City": "MX", "America/Argentina/Buenos_Aires": "AR", "America/Bogota": "CO", "America/Santiago": "CL", "America/Lima": "PE", "Asia/Manila": "PH", "Asia/Jakarta": "ID", "Asia/Kolkata": "IN", "Europe/London": "GB", "Europe/Istanbul": "TR" };
    const CUR = { BR: "BRL", MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", PE: "PEN", PH: "PHP", ID: "IDR", IN: "INR", GB: "GBP", TR: "TRY", CA: "CAD", AU: "AUD", NZ: "NZD", PL: "PLN", SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF", JP: "JPY", KR: "KRW", ZA: "ZAR", MY: "MYR", TH: "THB", VN: "VND", RU: "RUB", UA: "UAH", RO: "RON", CZ: "CZK", HU: "HUF", SA: "SAR", AE: "AED", EG: "EGP", NG: "NGN",
      DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR" };
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    let country = TZ[tz];
    if (!country) for (const l of navigator.languages || [navigator.language]) { const m = /-([A-Z]{2})$/i.exec(l || ""); if (m) { country = m[1].toUpperCase(); break; } }
    const cur = CUR[country];
    if (!cur) return;
    let rates = null;
    try {
      const c = JSON.parse(localStorage.getItem("tempo_fx") || "null");
      if (c && Date.now() - c.at < 12 * 3600e3) rates = c.rates;
    } catch {}
    if (!rates) {
      try {
        const d = await (await fetch("https://open.er-api.com/v6/latest/USD")).json();
        if (d && d.result === "success") {
          rates = d.rates;
          try { localStorage.setItem("tempo_fx", JSON.stringify({ at: Date.now(), rates })); } catch {}
        }
      } catch {}
    }
    if (!rates || !rates[cur]) return;
    let fmt;
    try { fmt = new Intl.NumberFormat(navigator.language || "en", { style: "currency", currency: cur, maximumFractionDigits: rates[cur] > 50 ? 0 : 2 }); } catch { return; }
    local = { cur, rate: rates[cur], fmt };
    wire();
  })();

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
