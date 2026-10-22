/* Chapter: Load balancing. Four servers, four algorithms, random request durations, a kill switch for server 3. */
SDB.register("widget-load-balancer", function () {
  var $ = SDB.$, wrap = $("#lbServers");
  if (!wrap) return;
  var clients = ["10.0.1.4", "10.0.2.9", "10.0.3.7", "10.0.4.2", "10.0.5.8", "10.0.6.1"];
  var servers, rrIdx, wrrIdx, reqNo;

  function reset() {
    servers = [1, 2, 3, 4].map(function (i) { return { name: "S" + i, weight: i === 1 ? 3 : 1, active: 0, total: 0, alive: true }; });
    rrIdx = 0; wrrIdx = 0; reqNo = 0;
    $("#lbLog").innerHTML = ""; $("#lbKill").textContent = "Kill server 3";
    render();
  }
  function render() {
    wrap.innerHTML = servers.map(function (s) {
      var h = Math.min(100, s.active / 6 * 100);
      return '<div class="srv' + (s.flash ? " flash" : "") + '" style="' + (s.alive ? "" : "opacity:.45;border-style:dashed") + '">' +
        '<h6><span>' + s.name + (s.weight > 1 ? ' <small>×' + s.weight + '</small>' : '') + '</span><small>' + (s.alive ? "up" : "DOWN") + '</small></h6>' +
        '<div class="meter"><i style="height:' + h + '%;' + (s.alive ? "" : "background:var(--bad)") + '"></i></div>' +
        '<small>active ' + s.active + ' · total ' + s.total + '</small></div>';
    }).join("");
    var alive = servers.filter(function (s) { return s.alive; }).length;
    $("#lbStats").innerHTML = "<span>Requests sent <b>" + reqNo + "</b></span><span>Healthy servers <b>" + alive + "</b></span>";
  }
  function hash(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function pick(algo, ip) {
    var alive = servers.filter(function (s) { return s.alive; });
    if (!alive.length) return null;
    if (algo === "rr") { var s = alive[rrIdx % alive.length]; rrIdx++; return s; }
    if (algo === "wrr") {
      var seq = []; alive.forEach(function (x) { for (var i = 0; i < x.weight; i++) seq.push(x); });
      var w = seq[wrrIdx % seq.length]; wrrIdx++; return w;
    }
    if (algo === "lc") return alive.reduce(function (a, b) { return b.active < a.active ? b : a; });
    return alive[hash(ip) % alive.length];
  }
  function send() {
    var algo = $("#lbAlgo").value, ip = clients[Math.floor(Math.random() * clients.length)], log = $("#lbLog");
    reqNo++;
    var s = pick(algo, ip);
    if (!s) { SDB.log(log, '<span class="err">#' + reqNo + ' from ' + ip + ' → 503: no healthy servers</span>'); render(); return; }
    var dur = 800 + Math.floor(Math.random() * 3200);
    s.active++; s.total++; s.flash = true;
    SDB.log(log, '#' + reqNo + ' from ' + ip + ' → <span class="ok">' + s.name + '</span> (' + (dur / 1000).toFixed(1) + ' s)');
    render();
    setTimeout(function () { s.flash = false; render(); }, 250);
    setTimeout(function () { s.active = Math.max(0, s.active - 1); render(); }, dur);
  }
  $("#lbSend").addEventListener("click", send);
  $("#lbBurst").addEventListener("click", function () { for (var i = 0; i < 12; i++) setTimeout(send, i * 90); });
  $("#lbKill").addEventListener("click", function () {
    var s = servers[2]; s.alive = !s.alive;
    this.textContent = s.alive ? "Kill server 3" : "Revive server 3";
    SDB.log($("#lbLog"), s.alive ? '<span class="ok">S3 passed its health check: back in rotation</span>' : '<span class="warn">S3 failed 3 health checks: removed from rotation</span>');
    render();
  });
  $("#lbReset").addEventListener("click", reset);
  $("#lbAlgo").addEventListener("change", function () { SDB.log($("#lbLog"), '<span class="warn">algorithm → ' + this.options[this.selectedIndex].text + '</span>'); });
  reset();
});
