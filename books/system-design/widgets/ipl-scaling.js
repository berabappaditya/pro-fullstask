/* Chapter: JioHotstar. An illustrative match night: viewers vs capacity under three scaling strategies. */
SDB.register("widget-ipl-scaling", function () {
  var $ = SDB.$, svg = $("#iplChart"), root = $("#w-ipl");
  if (!svg) return;
  var el = SDB.svg;
  var MIN = 240;
  // [minute, viewers in millions]. Illustrative, shaped like a real match night.
  var KEY = [[0,1],[20,3],[28,6],[30,10],[38,8],[55,11],[60,18],[62,21],[95,23],[110,25],[118,24],[120,14],[132,16],[136,24],[148,25],[150,33],[168,35],[170,36],[172,27],[176,28],[190,30],[215,33],[228,38],[236,41],[238,42],[240,22]];
  var EVENTS = [[30, "Toss"], [60, "First ball"], [120, "Break"], [150, "Star batter in"], [171, "Wicket"], [236, "Last over"]];
  var demand = [];
  for (var t = 0; t <= MIN; t++) {
    var i = 0; while (KEY[i + 1][0] < t) i++;
    var a = KEY[i], b = KEY[i + 1], f = (t - a[0]) / (b[0] - a[0]);
    demand.push(a[1] + (b[1] - a[1]) * f + Math.sin(t * 1.7) * 0.35);
  }
  function floorFor(t) { return t < 15 ? 4 : t < 50 ? 15 : t < 140 ? 30 : 36; }   // the pre-warm timetable
  function simulate(strategy) {
    var cap = [], eff = [], fail = [], prev = 4, panicOn = [];
    for (var t = 0; t <= MIN; t++) {
      var target = demand[Math.max(0, t - 4)] * 1.15;              // metrics lag ~4 minutes
      var r = prev + Math.max(-1, Math.min(1.5, target - prev));  // boot time limits growth
      var c = strategy === "reactive" ? r : Math.max(floorFor(t), r);
      var panic = strategy === "panic" && demand[t] > 0.9 * c;
      var e = panic ? c * 1.3 : c;                                 // lighter pages: more viewers per server
      cap.push(c); eff.push(e); panicOn.push(panic); fail.push(Math.max(0, demand[t] - e));
      prev = c;
    }
    return { cap: cap, eff: eff, fail: fail, panic: panicOn };
  }
  var strategy = "reactive", sim = simulate(strategy), shown = MIN, anim = null;
  var X0 = 56, X1 = 650, Y0 = 250, Y1 = 64, YMAX = 60;
  function x(t) { return X0 + t / MIN * (X1 - X0); }
  function y(v) { return Y0 - v / YMAX * (Y0 - Y1); }

  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var v = 0; v <= YMAX; v += 10) {
      svg.appendChild(el("line", { x1: X0, x2: X1, y1: y(v), y2: y(v), style: "stroke:var(--line);stroke-width:1" }));
      svg.appendChild(el("text", { x: X0 - 6, y: y(v) + 4, "text-anchor": "end", "class": "d-xs" }, v === 0 ? "0" : (v / 10) + " cr"));
    }
    [0, 60, 120, 180, 240].forEach(function (m) { svg.appendChild(el("text", { x: x(m), y: Y0 + 16, "text-anchor": m === 240 ? "end" : "middle", "class": "d-xs" }, m + " min")); });
    EVENTS.forEach(function (ev, k) {
      svg.appendChild(el("line", { x1: x(ev[0]), x2: x(ev[0]), y1: Y1 - 6, y2: Y0, style: "stroke:var(--ink-3);stroke-width:1;stroke-dasharray:3 4" }));
      svg.appendChild(el("text", { x: x(ev[0]), y: k % 2 ? 44 : 56, "text-anchor": ev[0] > 220 ? "end" : "middle", "class": "d-xs" }, ev[1]));
    });
    var area = "M" + x(0) + " " + y(0), line = "", cap = "", effp = "";
    for (var t = 0; t <= shown; t++) {
      area += " L" + x(t).toFixed(1) + " " + y(demand[t]).toFixed(1);
      cap += (t ? " L" : "M") + x(t).toFixed(1) + " " + y(sim.cap[t]).toFixed(1);
      if (sim.panic[t]) effp += (sim.panic[t - 1] ? " L" : "M") + x(t).toFixed(1) + " " + y(sim.eff[t]).toFixed(1);
    }
    area += " L" + x(shown) + " " + y(0) + " Z";
    svg.appendChild(el("path", { d: area, style: "fill:var(--accent-soft);stroke:var(--accent);stroke-width:2" }));
    for (t = 0; t <= shown; t++) if (sim.fail[t] > 0.05)
      svg.appendChild(el("rect", { x: x(t) - 1.3, y: y(demand[t]), width: 2.6, height: Math.max(1, y(sim.eff[t]) - y(demand[t])), style: "fill:var(--bad)" }));
    if (effp) svg.appendChild(el("path", { d: effp, style: "fill:none;stroke:var(--amber-line);stroke-width:2.6;stroke-dasharray:5 3" }));
    svg.appendChild(el("path", { d: cap, style: "fill:none;stroke:var(--ink);stroke-width:2.2" }));
    // legend
    svg.appendChild(el("rect", { x: X0 + 6, y: 6, width: 12, height: 10, style: "fill:var(--accent-soft);stroke:var(--accent)" }));
    svg.appendChild(el("text", { x: X0 + 24, y: 15, "class": "d-xs" }, "viewers"));
    svg.appendChild(el("rect", { x: X0 + 80, y: 10, width: 14, height: 3, style: "fill:var(--ink)" }));
    svg.appendChild(el("text", { x: X0 + 100, y: 15, "class": "d-xs" }, "server capacity"));
    svg.appendChild(el("rect", { x: X0 + 190, y: 6, width: 8, height: 10, style: "fill:var(--bad)" }));
    svg.appendChild(el("text", { x: X0 + 204, y: 15, "class": "d-xs" }, "viewers turned away"));
    if (strategy === "panic") {
      svg.appendChild(el("rect", { x: X0 + 320, y: 10, width: 14, height: 3, style: "fill:var(--amber-line)" }));
      svg.appendChild(el("text", { x: X0 + 340, y: 15, "class": "d-xs" }, "capacity in panic mode"));
    }
    stats();
  }
  function stats() {
    var lostMin = 0, worst = 0, capSum = 0, demSum = 0, panicMin = 0;
    for (var t = 0; t <= shown; t++) { lostMin += sim.fail[t]; worst = Math.max(worst, sim.fail[t]); capSum += sim.cap[t]; demSum += demand[t]; if (sim.panic[t]) panicMin++; }
    var lakh = function (m) { return (m * 10).toFixed(0) + " lakh"; };
    $("#iplStats").innerHTML =
      "<span>Minute <b>" + shown + "</b></span>" +
      "<span>Worst minute <b style=\"color:" + (worst > 0.05 ? "var(--bad)" : "var(--good)") + "\">" + (worst > 0.05 ? lakh(worst) + " turned away" : "nobody turned away") + "</b></span>" +
      "<span>Viewer-minutes lost <b>" + (lostMin > 0.05 ? (lostMin).toFixed(1) + " M" : "0") + "</b></span>" +
      "<span>Capacity paid for <b>" + Math.round(capSum / Math.max(1, demSum) * 100) + "%</b> of demand</span>" +
      (strategy === "panic" ? "<span>Panic mode on <b>" + panicMin + " min</b></span>" : "");
  }
  function play() {
    if (anim) return;
    shown = 0; $("#iplPlay").textContent = "Playing…";
    anim = setInterval(function () {
      shown = Math.min(MIN, shown + 2); draw();
      if (shown >= MIN) { clearInterval(anim); anim = null; $("#iplPlay").textContent = "Play match"; }
    }, 30);
  }
  root.querySelectorAll("[data-strat]").forEach(function (b) {
    b.addEventListener("click", function () {
      strategy = b.getAttribute("data-strat"); sim = simulate(strategy);
      root.querySelectorAll("[data-strat]").forEach(function (o) { o.classList.toggle("on", o === b); });
      draw();
    });
  });
  $("#iplPlay").addEventListener("click", play);
  $("#iplReset").addEventListener("click", function () { clearInterval(anim); anim = null; shown = MIN; $("#iplPlay").textContent = "Play match"; draw(); });
  draw();
});
