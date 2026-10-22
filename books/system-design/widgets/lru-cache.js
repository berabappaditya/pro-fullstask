/* Chapter: Caching. An LRU cache with capacity 4: hits move to the front, misses insert and may evict the oldest. */
SDB.register("widget-lru", function () {
  var $ = SDB.$, row = $("#lruRow");
  if (!row) return;
  var CAP = 4, list = [], hits = 0, misses = 0, keys = ["A", "B", "C", "D", "E", "F"], kc = $("#lruKeys");
  kc.innerHTML = '<span class="small">Read key:</span>' + keys.map(function (k) { return '<button class="btn" data-k="' + k + '">' + k + '</button>'; }).join("") + '<button class="btn" data-reset="1">Reset</button>';
  function render(hitKey, newKey) {
    var html = list.map(function (k) { return '<div class="lru-cell' + (k === hitKey ? " hit" : "") + (k === newKey ? " new" : "") + '">' + k + '</div>'; });
    for (var i = list.length; i < CAP; i++) html.push('<div class="lru-cell empty">empty</div>');
    row.innerHTML = html.join("");
    var n = hits + misses;
    $("#lruStats").innerHTML = "<span>Hits <b>" + hits + "</b></span><span>Misses <b>" + misses + "</b></span><span>Hit rate <b>" + (n ? Math.round(hits / n * 100) : 0) + "%</b></span>";
  }
  kc.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var log = $("#lruLog");
    if (b.getAttribute("data-reset")) { list = []; hits = misses = 0; log.innerHTML = ""; render(); return; }
    var k = b.getAttribute("data-k"), i = list.indexOf(k);
    if (i > -1) {
      hits++; list.splice(i, 1); list.unshift(k);
      SDB.log(log, '<span class="ok">GET ' + k + ' → HIT</span> (moved to front)'); render(k, null);
    } else {
      misses++; list.unshift(k);
      var msg = '<span class="err">GET ' + k + ' → MISS</span>, loaded from DB';
      if (list.length > CAP) msg += ', <span class="warn">evicted ' + list.pop() + ' (least recently used)</span>';
      SDB.log(log, msg); render(null, k);
    }
  });
  render();
});
