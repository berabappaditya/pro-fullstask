/* Chapter: Sharding. Consistent hashing ring vs hash % N: add/remove servers and count how many keys move. */
SDB.register("widget-hash-ring", function () {
  var $ = SDB.$, svg = $("#ringSvg");
  if (!svg) return;
  var el = SDB.svg;
  var colors = ["var(--accent)", "var(--good)", "var(--amber-line)", "var(--violet)", "var(--teal)", "var(--bad)"];
  var KEYS = []; for (var i = 0; i < 60; i++) KEYS.push("user:" + (1000 + i * 37));
  var servers, vnodes, nextId, lastMsg = "";

  function fnv(str) {
    var h = 0x811c9dc5;
    for (var j = 0; j < str.length; j++) { h ^= str.charCodeAt(j); h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
    return h >>> 0;
  }
  function points() {
    var pts = [];
    servers.forEach(function (s) { var n = vnodes ? 20 : 1; for (var v = 0; v < n; v++) pts.push({ pos: fnv(s.name + "#" + v), s: s }); });
    return pts.sort(function (a, b) { return a.pos - b.pos; });
  }
  function ownersRing() {
    var pts = points(), out = {};
    KEYS.forEach(function (k) {
      var h = fnv(k), o = pts[0].s;
      for (var j = 0; j < pts.length; j++) if (pts[j].pos >= h) { o = pts[j].s; break; }
      out[k] = o.name;
    });
    return out;
  }
  function ownersMod() { var out = {}; KEYS.forEach(function (k) { out[k] = servers[fnv(k) % servers.length].name; }); return out; }
  function draw() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var cx = 180, cy = 170, R = 130, ring = ownersRing(), counts = {};
    function xy(pos, r) { var a = pos / 4294967296 * Math.PI * 2 - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: R, "class": "d-line", style: "stroke-width:10;stroke:var(--line)" }));
    svg.appendChild(el("text", { x: cx, y: cy - 6, "text-anchor": "middle", "class": "d-t" }, "hash ring"));
    svg.appendChild(el("text", { x: cx, y: cy + 12, "text-anchor": "middle", "class": "d-xs" }, "0 → 2³² clockwise"));
    KEYS.forEach(function (k) {
      var s = servers.filter(function (x) { return x.name === ring[k]; })[0];
      counts[s.name] = (counts[s.name] || 0) + 1;
      var p = xy(fnv(k), R - 18);
      svg.appendChild(el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 4, style: "fill:" + s.color }));
    });
    points().forEach(function (pt) {
      var p = xy(pt.pos, R);
      svg.appendChild(el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: vnodes ? 5 : 9, style: "fill:" + pt.s.color + ";stroke:var(--card);stroke-width:2" }));
      if (!vnodes) { var lp = xy(pt.pos, R + 22); svg.appendChild(el("text", { x: lp[0].toFixed(1), y: (lp[1] + 4).toFixed(1), "text-anchor": "middle", "class": "d-t" }, pt.s.name)); }
    });
    var lx = 360, ly = 40;
    svg.appendChild(el("text", { x: lx, y: ly - 14, "class": "d-t" }, "Keys owned per server"));
    servers.forEach(function (s, idx) {
      var y = ly + idx * 40, c = counts[s.name] || 0, w = Math.max(2, c * 4);
      svg.appendChild(el("rect", { x: lx, y: y, width: 14, height: 14, rx: 3, style: "fill:" + s.color }));
      svg.appendChild(el("text", { x: lx + 22, y: y + 12, "class": "d-t" }, s.name));
      svg.appendChild(el("rect", { x: lx + 60, y: y + 1, width: w, height: 12, rx: 3, style: "fill:" + s.color + ";opacity:.75" }));
      svg.appendChild(el("text", { x: lx + 66 + w, y: y + 12, "class": "d-s" }, c + " keys"));
    });
    $("#ringStats").innerHTML = "<span>Servers <b>" + servers.length + "</b></span><span>Points on ring <b>" + points().length + "</b></span>" + (lastMsg ? "<span>" + lastMsg + "</span>" : "");
  }
  function change(fn) {
    var bR = ownersRing(), bM = ownersMod();
    fn();
    var aR = ownersRing(), aM = ownersMod(), mr = 0, mm = 0;
    KEYS.forEach(function (k) { if (bR[k] !== aR[k]) mr++; if (bM[k] !== aM[k]) mm++; });
    lastMsg = "Ring moved <b>" + mr + "</b> of 60 keys (" + Math.round(mr / 60 * 100) + "%) · hash % N would move <b style=\"color:var(--bad)\">" + mm + "</b> (" + Math.round(mm / 60 * 100) + "%)";
    draw();
  }
  function reset() {
    nextId = 5; vnodes = false; lastMsg = "";
    servers = [1, 2, 3, 4].map(function (n) { return { name: "S" + n, color: colors[n - 1] }; });
    $("#ringVnodes").textContent = "Virtual nodes: off";
    draw();
  }
  $("#ringAdd").addEventListener("click", function () {
    if (servers.length >= 6) { lastMsg = "Maximum of 6 servers in this demo"; draw(); return; }
    change(function () {
      var used = servers.map(function (s) { return s.color; });
      servers.push({ name: "S" + nextId++, color: colors.filter(function (c) { return used.indexOf(c) === -1; })[0] });
    });
  });
  $("#ringRemove").addEventListener("click", function () {
    if (servers.length <= 2) { lastMsg = "Keep at least 2 servers"; draw(); return; }
    change(function () { servers.splice(1, 1); });
  });
  $("#ringVnodes").addEventListener("click", function () {
    vnodes = !vnodes;
    this.textContent = "Virtual nodes: " + (vnodes ? "on (20 each)" : "off");
    lastMsg = "Notice how much more even the key counts are with virtual nodes on.";
    draw();
  });
  $("#ringReset").addEventListener("click", reset);
  reset();
});
