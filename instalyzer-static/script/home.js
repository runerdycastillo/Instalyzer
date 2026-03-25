// Compatibility shim: legacy references to home.js now load the active home flow.
(() => {
  if (document.querySelector('script[src$="script/home-datasets.js"]')) return;

  const next = document.createElement("script");
  next.src = "./script/home-datasets.js";
  next.defer = true;
  document.head.appendChild(next);
})();
