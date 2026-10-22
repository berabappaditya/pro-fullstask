/* Chapter drawer on small screens, reading progress bar, and highlighting the current chapter in the index. */
SDB.register("navigation", function () {
  var $ = SDB.$, $$ = SDB.$$;
  var rail = $("#rail"), scrim = $("#scrim"), menuBtn = $("#menuBtn"), readBar = $("#readBar");

  function setRail(open) {
    rail.classList.toggle("open", open);
    scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  menuBtn.addEventListener("click", function () { setRail(!rail.classList.contains("open")); });
  scrim.addEventListener("click", function () { setRail(false); });
  rail.addEventListener("click", function (e) { if (e.target.closest("a") && window.innerWidth <= 1020) setRail(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setRail(false); });

  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    readBar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = {};
  $$(".toc a[data-ch]").forEach(function (a) { links[a.getAttribute("data-ch")] = a; });
  SDB.tocLinks = links;
  var current = null;
  function setActive(id) {
    if (current === id || !links[id]) return;
    if (current && links[current]) links[current].classList.remove("active");
    current = id;
    var a = links[id];
    a.classList.add("active");
    // Remember the last chapter read, so the landing page can offer "Continue reading".
    var sec = document.getElementById(id);
    if (sec && sec.classList.contains("chapter")) {
      SDB.store.set(SDB.key("last"), { id: id, title: sec.getAttribute("data-title"), num: sec.getAttribute("data-num"), at: Date.now() });
    }
    var top = a.offsetTop, rt = rail.scrollTop, rh = rail.clientHeight;
    if (top < rt + 60 || top > rt + rh - 80) rail.scrollTop = top - rh / 3;
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    $$("[data-title]").forEach(function (el) { if (el.id) io.observe(el); });
  }
});
