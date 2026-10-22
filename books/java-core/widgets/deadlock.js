/* Chapter: Deadlock. Two chefs need the PAN and the SPATULA. Opposite lock order deadlocks;
 * the same order everywhere always finishes. */
SDB.register("widget-kitchen-deadlock", function () {
  var $ = SDB.$, stage = $("#dlStage");
  if (!stage) return;
  var SCRIPTS = {
    opposite: [
      { text: "Chef A's plan: PAN, then SPATULA. Chef B's plan: SPATULA, then PAN (opposite order)." },
      { a: "has PAN", hold: { PAN: "A" }, text: "Chef A: synchronized(PAN) → got the pan." },
      { b: "has SPATULA", hold: { SPATULA: "B" }, text: "Chef B: synchronized(SPATULA) → got the spatula." },
      { a: "waits for SPATULA", wa: "SPATULA", text: "Chef A: synchronized(SPATULA) → held by B. Chef A is BLOCKED (still holding the pan)." },
      { b: "waits for PAN", wb: "PAN", dead: true, text: '<b style="color:var(--bad)">Deadlock.</b> Chef B: synchronized(PAN) → held by A. Each waits for the other forever: circular wait. No exception, no log line, the kitchen just freezes.' }
    ],
    ordered: [
      { text: "New rule: everyone takes the PAN first, then the SPATULA." },
      { a: "has PAN", hold: { PAN: "A" }, text: "Chef A: synchronized(PAN) → got the pan." },
      { b: "waits for PAN", wb: "PAN", text: "Chef B also starts with the PAN. It's taken, so B waits, holding nothing." },
      { a: "has PAN + SPATULA", hold: { SPATULA: "A" }, text: "Chef A: synchronized(SPATULA) → free, got it. Cooking!" },
      { a: "done, released both", wa: null, release: "A", text: "Chef A finishes and leaves both blocks: both locks released." },
      { b: "has PAN", wb: null, hold: { PAN: "B" }, text: "Chef B wakes up and gets the pan." },
      { b: "has PAN + SPATULA", hold: { SPATULA: "B" }, text: "Chef B gets the spatula. Cooking!" },
      { b: "done, released both", release: "B", ok: true, text: '<b style="color:var(--good)">Both dishes cooked.</b> With one global lock order a cycle can never form.' }
    ]
  };
  var mode = "opposite", i, st, timer;

  $("#dlControls").innerHTML =
    '<button class="btn on" data-m="opposite">Opposite order</button>' +
    '<button class="btn" data-m="ordered">Same order (fix)</button>' +
    '<button class="btn primary" id="dlNext">Next step</button>' +
    '<button class="btn" id="dlPlay">Play</button>' +
    '<button class="btn" id="dlReset">Reset</button>';

  function reset() {
    clearInterval(timer); timer = null; $("#dlPlay").textContent = "Play";
    i = 0; st = { a: "idle", b: "idle", hold: { PAN: null, SPATULA: null }, wa: null, wb: null, dead: false, ok: false };
    $("#dlLog").innerHTML = ""; step();
  }
  function step() {
    var s = SCRIPTS[mode][i]; if (!s) return false;
    if (s.a) st.a = s.a; if (s.b) st.b = s.b;
    if (s.hold) for (var k in s.hold) st.hold[k] = s.hold[k];
    if ("wa" in s) st.wa = s.wa; if ("wb" in s) st.wb = s.wb;
    if (s.release) for (var r in st.hold) if (st.hold[r] === s.release) st.hold[r] = null;
    st.dead = !!s.dead; st.ok = !!s.ok;
    SDB.log($("#dlLog"), s.text); i++; render();
    return i < SCRIPTS[mode].length;
  }
  function tool(name) {
    var h = st.hold[name], waiting = (st.wa === name ? "A" : "") + (st.wb === name ? "B" : "");
    return '<div class="dl-tool' + (h ? " held" : "") + '"><b>' + (name === "PAN" ? "🍳 " : "🥄 ") + name + '</b><small>' + (h ? "held by Chef " + h : "free") + (waiting ? " · Chef " + waiting + " waiting" : "") + '</small></div>';
  }
  function chef(n) {
    var s = st[n.toLowerCase()], waiting = st["w" + n.toLowerCase()];
    return '<div class="dl-chef' + (waiting ? " waiting" : "") + (st.dead ? " dead" : "") + '"><b>Chef ' + n + '</b><small>' + s + '</small></div>';
  }
  function render() {
    stage.className = "dl-stage" + (st.dead ? " is-dead" : st.ok ? " is-ok" : "");
    stage.innerHTML = chef("A") + '<div class="dl-tools">' + tool("PAN") + tool("SPATULA") + '</div>' + chef("B") +
      (st.dead ? '<div class="dl-banner">DEADLOCK: A → SPATULA → B → PAN → A</div>' : st.ok ? '<div class="dl-banner ok">Both finished</div>' : "");
  }
  $("#dlControls").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-m]"); if (!b) return;
    mode = b.getAttribute("data-m");
    SDB.$$("#dlControls [data-m]").forEach(function (x) { x.classList.toggle("on", x === b); });
    reset();
  });
  $("#dlNext").addEventListener("click", step);
  $("#dlPlay").addEventListener("click", function () {
    if (timer) { clearInterval(timer); timer = null; this.textContent = "Play"; return; }
    if (i >= SCRIPTS[mode].length) reset();
    var btn = this; btn.textContent = "Pause";
    timer = setInterval(function () { if (!step()) { clearInterval(timer); timer = null; btn.textContent = "Play"; } }, 1100);
  });
  $("#dlReset").addEventListener("click", reset);
  reset();
});
