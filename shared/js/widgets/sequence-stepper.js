/*
 * Shared widget: a sequence diagram that draws itself, one message at a time.
 * Use it in any chapter, no JavaScript needed:
 *
 * <div class="widget" data-sequence>
 *   <div class="widget-head"><span class="live">Live</span>Title</div>
 *   <div class="widget-body">
 *     [script type="application/json"]{
 *       "actors": [ { "id": "c", "label": "Client", "sub": "browser", "cls": "d-vio" }, ... ],
 *       "steps":  [ { "from": "c", "to": "s", "msg": "GET /orders", "text": "What happens and why.", "ret": false }, ... ]
 *     }[/script]   (a real script tag of type application/json)
 *   </div>
 * </div>
 *
 * cls is any diagram colour class (d-box, d-acc, d-good, d-amb, d-bad, d-vio, d-teal).
 * "ret": true draws a dashed return arrow. from === to draws a self-step (work done inside one actor).
 */
SDB.register("widget-sequence", function () {
  var el = SDB.svg;
  SDB.$$("[data-sequence]").forEach(function (root) {
    var json = root.querySelector('script[type="application/json"]');
    if (!json) return;
    var cfg;
    try { cfg = JSON.parse(json.textContent); } catch (e) { console.error("[SDB] bad sequence JSON", e); return; }
    var body = root.querySelector(".widget-body");
    var A = cfg.actors, S = cfg.steps;
    var COLW = Math.max(130, Math.min(180, 900 / A.length)), W = Math.max(640, A.length * COLW + 40);
    var TOP = 70, ROW = 40, H = TOP + S.length * ROW + 30;
    var xOf = {};
    A.forEach(function (a, i) { xOf[a.id] = 20 + COLW / 2 + i * COLW; });

    body.insertAdjacentHTML("afterbegin",
      '<div class="controls"><button class="btn primary" data-act="next">Next step</button><button class="btn" data-act="play">Play all</button><button class="btn" data-act="reset">Reset</button><span class="small seq-count"></span></div>' +
      '<div class="svgwrap" style="overflow-x:auto"><svg class="seq-svg" viewBox="0 0 ' + W + " " + H + '" style="min-width:' + Math.min(W, 620) + 'px" role="img" aria-label="Sequence diagram"></svg></div>' +
      '<div class="upi-step seq-text" aria-live="polite"></div>');
    var svg = body.querySelector(".seq-svg"), text = body.querySelector(".seq-text"), count = body.querySelector(".seq-count");
    var idx = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function base() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      A.forEach(function (a) {
        var x = xOf[a.id];
        svg.appendChild(el("line", { x1: x, x2: x, y1: 54, y2: H - 10, "class": "d-line d-dash", style: "stroke-width:1.2" }));
        svg.appendChild(el("rect", { x: x - COLW / 2 + 8, y: 8, width: COLW - 16, height: 44, rx: 9, "class": a.cls || "d-box" }));
        svg.appendChild(el("text", { x: x, y: a.sub ? 27 : 35, "text-anchor": "middle", "class": "d-t" }, a.label));
        if (a.sub) svg.appendChild(el("text", { x: x, y: 43, "text-anchor": "middle", "class": "d-xs" }, a.sub));
      });
    }
    function drawStep(i, progress, current) {
      var s = S[i], y = TOP + i * ROW + 14, x1 = xOf[s.from], x2 = xOf[s.to];
      var col = current ? (s.bad ? "d-lbad" : s.ret ? "d-lgood" : "d-lacc") : "d-line";
      var mk = current ? (s.bad ? "ab" : s.ret ? "ag" : "aa") : "ah";
      var txtCls = current ? (s.bad ? "d-tb" : s.ret ? "d-tg" : "d-ta") : "d-s";
      if (x1 === x2) {
        svg.appendChild(el("rect", { x: x1 - 8, y: y - 12, width: 16, height: 24, rx: 4, "class": current ? "d-amb" : "d-paper" }));
        svg.appendChild(el("text", { x: x1 + 14, y: y + 4, "class": txtCls }, s.msg));
        return;
      }
      var xe = x1 + (x2 - x1) * progress;
      svg.appendChild(el("line", { x1: x1, y1: y, x2: xe, y2: y, "class": col + (s.ret ? " d-dash" : ""), "marker-end": "url(#" + mk + ")" }));
      if (progress === 1) {
        var mid = (x1 + x2) / 2;
        svg.appendChild(el("text", { x: mid, y: y - 6, "text-anchor": "middle", "class": txtCls }, (i + 1) + ". " + s.msg));
      }
    }
    function render(progress) {
      base();
      for (var i = 0; i < idx; i++) drawStep(i, i === idx - 1 ? progress : 1, i === idx - 1);
      count.textContent = "Step " + idx + " of " + S.length;
      text.innerHTML = idx ? "<b>" + idx + ".</b> " + S[idx - 1].text : (cfg.intro || "Press <b>Next step</b> to send the first message.");
    }
    function next(done) {
      if (idx >= S.length) { if (done) done(); return; }
      idx++;
      if (reduce) { render(1); if (done) done(); return; }
      var t0 = null;
      (function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 450);
        render(p);
        if (p < 1) requestAnimationFrame(frame); else if (done) done();
      })(performance.now());
    }
    function stop() { clearTimeout(timer); timer = null; body.querySelector('[data-act="play"]').textContent = "Play all"; }
    function play() {
      if (idx >= S.length) { stop(); return; }
      next(function () { timer = setTimeout(play, 900); });
    }
    body.querySelector(".controls").addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "next") { stop(); next(); }
      if (act === "reset") { stop(); idx = 0; render(1); }
      if (act === "play") {
        if (timer) { stop(); return; }
        if (idx >= S.length) idx = 0;
        b.textContent = "Pause"; timer = true; play();
      }
    });
    render(1);
  });
});
