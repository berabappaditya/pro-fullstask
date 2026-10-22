/* Chapter: Compute and autoscaling. A target-tracking policy keeps average CPU near 60%.
 * Move the traffic slider (or play the "evening rush" scenario); instances launch with a warm-up delay. */
SDB.register("widget-autoscale", function () {
  var $ = SDB.$, stage = $("#asStage");
  if (!stage) return;
  var MIN = 2, MAX = 12, TARGET = 60, CAP_PER = 100, WARMUP = 3;   // each instance handles 100 rps at 100% CPU
  var rps, inst, tick, timer, scenario, history;

  $("#asControls").innerHTML =
    '<label class="as-slider">traffic <input type="range" id="asRps" min="50" max="1200" step="10" value="150"> <b id="asRpsV">150</b> req/s</label>' +
    '<button class="btn primary" id="asRush">Play "evening rush"</button>' +
    '<button class="btn" id="asReset">Reset</button>';

  function reset() {
    pause(); scenario = null;
    rps = 150; inst = [{ age: 99 }, { age: 99 }]; tick = 0; history = [];
    $("#asRps").value = rps; $("#asRpsV").textContent = rps;
    $("#asLog").innerHTML = "";
    SDB.log($("#asLog"), "Policy: target average CPU 60%, min 2, max 12, warm-up " + WARMUP + " ticks.");
    render();
  }
  var visible = false;
  function run() { if (!timer && visible) timer = setInterval(step, 900); }
  function pause() { clearInterval(timer); timer = null; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); else pause(); }).observe(stage);
  } else { visible = true; }
  function ready() { return inst.filter(function (i) { return i.age >= WARMUP; }).length; }
  function step() {
    tick++;
    if (scenario) {
      var t = scenario.shift(); if (t === undefined) scenario = null; else { rps = t; $("#asRps").value = t; $("#asRpsV").textContent = t; }
    }
    inst.forEach(function (i) { i.age++; });
    var r = Math.max(1, ready()), cpu = Math.min(100, Math.round(rps / (r * CAP_PER) * 100));
    var desired = Math.min(MAX, Math.max(MIN, Math.ceil(rps / (CAP_PER * TARGET / 100))));
    if (desired > inst.length) {
      var add = desired - inst.length;
      for (var k = 0; k < add; k++) inst.push({ age: 0 });
      SDB.log($("#asLog"), '<span class="warn">CPU ' + cpu + '% &gt; 60% target</span> → launching ' + add + ' instance(s) (' + inst.length + ' total). They need ' + WARMUP + ' ticks to warm up.');
    } else if (desired < inst.length && tick % 3 === 0) {
      inst.pop();
      SDB.log($("#asLog"), '<span class="ok">CPU ' + cpu + '% well below target</span> → draining and terminating 1 instance (' + inst.length + ' left). Scale-in is deliberately slower.');
    }
    history.push(cpu); if (history.length > 40) history.shift();
    render(cpu);
  }
  function render(cpu) {
    var r = Math.max(1, ready());
    cpu = cpu === undefined ? Math.min(100, Math.round(rps / (r * CAP_PER) * 100)) : cpu;
    var cells = "";
    for (var n = 0; n < MAX; n++) {
      var i = inst[n];
      cells += '<div class="as-vm' + (!i ? " off" : i.age < WARMUP ? " warm" : "") + '">' +
        (i ? (i.age < WARMUP ? "booting" : '<i style="height:' + cpu + '%"></i><span>' + cpu + '%</span>') : "") + '</div>';
    }
    var pts = history.map(function (v, k) { return (k * 10) + "," + (60 - v * 0.55).toFixed(1); }).join(" ");
    stage.innerHTML = '<div class="as-grid">' + cells + '</div>' +
      '<svg class="as-chart" viewBox="0 0 400 64" preserveAspectRatio="none" aria-label="CPU history"><line x1="0" x2="400" y1="' + (60 - TARGET * 0.55) + '" y2="' + (60 - TARGET * 0.55) + '" class="as-target"/>' +
      (pts ? '<polyline points="' + pts + '" class="as-line"/>' : "") + '</svg>';
    var lat = cpu >= 95 ? "2,400 ms (queueing!)" : cpu >= 80 ? "380 ms" : "120 ms";
    $("#asStats").innerHTML = "<span>instances <b>" + inst.length + "</b> (" + ready() + " serving)</span><span>avg CPU <b>" + cpu + "%</b></span><span>p99 latency <b>" + lat + "</b></span><span>cost <b>₹" + (inst.length * 9) + "/h</b></span>";
  }
  $("#asRps").addEventListener("input", function () { rps = +this.value; scenario = null; $("#asRpsV").textContent = rps; render(); });
  $("#asRush").addEventListener("click", function () {
    scenario = [150, 200, 300, 450, 650, 850, 1000, 1100, 1100, 1100, 1000, 900, 700, 500, 350, 250, 200, 150, 150, 150];
    SDB.log($("#asLog"), "Evening rush starting: traffic climbs from 150 to 1,100 req/s and back.");
  });
  $("#asReset").addEventListener("click", function () { reset(); run(); });
  reset(); run();
});
