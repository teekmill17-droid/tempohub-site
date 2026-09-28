// Where the checkout Worker lives. Empty = checkout not live yet, and the buy
// buttons keep their fallback link. Set it to the workers.dev URL after deploy.
window.TEMPO_SHOP = "https://tempo-shop.teekhub.workers.dev";
// Shows the PayPal buttons. Off until PayPal checkout is tested and live.
window.TEMPO_PAYPAL = true;

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
      if (ref && ref.prices[plan]) {
        const was = document.createElement("span");
        was.className = "was";
        was.textContent = el.dataset.full;
        el.append(was, money(ref.prices[plan]));
      } else {
        el.append(el.dataset.full);
      }
      const per = document.createElement("small");
      per.textContent = el.dataset.per;
      el.append(per);
    });
    const msg = $("codeMsg");
    if (msg) {
      msg.className = "msg" + (ref ? " ok" : "");
      msg.textContent = ref ? `Code ${ref.code} applied: ${ref.discount}% off.` : "Have a code? It takes 10% off.";
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
