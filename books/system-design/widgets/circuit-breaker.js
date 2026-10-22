/* Chapter: Reliability. Circuit breaker: opens after 3 failures in a row, half-opens after 5 seconds. */
SDB.register("widget-circuit-breaker", function () {
  var $ = SDB.$, callBtn = $("#cbCall");
  if (!callBtn) return;
  var state = "closed", fails = 0, openedAt = 0, healthy = true, WAIT = 5000, THRESHOLD = 3;
  function setState(s) {
    state = s;
    $("#cbClosed").classList.toggle("on", s === "closed");
    $("#cbOpen").classList.toggle("on", s === "open");
    $("#cbHalf").classList.toggle("on", s === "half");
  }
  setInterval(function () {
    if (state === "open" && Date.now() - openedAt >= WAIT) {
      setState("half");
      SDB.log($("#cbLog"), SDB.time() + ' <span class="warn">5 s passed → HALF-OPEN: next call is a test</span>');
    }
  }, 300);
  callBtn.addEventListener("click", function () {
    var log = $("#cbLog");
    if (state === "open") { SDB.log(log, SDB.time() + ' <span class="err">OPEN: failed fast in 0 ms</span> → fallback: last known price ₹15'); return; }
    if (state === "half") {
      if (healthy) { fails = 0; setState("closed"); SDB.log(log, SDB.time() + ' <span class="ok">test call succeeded → CLOSED</span>, normal traffic resumes'); }
      else { openedAt = Date.now(); setState("open"); SDB.log(log, SDB.time() + ' <span class="err">test call failed → OPEN again</span> for 5 s'); }
      return;
    }
    if (healthy) { fails = 0; SDB.log(log, SDB.time() + ' <span class="ok">200 OK</span> from supplier (120 ms)'); return; }
    fails++;
    SDB.log(log, SDB.time() + ' <span class="err">timeout after 1 s</span> · failures in a row: ' + fails);
    if (fails >= THRESHOLD) { openedAt = Date.now(); setState("open"); SDB.log(log, SDB.time() + ' <span class="warn">threshold reached → OPEN</span>: stop calling for 5 s'); }
  });
  $("#cbToggle").addEventListener("click", function () {
    healthy = !healthy;
    this.textContent = "Supplier is: " + (healthy ? "healthy" : "down");
    SDB.log($("#cbLog"), SDB.time() + ' supplier is now <b>' + (healthy ? "healthy" : "down") + '</b>');
  });
  setState("closed");
});
