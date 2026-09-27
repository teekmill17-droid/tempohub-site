// Where the checkout Worker lives. Empty = checkout not live yet, and the buy
// buttons keep their fallback link. Set it to the workers.dev URL after deploy.
window.TEMPO_SHOP = "https://tempo-shop.teekhub.workers.dev";

// Point every [data-buy] button at the Worker's checkout for its plan.
(() => {
  if (!window.TEMPO_SHOP) return;
  document.querySelectorAll("[data-buy]").forEach((a) => {
    a.href = `${window.TEMPO_SHOP}/buy/${a.dataset.buy}`;
    a.removeAttribute("target");
  });
})();
