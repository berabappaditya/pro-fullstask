/* Chapter: CI/CD. Roll out v2 over 10 pods with rolling, blue-green or canary, optionally with a bug in v2.
 * Shows which users hit the bad version and how quickly each strategy rolls back. */
SDB.register("widget-deploy", function () {
  var $ = SDB.$, stage = $("#depStage");
  if (!stage) return;
  var N = 10, strat = "rolling", buggy = false, timer, state;

  $("#depControls").innerHTML =
    '<button class="btn on" data-s="rolling">Rolling</button><button class="btn" data-s="bluegreen">Blue-green</button><button class="btn" data-s="canary">Canary</button>' +
    '<label class="btn"><input type="checkbox" id="depBug"> v2 has a bug</label>' +
    '<button class="btn primary" id="depGo">Deploy v2</button><button class="btn" id="depReset">Reset</button>';

  function reset() {
    clearInterval(timer); timer = null;
    state = { blue: Array(N).fill("v1"), green: [], traffic: { v1: 100, v2: 0 }, step: 0, badReq: 0, done: false, rolledBack: false };
    $("#depLog").innerHTML = ""; render();
  }
  function plan() {
    if (strat === "rolling") {
      var steps = []; for (var i = 0; i < N; i += 2) steps.push({ replace: 2 });
      return steps;
    }
    if (strat === "bluegreen") return [{ greenUp: true }, { test: true }, { switchAll: true }, { retire: true }];
    return [{ canary: 1, pct: 10 }, { watch: true }, { canary: 3, pct: 30 }, { watch: true }, { canary: N, pct: 100 }];
  }
  function go() {
    reset();
    var steps = plan(), log = $("#depLog");
    SDB.log(log, "Deploying v2 with the <b>" + ({ rolling: "rolling", bluegreen: "blue-green", canary: "canary" })[strat] + "</b> strategy" + (buggy ? ' · <span class="err">v2 returns 5% errors</span>' : ""));
    timer = setInterval(function () {
      var s = steps[state.step++];
      if (!s || state.rolledBack) { clearInterval(timer); timer = null; finish(); return; }
      var v2 = state.blue.filter(function (x) { return x === "v2"; }).length;
      if (s.replace) {
        var k = 0; for (var i = 0; i < N && k < s.replace; i++) if (state.blue[i] === "v1") { state.blue[i] = "v2"; k++; }
        v2 = state.blue.filter(function (x) { return x === "v2"; }).length;
        state.traffic = { v1: (N - v2) * 10, v2: v2 * 10 };
        SDB.log(log, "Replaced 2 pods: " + v2 + "/" + N + " on v2. v1 and v2 serve side by side.");
        if (buggy && v2 >= 6) rollback("Error-rate alarm fired after the rollout reached " + v2 * 10 + "%. Rolling back means another rolling update to v1.");
      } else if (s.greenUp) { state.green = Array(N).fill("v2"); SDB.log(log, "Green stack: " + N + " v2 pods started beside the 10 blue (v1) pods. Users still 100% on blue. Capacity doubled temporarily."); }
      else if (s.test) {
        SDB.log(log, "Smoke tests against green's private URL" + (buggy ? ' <span class="warn">(passed: the bug only shows under real traffic)</span>' : " passed."));
      } else if (s.switchAll) {
        state.traffic = { v1: 0, v2: 100 };
        SDB.log(log, "Load balancer switched 100% of traffic to green at once.");
        if (buggy) rollback("Errors spike for all users. Switching the load balancer back to blue: instant rollback (blue is still running).");
      } else if (s.retire) { state.blue = Array(N).fill("off"); SDB.log(log, "After a bake period, blue is scaled down. Green is the new production."); }
      else if (s.canary) {
        for (var j = 0; j < s.canary; j++) state.blue[j] = "v2";
        state.traffic = { v1: 100 - s.pct, v2: s.pct };
        SDB.log(log, "Canary: " + s.pct + "% of traffic to v2.");
      } else if (s.watch) {
        if (buggy) rollback("Analysis: v2 error rate 5% vs v1 0.1% → automatic abort. Only " + state.traffic.v2 + "% of users ever saw v2.");
        else SDB.log(log, '<span class="ok">Analysis: v2 error rate and p99 latency match v1.</span> Promote.');
      }
      if (buggy) state.badReq += Math.round(state.traffic.v2 * 0.05 * 20);
      render();
    }, 1100);
  }
  function rollback(msg) {
    state.rolledBack = true;
    SDB.log($("#depLog"), '<span class="err">' + msg + '</span>');
    state.blue = state.blue.map(function (x) { return x === "off" ? "off" : "v1"; });
    if (strat === "bluegreen") state.blue = Array(N).fill("v1");
    state.green = state.green.length ? Array(N).fill("bad") : [];
    state.traffic = { v1: 100, v2: 0 };
  }
  function finish() {
    state.done = true;
    SDB.log($("#depLog"), state.rolledBack ? '<span class="warn">Rolled back. ~' + state.badReq + ' failed requests in total.</span>' : '<span class="ok">v2 fully live with zero downtime.</span>');
    render();
  }
  function pod(v) { return '<span class="dep-pod ' + v + '">' + (v === "off" ? "" : v === "bad" ? "v2 ✗" : v) + '</span>'; }
  function render() {
    stage.innerHTML = '<div class="dep-row"><small>' + (strat === "bluegreen" ? "blue" : "pods") + '</small>' + state.blue.map(pod).join("") + '</div>' +
      (strat === "bluegreen" ? '<div class="dep-row"><small>green</small>' + (state.green.length ? state.green.map(pod).join("") : '<em>not created</em>') + '</div>' : "") +
      '<div class="dep-traffic"><span class="v1" style="flex:' + Math.max(state.traffic.v1, 0.0001) + '">v1 ' + state.traffic.v1 + '%</span><span class="v2" style="flex:' + Math.max(state.traffic.v2, 0.0001) + '">v2 ' + state.traffic.v2 + '%</span></div>';
    $("#depStats").innerHTML = "<span>traffic on v2 <b>" + state.traffic.v2 + "%</b></span><span>failed user requests <b>" + state.badReq + "</b></span><span>extra capacity <b>" + (strat === "bluegreen" && state.green.length && state.blue[0] !== "off" ? "+100%" : strat === "canary" ? "+0–10%" : "+0%") + "</b></span>";
  }
  $("#depControls").addEventListener("click", function (e) {
    var b = e.target.closest("[data-s]"); if (!b) return;
    strat = b.getAttribute("data-s");
    SDB.$$("#depControls [data-s]").forEach(function (x) { x.classList.toggle("on", x === b); });
    reset();
  });
  $("#depBug").addEventListener("change", function (e) { buggy = e.target.checked; reset(); });
  $("#depGo").addEventListener("click", go);
  $("#depReset").addEventListener("click", reset);
  reset();
});
