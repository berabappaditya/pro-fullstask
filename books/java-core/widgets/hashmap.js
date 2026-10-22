/* Chapter: HashMap internals. Put String keys and watch Java's real hash spreading, bucket index,
 * collisions, resize (load factor 0.75) and treeification. The demo starts at capacity 4 and
 * treeifies at 4 nodes (real HashMap: 16 and 8) so every behaviour shows up within a few clicks. */
SDB.register("widget-hashmap", function () {
  var $ = SDB.$, table = $("#hmTable");
  if (!table) return;
  var START_CAP = 4, LOAD = 0.75, TREEIFY = 4;
  var WORDS = ["chai", "samosa", "lassi", "dosa", "vada", "idli", "poha", "thali", "kulfi", "jalebi", "pakora", "upma"];
  var cap, buckets, size, badHash, next, lastIdx;

  /* Java's String.hashCode: s[0]*31^(n-1) + ... + s[n-1], in 32-bit int arithmetic */
  function javaHash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
  function spread(h) { return h ^ (h >>> 16); }
  function hashOf(k) { return badHash ? 42 : spread(javaHash(k)); }

  $("#hmControls").innerHTML =
    '<button class="btn primary" id="hmNext">put(next dish)</button>' +
    '<input class="btn" id="hmKey" placeholder="your key" style="width:120px" aria-label="Key to put">' +
    '<button class="btn" id="hmPut">put</button>' +
    '<button class="btn" id="hmGet">get</button>' +
    '<label class="btn"><input type="checkbox" id="hmBad"> bad hashCode() = 42</label>' +
    '<button class="btn" id="hmReset">Reset</button>';

  function reset() {
    cap = START_CAP; size = 0; next = 0; lastIdx = -1; buckets = [];
    for (var i = 0; i < cap; i++) buckets.push([]);
    $("#hmLog").innerHTML = "";
    SDB.log($("#hmLog"), "Empty map: capacity " + cap + ", threshold " + Math.floor(cap * LOAD) + " (capacity × 0.75).");
    render();
  }
  function idx(h, n) { return h & (n - 1); }

  function put(k, silent) {
    var h = hashOf(k), i = idx(h, cap), b = buckets[i];
    for (var j = 0; j < b.length; j++) if (b[j].k === k) {
      b[j].v++; lastIdx = i;
      SDB.log($("#hmLog"), 'put("' + k + '") → same key found in bucket ' + i + ' via equals(): <span class="warn">value replaced</span>');
      render(); return;
    }
    b.push({ k: k, h: h, v: 1 }); size++; lastIdx = i;
    var msg = 'put("' + k + '") hash=' + h + ' → index = hash &amp; (' + cap + '−1) = <b>' + i + '</b>';
    if (b.length > 1) msg += ' · <span class="err">collision</span>, chained after ' + (b.length - 1) + ' node(s)';
    if (b.length === TREEIFY) msg += ' · <span class="ok">bucket treeified</span> (red-black tree, O(log n))';
    if (!silent) SDB.log($("#hmLog"), msg);
    if (size > cap * LOAD) resize();
    render();
  }
  function resize() {
    var old = buckets, oldCap = cap, moved = 0;
    cap *= 2; buckets = [];
    for (var i = 0; i < cap; i++) buckets.push([]);
    old.forEach(function (b, i) {
      b.forEach(function (n) { var ni = idx(n.h, cap); if (ni !== i) moved++; buckets[ni].push(n); });
    });
    lastIdx = -1;
    SDB.log($("#hmLog"), '<span class="warn">size ' + size + ' &gt; ' + oldCap + ' × 0.75 → resize to ' + cap + '</span>. Each node stays at i or moves to i + ' + oldCap + ' (' + moved + ' moved).');
  }
  function get(k) {
    var h = hashOf(k), i = idx(h, cap), b = buckets[i], steps = 0, found = null;
    for (var j = 0; j < b.length; j++) { steps++; if (b[j].k === k) { found = b[j]; break; } }
    lastIdx = i; render();
    SDB.log($("#hmLog"), 'get("' + k + '") → bucket ' + i + ', ' + steps + ' equals() check(s): ' + (found ? '<span class="ok">found, value ' + found.v + '</span>' : '<span class="err">null (not present)</span>'));
  }
  function render() {
    var longest = 0;
    table.innerHTML = buckets.map(function (b, i) {
      longest = Math.max(longest, b.length);
      var tree = b.length >= TREEIFY;
      return '<div class="hm-bucket' + (i === lastIdx ? " hot" : "") + (tree ? " tree" : "") + '"><div class="hm-idx">' + i + (tree ? ' · tree' : '') + '</div>' +
        b.map(function (n) { return '<div class="hm-node" title="hash ' + n.h + '">' + n.k + '<small>=' + n.v + '</small></div>'; }).join("") + '</div>';
    }).join("");
    $("#hmStats").innerHTML = "<span>size <b>" + size + "</b></span><span>capacity <b>" + cap + "</b></span><span>resize at <b>&gt;" + Math.floor(cap * LOAD) + "</b></span><span>longest chain <b>" + longest + "</b></span>";
  }
  $("#hmNext").addEventListener("click", function () {
    if (next >= WORDS.length) { SDB.log($("#hmLog"), "All sample dishes added. Type your own key."); return; }
    put(WORDS[next++]);
  });
  function typed() { return ($("#hmKey").value || "").trim(); }
  $("#hmPut").addEventListener("click", function () { var k = typed(); if (k) put(k); });
  $("#hmGet").addEventListener("click", function () { var k = typed(); if (k) get(k); });
  $("#hmKey").addEventListener("keydown", function (e) { if (e.key === "Enter") { var k = typed(); if (k) put(k); } });
  $("#hmBad").addEventListener("change", function (e) {
    badHash = e.target.checked;
    var keys = []; buckets.forEach(function (b) { b.forEach(function (n) { keys.push(n.k); }); });
    var n = next; reset(); next = n;
    keys.forEach(function (k) { put(k, true); });
    SDB.log($("#hmLog"), badHash ? '<span class="err">Every key now hashes to 42</span>: all land in one bucket, lookups degrade to a long chain or tree.' : "Real String.hashCode() restored: keys spread out again.");
  });
  $("#hmReset").addEventListener("click", function () { badHash = false; $("#hmBad").checked = false; reset(); });
  reset();
});
