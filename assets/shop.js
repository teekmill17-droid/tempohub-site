// Where the checkout Worker lives. Empty = checkout not live yet, and the buy
// buttons keep their fallback link. Set it to the workers.dev URL after deploy.
window.TEMPO_SHOP = "https://tempo-shop.teekhub.workers.dev";
// Shows the PayPal buttons. Off until PayPal checkout is tested and live.
window.TEMPO_PAYPAL = true;

// Point every [data-buy] button at the Worker's checkout for its plan.
(() => {
  if (!window.TEMPO_SHOP) return;
  document.querySelectorAll("[data-buy]").forEach((a) => {
    a.href = `${window.TEMPO_SHOP}/buy/${a.dataset.buy}`;
    a.removeAttribute("target");
  });
  // PayPal buttons appear only when PayPal checkout is switched on here. The
  // Discord name (optional) rides along so Teeky can give the Premium role.
  if (!window.TEMPO_PAYPAL) return;
  const box = document.getElementById("dname");
  if (box) box.hidden = false;
  document.querySelectorAll("[data-paypal]").forEach((a) => {
    a.hidden = false;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const name = ((document.getElementById("dnameInput") || {}).value || "").trim();
      location.href = `${window.TEMPO_SHOP}/paypal/buy/${a.dataset.paypal}` + (name ? `?discord=${encodeURIComponent(name)}` : "");
    });
  });
})();
