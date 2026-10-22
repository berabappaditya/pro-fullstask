/* Boot: runs every registered feature once. One broken widget never stops the others. */
(function () {
  "use strict";
  function boot() {
    SDB.features.forEach(function (f) {
      try { f.fn(); } catch (e) { if (window.console) console.error("[SDB] feature failed: " + f.name, e); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
