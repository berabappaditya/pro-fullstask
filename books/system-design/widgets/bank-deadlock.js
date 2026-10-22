/* Chapter: Banking. Two simultaneous transfers (A→B and B→A) with naive vs ordered locking. */
SDB.register("widget-bank-deadlock", function () {
  var $ = SDB.$, svg = $("#dlSvg"), root = $("#w-deadlock");
  if (!svg) return;
  var el = SDB.svg;
  var SCRIPTS = {
    naive: [
      { text: "T1 wants to send ₹500 from A to B. T2 wants to send ₹200 from B to A. Both start at the same instant." },
      { text: "T1 locks its 'from' account: A.", hold: ["A", "T1"] },
      { text: "T2 locks its 'from' account: B.", hold: ["B", "T2"] },
      { text: "T1 now needs B, but T2 holds it. T1 waits.", wait: ["T1", "B"] },
      { text: "T2 now needs A, but T1 holds it. T2 waits. <b style=\"color:var(--bad)\">Deadlock:</b> each waits for the other forever (a circular wait). Customers' money is stuck and threads pile up.", wait: ["T2", "A"], dead: true }
    ],
    ordered: [
      { text: "Same two transfers. New rule: always lock the account with the smaller ID first. A &lt; B, so <i>both</i> threads start with A." },
      { text: "T1 locks A (the smaller ID).", hold: ["A", "T1"] },
      { text: "T2 also needs A first. A is taken, so T2 waits, while holding nothing.", wait: ["T2", "A"] },
      { text: "T1 locks B. It holds both, moves ₹500 from A to B.", hold: ["B", "T1"], bal: { A: -500, B: 500 } },
      { text: "T1 releases B and A.", release: "T1" },
      { text: "T2 gets A (smaller ID first).", unwait: "T2", hold: ["A", "T2"] },
      { text: "T2 locks B and moves ₹200 from B to A.", hold: ["B", "T2"], bal: { A: 200, B: -200 } },
      { text: "T2 releases both. <b style=\"color:var(--good)\">Both transfers finished.</b> With one global order, a cycle can never form.", release: "T2", ok: true }
    ]
  };
  var mode = "naive", idx, st, timer = null;
  function reset() {
    clearInterval(timer); timer = null;
    idx = 0; st = { holds: { A: null, B: null }, waits: { T1: null, T2: null }, bal: { A: 1000, B: 1000 }, dead: false, ok: false };
    apply(SCRIPTS[mode][0]); idx = 1; draw();
  }
  function apply(s) {
    if (s.hold) st.holds[s.hold[0]] = s.hold[1];
    if (s.hold && st.waits[s.hold[1]] === s.hold[0]) st.waits[s.hold[1]] = null;
    if (s.wait) st.waits[s.wait[0]] = s.wait[1];
    if (s.unwait) st.waits[s.unwait] = null;
    if (s.release) ["A", "B"].forEach(function (k) { if (st.holds[k] === s.release) st.holds[k] = null; });
    if (s.bal) { st.bal.A += s.bal.A; st.bal.B += s.bal.B; }
    st.dead = !!s.dead; st.ok = !!s.ok;
    $("#dlText").innerHTML = s.text;
  }
  var POS = { T1: [70, 115], T2: [570, 115], A: [320, 50], B: [320, 180] };
  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    ["A", "B"].forEach(function (k) {
      var p = POS[k], held = st.holds[k];
      svg.appendChild(el("rect", { x: p[0] - 80, y: p[1] - 30, width: 160, height: 60, rx: 10, "class": held ? "d-amb" : "d-box" }));
      svg.appendChild(el("text", { x: p[0], y: p[1] - 6, "text-anchor": "middle", "class": "d-t" }, "Account " + k + " · ₹" + st.bal[k]));
      svg.appendChild(el("text", { x: p[0], y: p[1] + 14, "text-anchor": "middle", "class": "d-xs" }, held ? "locked by " + held : "unlocked"));
    });
    ["T1", "T2"].forEach(function (k) {
      var p = POS[k];
      svg.appendChild(el("rect", { x: p[0] - 55, y: p[1] - 26, width: 110, height: 52, rx: 26, "class": st.dead ? "d-bad" : st.ok ? "d-good" : "d-vio" }));
      svg.appendChild(el("text", { x: p[0], y: p[1] - 2, "text-anchor": "middle", "class": "d-t" }, k));
      svg.appendChild(el("text", { x: p[0], y: p[1] + 14, "text-anchor": "middle", "class": "d-xs" }, k === "T1" ? "A → B ₹500" : "B → A ₹200"));
    });
    function link(from, to, cls, dash, label) {
      var a = POS[from], b = POS[to];
      var ax = a[0] + (b[0] > a[0] ? 55 : -55), bx = b[0] + (a[0] > b[0] ? 80 : -80);
      svg.appendChild(el("path", { d: "M" + ax + " " + a[1] + " L" + bx + " " + b[1], "class": cls + (dash ? " d-dash" : ""), "marker-end": "url(#" + (cls === "d-lgood" ? "ag" : "ab") + ")" }));
      svg.appendChild(el("text", { x: (ax + bx) / 2, y: (a[1] + b[1]) / 2 - 6, "text-anchor": "middle", "class": cls === "d-lgood" ? "d-tg" : "d-tb" }, label));
    }
    ["A", "B"].forEach(function (k) { if (st.holds[k]) link(st.holds[k], k, "d-lgood", false, "holds"); });
    ["T1", "T2"].forEach(function (k) { if (st.waits[k]) link(k, st.waits[k], "d-lbad", true, "waits for"); });
  }
  function step() {
    var s = SCRIPTS[mode];
    if (idx >= s.length) { clearInterval(timer); timer = null; return; }
    apply(s[idx++]); draw();
  }
  root.querySelectorAll("[data-dl]").forEach(function (b) {
    b.addEventListener("click", function () {
      mode = b.getAttribute("data-dl");
      root.querySelectorAll("[data-dl]").forEach(function (o) { o.classList.toggle("on", o === b); });
      reset();
    });
  });
  $("#dlStep").addEventListener("click", step);
  $("#dlRun").addEventListener("click", function () { if (idx >= SCRIPTS[mode].length) reset(); clearInterval(timer); timer = setInterval(step, 1100); });
  $("#dlReset").addEventListener("click", reset);
  reset();
});
