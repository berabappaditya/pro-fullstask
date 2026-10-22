/* Chapter: Streams. dishes.stream().filter(price > 50).map(name).limit(2).toList()
 * Step through one element at a time to see that streams are lazy and vertical:
 * each item travels the whole pipeline before the next one starts, and limit() stops the source early. */
SDB.register("widget-stream", function () {
  var $ = SDB.$, lanes = $("#stLanes");
  if (!lanes) return;
  var DISHES = [["Chai", 15], ["Thali", 120], ["Samosa", 20], ["Biryani", 180], ["Dosa", 90], ["Lassi", 60], ["Idli", 40]];
  var STAGES = ["source", "filter(p &gt; 50)", "map(toUpperCase)", "limit(2)", "toList()"];
  var useLimit = true, events, pos, timer, cols, pulled, done;

  $("#stControls").innerHTML =
    '<button class="btn primary" id="stStep">Next step</button>' +
    '<button class="btn" id="stPlay">Play all</button>' +
    '<label class="btn"><input type="checkbox" id="stLimit" checked> include limit(2)</label>' +
    '<button class="btn" id="stReset">Reset</button>';

  function build() {
    /* precompute the exact order a sequential stream evaluates in */
    events = []; var taken = 0;
    for (var i = 0; i < DISHES.length; i++) {
      if (useLimit && taken >= 2) { events.push({ end: true, msg: '<span class="ok">limit(2) is satisfied: the pipeline stops.</span> ' + (DISHES.length - i) + ' dish(es) are never even read from the source.' }); break; }
      var d = DISHES[i];
      events.push({ st: 0, item: d[0] + " ₹" + d[1], msg: "source emits <b>" + d[0] + "</b> (₹" + d[1] + ")" });
      if (d[1] <= 50) { events.push({ st: 1, item: d[0], bad: true, msg: "filter: ₹" + d[1] + ' &gt; 50? <span class="err">no, dropped</span>. Next element.' }); continue; }
      events.push({ st: 1, item: d[0], msg: "filter: ₹" + d[1] + ' &gt; 50? <span class="ok">yes</span>, pass it on' });
      events.push({ st: 2, item: d[0].toUpperCase(), msg: "map: " + d[0] + " → " + d[0].toUpperCase() });
      if (useLimit) { taken++; events.push({ st: 3, item: d[0].toUpperCase(), msg: "limit: element " + taken + " of 2" }); }
      events.push({ st: 4, item: d[0].toUpperCase(), msg: "collected into the list" });
    }
    if (!events.length || !events[events.length - 1].end) events.push({ end: true, msg: '<span class="ok">Source exhausted.</span> Every dish was read once, and only once.' });
  }
  function reset() {
    clearInterval(timer); timer = null; $("#stPlay").textContent = "Play all";
    build(); pos = 0; pulled = 0; done = false;
    cols = STAGES.map(function () { return []; });
    $("#stLog").innerHTML = "";
    SDB.log($("#stLog"), "Nothing has run yet. Intermediate operations are lazy: only the terminal toList() starts pulling.");
    render();
  }
  function step() {
    if (pos >= events.length) { done = true; return false; }
    var e = events[pos++];
    if (e.end) done = true;
    else {
      if (e.st === 0) pulled++;
      cols[e.st].push({ t: e.item, bad: e.bad });
    }
    SDB.log($("#stLog"), e.msg);
    render(e.st);
    return pos < events.length;
  }
  function render(active) {
    var shown = STAGES.filter(function (s, i) { return useLimit || i !== 3; });
    lanes.innerHTML = STAGES.map(function (name, i) {
      if (!useLimit && i === 3) return "";
      return '<div class="st-lane' + (i === active ? " hot" : "") + '"><div class="st-name">' + name + '</div>' +
        cols[i].map(function (c) { return '<span class="st-item' + (c.bad ? " bad" : "") + '">' + c.t + '</span>'; }).join("") + '</div>';
    }).join("");
    lanes.style.setProperty("--cols", shown.length);
    $("#stStats").innerHTML = "<span>read from source <b>" + pulled + " / " + DISHES.length + "</b></span><span>result <b>[" + cols[4].map(function (c) { return c.t; }).join(", ") + "]</b></span>";
  }
  $("#stStep").addEventListener("click", function () { if (!done) step(); });
  $("#stPlay").addEventListener("click", function () {
    if (timer) { clearInterval(timer); timer = null; this.textContent = "Play all"; return; }
    if (done) reset();
    var btn = this; btn.textContent = "Pause";
    timer = setInterval(function () { if (!step()) { clearInterval(timer); timer = null; btn.textContent = "Play all"; } }, 650);
  });
  $("#stLimit").addEventListener("change", function (e) { useLimit = e.target.checked; reset(); });
  $("#stReset").addEventListener("click", reset);
  reset();
});
