/* Chapter: Garbage collection. A tiny generational heap: Eden (8), two survivor spaces (4 each), Old (10).
 * Allocate objects, drop references, run minor/full GCs and watch survivors age and get promoted.
 * The demo promotes at age 3 (HotSpot's default tenuring threshold is up to 15). */
SDB.register("widget-gc", function () {
  var $ = SDB.$, heap = $("#gcHeap");
  if (!heap) return;
  var EDEN = 8, SURV = 4, OLD = 10, TENURE = 3;
  var NAMES = ["Order", "String", "Line", "DTO", "byte[]", "Session", "Map", "Event", "Json", "Cart"];
  var eden, from, to, old, seq, minor, full, promoted, freed, oom;

  $("#gcControls").innerHTML =
    '<button class="btn primary" id="gcNew">new Object()</button>' +
    '<button class="btn" id="gcNew4">allocate × 4</button>' +
    '<button class="btn" id="gcDrop">requests finish (refs dropped)</button>' +
    '<button class="btn" id="gcMinor">minor GC</button>' +
    '<button class="btn" id="gcFull">full GC</button>' +
    '<button class="btn" id="gcReset">Reset</button>';

  function reset() {
    eden = []; from = []; to = []; old = []; seq = 0; minor = 0; full = 0; promoted = 0; freed = 0; oom = false;
    $("#gcLog").innerHTML = "";
    SDB.log($("#gcLog"), "Empty heap. New objects are born in Eden.");
    render();
  }
  function alloc() {
    if (oom) return;
    if (eden.length >= EDEN) { SDB.log($("#gcLog"), '<span class="warn">Eden is full</span> → the JVM triggers a minor GC before allocating.'); minorGC(); if (oom) return; }
    var o = { id: ++seq, n: NAMES[seq % NAMES.length], age: 0, live: true, sticky: Math.random() < 0.25 };
    eden.push(o);
    SDB.log($("#gcLog"), "new " + o.n + "#" + o.id + " in Eden");
    render();
  }
  function drop() {
    var died = 0;
    eden.concat(from).forEach(function (o) { if (o.live && !o.sticky) { o.live = false; died++; } });
    old.forEach(function (o) { if (o.live && Math.random() < 0.2) { o.live = false; died++; } });
    SDB.log($("#gcLog"), died + " object(s) became unreachable (requests ended). Most young objects die young; long-lived ones (caches, sessions) stay referenced.");
    render();
  }
  function minorGC() {
    minor++; var copied = 0, prom = 0, gone = 0;
    to = [];
    eden.concat(from).forEach(function (o) {
      if (!o.live) { gone++; return; }
      o.age++;
      if (o.age >= TENURE || to.length >= SURV) {
        if (old.length >= OLD) { fullGC(true); }
        if (old.length >= OLD) { oom = true; return; }
        old.push(o); prom++;
      } else { to.push(o); copied++; }
    });
    eden = []; from = to; to = []; promoted += prom; freed += gone;
    SDB.log($("#gcLog"), '<span class="ok">Minor GC #' + minor + '</span> (stop-the-world, fast): ' + gone + " freed, " + copied + " copied to the other survivor space, " + prom + " promoted to Old.");
    if (oom) SDB.log($("#gcLog"), '<span class="err">java.lang.OutOfMemoryError: Java heap space</span>. Old is full of LIVE objects: a leak or a heap that is too small. Reset to try again.');
    render();
  }
  function fullGC(auto) {
    full++; var before = old.length;
    old = old.filter(function (o) { return o.live; });
    eden = eden.filter(function (o) { return o.live; }); from = from.filter(function (o) { return o.live; });
    freed += before - old.length;
    SDB.log($("#gcLog"), '<span class="warn">' + (auto ? "Old is full → " : "") + 'Full GC #' + full + '</span> (slow: scans the whole heap): ' + (before - old.length) + " freed from Old.");
    render();
  }
  function cells(arr, cap) {
    var h = "";
    for (var i = 0; i < cap; i++) {
      var o = arr[i];
      h += o ? '<span class="gc-o' + (o.live ? "" : " dead") + '" title="' + o.n + '#' + o.id + ', age ' + o.age + (o.live ? "" : ", unreachable") + '">' + o.n + '<small>age ' + o.age + '</small></span>' : '<span class="gc-o empty"></span>';
    }
    return h;
  }
  function render() {
    heap.innerHTML =
      '<div class="gc-young"><div class="gc-h">Young generation</div><div class="gc-row">' +
      '<div class="gc-area eden"><div class="gc-n">Eden ' + eden.length + '/' + EDEN + '</div><div class="gc-cells">' + cells(eden, EDEN) + '</div></div>' +
      '<div class="gc-area surv"><div class="gc-n">Survivor (from) ' + from.length + '/' + SURV + '</div><div class="gc-cells">' + cells(from, SURV) + '</div></div>' +
      '<div class="gc-area surv"><div class="gc-n">Survivor (to) 0/' + SURV + '</div><div class="gc-cells">' + cells([], SURV) + '</div></div>' +
      '</div></div><div class="gc-old' + (oom ? " oom" : "") + '"><div class="gc-h">Old generation ' + old.length + '/' + OLD + '</div><div class="gc-cells">' + cells(old, OLD) + '</div></div>';
    $("#gcStats").innerHTML = "<span>minor GCs <b>" + minor + "</b></span><span>full GCs <b>" + full + "</b></span><span>promoted <b>" + promoted + "</b></span><span>freed <b>" + freed + "</b></span>";
  }
  $("#gcNew").addEventListener("click", alloc);
  $("#gcNew4").addEventListener("click", function () { for (var i = 0; i < 4; i++) alloc(); });
  $("#gcDrop").addEventListener("click", drop);
  $("#gcMinor").addEventListener("click", function () { if (!oom) minorGC(); });
  $("#gcFull").addEventListener("click", function () { if (!oom) fullGC(false); });
  $("#gcReset").addEventListener("click", reset);
  reset();
});
