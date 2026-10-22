/* Chapter: Embeddings. A toy 2-D "meaning map" of menu items (real models use hundreds or thousands of
 * dimensions). Pick a query: it is placed on the map and the nearest items by cosine similarity light up. */
SDB.register("widget-embeddings", function () {
  var $ = SDB.$, svg = $("#embSvg");
  if (!svg) return;
  var el = SDB.svg;
  /* x ≈ cold (−) … hot (+), y ≈ sweet (−) … savoury/spicy (+); vectors are centred so cosine is meaningful */
  /* name, x, y, kind, label dx, label dy, anchor */
  var ITEMS = [
    ["Adrak chai", 0.80, 0.50, "drink", 10, 4, "start"], ["Ginger tea", 0.66, 0.66, "drink", 10, -8, "start"], ["Masala chai", 0.88, 0.30, "drink", -10, 4, "end"],
    ["Filter coffee", 0.92, 0.02, "drink", -10, -8, "end"], ["Hot chocolate", 0.70, -0.50, "drink", 10, 4, "start"], ["Cold coffee", -0.62, -0.12, "drink", 10, 4, "start"],
    ["Mango lassi", -0.80, -0.52, "drink", 10, 4, "start"], ["Iced lemon tea", -0.85, 0.22, "drink", 10, 4, "start"], ["Samosa", 0.30, 0.90, "snack", 10, 4, "start"],
    ["Vada pav", 0.08, 0.80, "snack", -10, 4, "end"], ["Kachori", 0.42, 0.80, "snack", -10, 14, "end"], ["Gulab jamun", 0.40, -0.80, "sweet", -10, 4, "end"],
    ["Kulfi", -0.55, -0.85, "sweet", 10, 4, "start"], ["Jalebi", 0.62, -0.92, "sweet", 10, 4, "start"]
  ];
  var QUERIES = [["something warm with ginger", 0.74, 0.58], ["a cold sweet drink", -0.72, -0.36], ["spicy evening snack", 0.22, 0.86], ["hot dessert", 0.54, -0.72]];
  var qi = 0, K = 3;
  $("#embControls").innerHTML = QUERIES.map(function (q, i) { return '<button class="btn' + (i === 0 ? " on" : "") + '" data-q="' + i + '">"' + q[0] + '"</button>'; }).join("") +
    '<label class="btn">top-k <select id="embK"><option>1</option><option selected>3</option><option>5</option></select></label>';

  function cos(a, b) { var d = a[0] * b[0] + a[1] * b[1]; return d / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1])); }
  function X(v) { return 260 + v * 210; } function Y(v) { return 170 - v * 140; }
  function render() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(el("line", { x1: 40, x2: 480, y1: 170, y2: 170, "class": "d-line d-dash" }));
    svg.appendChild(el("line", { x1: 260, x2: 260, y1: 20, y2: 320, "class": "d-line d-dash" }));
    svg.appendChild(el("text", { x: 478, y: 188, "text-anchor": "end", "class": "d-xs" }, "hot →"));
    svg.appendChild(el("text", { x: 42, y: 188, "class": "d-xs" }, "← cold"));
    svg.appendChild(el("text", { x: 252, y: 24, "text-anchor": "end", "class": "d-xs" }, "↑ savoury / spicy"));
    svg.appendChild(el("text", { x: 266, y: 316, "class": "d-xs" }, "↓ sweet"));
    var q = QUERIES[qi], qv = [q[1], q[2]];
    var scored = ITEMS.map(function (it) { return { it: it, s: cos(qv, [it[1], it[2]]) }; }).sort(function (a, b) { return b.s - a.s; });
    var top = scored.slice(0, K).map(function (x) { return x.it[0]; });
    scored.slice(0, K).forEach(function (x) {
      svg.appendChild(el("line", { x1: X(qv[0]), y1: Y(qv[1]), x2: X(x.it[1]), y2: Y(x.it[2]), "class": "d-lacc d-dash" }));
    });
    ITEMS.forEach(function (it) {
      var hit = top.indexOf(it[0]) > -1;
      svg.appendChild(el("circle", { cx: X(it[1]), cy: Y(it[2]), r: hit ? 8 : 5.5, "class": hit ? "d-good" : (it[3] === "drink" ? "d-vio" : it[3] === "snack" ? "d-amb" : "d-bad") }));
      svg.appendChild(el("text", { x: X(it[1]) + it[4], y: Y(it[2]) + it[5], "text-anchor": it[6], "class": "d-xs" }, it[0]));
    });
    svg.appendChild(el("rect", { x: X(qv[0]) - 9, y: Y(qv[1]) - 9, width: 18, height: 18, rx: 4, "class": "d-acc" }));
    svg.appendChild(el("text", { x: X(qv[0]), y: Y(qv[1]) + 4, "text-anchor": "middle", "class": "d-t" }, "Q"));
    $("#embList").innerHTML = '<div class="emb-q">Query: <b>"' + q[0] + '"</b></div><ol>' + scored.slice(0, 6).map(function (x, i) {
      return '<li class="' + (i < K ? "hit" : "") + '"><span>' + x.it[0] + '</span><b>' + x.s.toFixed(3) + '</b></li>';
    }).join("") + '</ol><p class="small">Cosine similarity: 1 = same direction. "Adrak chai" and "Ginger tea" share no words, yet sit together.</p>';
  }
  $("#embControls").addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]"); if (!b) return;
    qi = +b.getAttribute("data-q");
    SDB.$$("#embControls [data-q]").forEach(function (x) { x.classList.toggle("on", x === b); });
    render();
  });
  $("#embK").addEventListener("change", function () { K = +this.value; render(); });
  render();
});
