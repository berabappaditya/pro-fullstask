/* Chapter: UPI. Steps a ₹250 payment through every party; a second scenario shows a timeout, a status check and an automatic reversal. */
SDB.register("widget-upi-flow", function () {
  var $ = SDB.$, svg = $("#upiSvg");
  if (!svg) return;
  var el = SDB.svg;
  var NODES = {
    app:   { x: 20,  y: 30,  w: 160, h: 56, t: "Priya's app", s: "PhonePe / Google Pay", c: "d-vio" },
    ppsp:  { x: 20,  y: 170, w: 160, h: 56, t: "Payer PSP bank", s: "Priya's app's sponsor", c: "d-box" },
    npci:  { x: 290, y: 110, w: 180, h: 80, t: "NPCI UPI switch", s: "routes · resolves · times out", c: "d-amb" },
    rpsp:  { x: 580, y: 30,  w: 160, h: 56, t: "Ramu's PSP", s: "@okaxis · soundbox", c: "d-box" },
    rbank: { x: 200, y: 250, w: 170, h: 56, t: "Priya's bank", s: "remitter: debits", c: "d-good" },
    bbank: { x: 400, y: 250, w: 170, h: 56, t: "Ramu's bank", s: "beneficiary: credits", c: "d-good" }
  };
  var LINKS = [["app", "ppsp"], ["ppsp", "npci"], ["npci", "rpsp"], ["npci", "rbank"], ["npci", "bbank"]];
  var COMMON = [
    { f: "app", to: "ppsp", m: "Pay ₹250 to ramu@okaxis + encrypted PIN", d: "Priya scans Ramu's QR and enters her UPI PIN inside NPCI's secure library. The app creates transaction ID T123; it never sees the PIN.", st: "INITIATED" },
    { f: "ppsp", to: "npci", m: "ReqPay · T123", d: "Priya's PSP bank forwards the payment request to the NPCI switch." },
    { f: "npci", to: "rpsp", m: "Who is ramu@okaxis?", d: "NPCI asks the PSP that issued the UPI ID to resolve it. This is the DNS-like lookup." },
    { f: "rpsp", to: "npci", m: "HDFC a/c ••4321", d: "Ramu's PSP returns the real account details. Priya never sees them." },
    { f: "npci", to: "rbank", m: "Debit ₹250 · verify PIN", d: "NPCI asks Priya's bank to verify the encrypted PIN and device, then debit ₹250." },
    { f: "rbank", to: "npci", m: "Debited ✓", d: "Priya's bank debits the account and replies within the time limit.", st: "DEBITED", priya: -250 },
    { f: "npci", to: "bbank", m: "Credit ₹250", d: "NPCI asks Ramu's bank to credit his account." }
  ];
  var HAPPY = COMMON.concat([
    { f: "bbank", to: "npci", m: "Credited ✓", d: "Ramu's bank credits ₹250 and confirms.", st: "CREDITED", ramu: 250 },
    { f: "npci", to: "ppsp", m: "SUCCESS · T123", d: "NPCI records the transaction as successful and tells the payer's side.", st: "SUCCESS" },
    { f: "ppsp", to: "app", m: "✓ Paid ₹250", d: "Priya sees the green tick, usually within a couple of seconds of entering her PIN." },
    { f: "npci", to: "rpsp", m: "₹250 received", d: "Ramu's side is notified too: his soundbox announces the payment. Banks settle the real money later, in net batches." }
  ]);
  var FAIL = COMMON.concat([
    { f: "bbank", to: "npci", m: "… no reply (timeout)", d: "Ramu's bank doesn't answer within NPCI's time limit. Money has left Priya's account but hasn't verifiably arrived. NPCI marks it pending instead of guessing.", st: "PENDING", fail: true },
    { f: "npci", to: "ppsp", m: "PENDING · T123", d: "The payer's side is told the honest truth: the result isn't known yet." },
    { f: "ppsp", to: "app", m: "⏳ Payment pending", d: "Priya sees 'pending'. Her app does NOT retry the payment (that could pay twice)." },
    { f: "ppsp", to: "npci", m: "Check status T123 (after 90 s)", d: "After the minimum wait, the PSP asks for the final status once, using the same transaction ID. Checks are idempotent and rate-limited." },
    { f: "npci", to: "bbank", m: "Did you credit T123?", d: "NPCI asks Ramu's bank for the definitive result." },
    { f: "bbank", to: "npci", m: "No credit found", d: "The credit never happened." },
    { f: "npci", to: "rbank", m: "Reverse T123: refund ₹250", d: "NPCI triggers a reversal: a compensating action, like a saga's undo step.", st: "REVERSED" },
    { f: "rbank", to: "npci", m: "Refunded ✓", d: "Priya's bank puts the ₹250 back.", priya: 250 },
    { f: "npci", to: "ppsp", m: "FAILED · reversed", d: "Final state recorded: failed and reversed. Every rupee accounted for." },
    { f: "ppsp", to: "app", m: "↩ ₹250 refunded", d: "Priya is told the payment failed and her money is back. She can simply pay again with a new transaction." }
  ]);
  var steps, idx, state, priya, ramu, playing = null, scenario = "happy";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function center(n) { var o = NODES[n]; return [o.x + o.w / 2, o.y + o.h / 2]; }
  function drawBase(active) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    LINKS.forEach(function (l) { var a = center(l[0]), b = center(l[1]); svg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], "class": "d-line", style: "stroke:var(--line);stroke-width:3" })); });
    Object.keys(NODES).forEach(function (k) {
      var o = NODES[k], on = active && (active.f === k || active.to === k);
      svg.appendChild(el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 10, "class": o.c, style: on ? "stroke-width:3.5" : "" }));
      svg.appendChild(el("text", { x: o.x + o.w / 2, y: o.y + o.h / 2 - 2, "text-anchor": "middle", "class": "d-t" }, o.t));
      svg.appendChild(el("text", { x: o.x + o.w / 2, y: o.y + o.h / 2 + 15, "text-anchor": "middle", "class": "d-xs" }, o.s));
    });
  }
  function render(active, msgPos) {
    drawBase(active);
    if (active) {
      var a = center(active.f), b = center(active.to), p = msgPos == null ? 1 : msgPos;
      var x = a[0] + (b[0] - a[0]) * p, y = a[1] + (b[1] - a[1]) * p;
      svg.appendChild(el("circle", { cx: x, cy: y, r: 9, style: "fill:" + (active.fail ? "var(--bad)" : "var(--accent)") + ";stroke:var(--card);stroke-width:3" }));
      svg.appendChild(el("rect", { x: 130, y: 318, width: 500, height: 28, rx: 14, "class": active.fail ? "d-bad" : "d-acc" }));
      svg.appendChild(el("text", { x: 380, y: 337, "text-anchor": "middle", "class": "d-t" }, NODES[active.f].t + " → " + NODES[active.to].t + ":  " + active.m));
    }
    var stCol = state === "SUCCESS" ? "var(--good)" : state === "REVERSED" || state === "PENDING" ? "var(--amber)" : "var(--accent-ink)";
    $("#upiStatus").innerHTML = "<span>Transaction <b>T123</b></span><span>State <b style=\"color:" + stCol + "\">" + state + "</b></span><span>Priya <b>₹" + priya + "</b></span><span>Ramu <b>₹" + ramu + "</b></span><span>Step <b>" + idx + " / " + steps.length + "</b></span>";
  }
  function reset() {
    clearTimeout(playing); playing = null;
    steps = scenario === "happy" ? HAPPY : FAIL; idx = 0; state = "—"; priya = 1000; ramu = 300;
    $("#upiText").innerHTML = "Press <b>Next step</b> to send the first message. Priya has ₹1000, Ramu has ₹300.";
    $("#upiAuto").textContent = "Play all";
    render(null);
  }
  function next(done) {
    if (idx >= steps.length) { if (done) done(); return; }
    var st = steps[idx++];
    if (st.st) state = st.st;
    if (st.priya) priya += st.priya;
    if (st.ramu) ramu += st.ramu;
    $("#upiText").innerHTML = "<b>" + idx + ".</b> " + st.d;
    if (reduce) { render(st, 1); if (done) done(); return; }
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 650);
      render(st, p);
      if (p < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
  }
  function auto() {
    if (idx >= steps.length) { $("#upiAuto").textContent = "Play all"; playing = null; return; }
    next(function () { playing = setTimeout(auto, 900); });
  }
  $("#upiNext").addEventListener("click", function () { if (!playing) next(); });
  $("#upiAuto").addEventListener("click", function () {
    if (playing) { clearTimeout(playing); playing = null; this.textContent = "Play all"; return; }
    if (idx >= steps.length) reset();
    this.textContent = "Pause"; playing = true; auto();
  });
  $("#upiFail").addEventListener("click", function () {
    scenario = scenario === "happy" ? "fail" : "happy";
    this.textContent = "Scenario: " + (scenario === "happy" ? "happy path" : "bank timeout");
    this.classList.toggle("on", scenario === "fail");
    reset();
  });
  $("#upiReset").addEventListener("click", reset);
  reset();
});
