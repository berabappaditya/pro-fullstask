/* Landing page behaviour: progress per book, "continue reading", search across every book, card tilt.
 * Data comes from window.SDH_DATA, which build.js generates from every book's chapters. */
SDB.register("landing", function () {
  var $ = SDB.$, $$ = SDB.$$, DATA = window.SDH_DATA || { books: [], index: [] };
  var byId = {};
  DATA.books.forEach(function (b) { byId[b.id] = b; });
  function get(key, fallback) { return SDB.store.get(key, fallback); }
  function colourStyle(b) {
    return "--c:" + b.theme.light.accent + ";--c-soft:" + b.theme.light.accentSoft + ";--c-d:" + b.theme.dark.accent + ";--c-soft-d:" + b.theme.dark.accentSoft;
  }
  function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* progress on each card */
  $$(".book-card").forEach(function (card) {
    var b = byId[card.getAttribute("data-book")]; if (!b) return;
    var done = get("sdh-" + b.id + "-done", []).filter(function (id) { return b.chapterIds.indexOf(id) > -1; }).length;
    var total = b.chapterIds.length, pct = total ? Math.round(done / total * 100) : 0;
    $(".bc-progress i", card).style.width = pct + "%";
    $(".bc-prog-txt", card).textContent = done === 0 ? "Not started yet" : done === total ? "Finished. Time for the quiz!" : done + " of " + total + " chapters done (" + pct + "%)";
  });

  /* continue reading: the most recently opened chapter in any book */
  var last = null;
  DATA.books.forEach(function (b) {
    var l = get("sdh-" + b.id + "-last", null);
    if (l && l.id && (!last || l.at > last.at)) last = { book: b, ch: l, at: l.at };
  });
  if (last) {
    var box = $("#lContinue");
    box.innerHTML = '<a class="cont-card" style="' + colourStyle(last.book) + '" href="' + last.book.file + '#' + last.ch.id + '">' +
      '<span class="cc-label">Continue reading · ' + escHtml(last.book.short) + '</span><b>Chapter ' + (+last.ch.num || last.ch.num) + ': ' + escHtml(last.ch.title) + '</b><span class="cc-go">Resume →</span></a>';
    box.hidden = false;
  }

  /* search every chapter of every book */
  var input = $("#lSearch"), out = $("#lResults");
  function search(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) { out.hidden = true; out.innerHTML = ""; return; }
    var words = q.split(/\s+/);
    var hits = DATA.index.map(function (e) {
      var title = e.t.toLowerCase(), hay = (e.t + " " + e.o + " " + e.h).toLowerCase(), score = 0;
      for (var i = 0; i < words.length; i++) {
        if (hay.indexOf(words[i]) === -1) return null;
        score += title.indexOf(words[i]) > -1 ? 3 : 1;
      }
      return { e: e, s: score };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 14);
    out.hidden = false;
    out.innerHTML = hits.length ? hits.map(function (h) {
      var b = byId[h.e.b];
      return '<a class="l-res-item" style="' + colourStyle(b) + '" href="' + h.e.f + '#' + h.e.id + '"><span class="rb">' + escHtml(b.short) + '</span><span><b>' + (+h.e.n || h.e.n) + '. ' + escHtml(h.e.t) + '</b><small>' + escHtml(h.e.o) + '</small></span></a>';
    }).join("") : '<div class="l-res-empty">No chapter matches "' + escHtml(q) + '". Try a shorter word.</div>';
  }
  input.addEventListener("input", function () { search(input.value); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === "Escape") { out.hidden = true; }
  });

  /* gentle 3D tilt + glow that follows the pointer */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) $$(".book-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
      card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", function () { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
  });

  /* reading progress bar in the top bar */
  var bar = $("#readBar");
  function onScroll() { var h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + "%"; }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
});
