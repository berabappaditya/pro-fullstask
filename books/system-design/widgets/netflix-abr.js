/* Chapter: Netflix. Adaptive bitrate simulator: one simulated second per tick, 4-second chunks, a 30-second buffer cap. */
SDB.register("widget-netflix-abr", function () {
  var $ = SDB.$, root = $("#w-abr");
  if (!root) return;
  var LADDER = [
    { q: "240p", kbps: 300, blur: 3.2 }, { q: "360p", kbps: 750, blur: 2.2 }, { q: "480p", kbps: 1500, blur: 1.4 },
    { q: "720p", kbps: 3000, blur: 0.6 }, { q: "1080p", kbps: 5800, blur: 0 }, { q: "4K", kbps: 16000, blur: 0 }
  ];
  var CHUNK = 4, MAX_BUFFER = 30, TICK_MS = 400;
  var s, timer = null;

  function reset() {
    stop();
    s = { t: 0, bw: 8, buffer: 0, dl: null, ewma: 0, mode: s ? s.mode : "adaptive", stalls: 0, state: "idle", showing: null, hist: [] };
    render();
  }
  function choose() {
    if (s.mode === "fixed") return LADDER[4];
    var safe = (s.ewma || 1000) * 0.8;
    if (s.buffer < 5) safe *= 0.5;
    for (var i = LADDER.length - 1; i >= 0; i--) if (LADDER[i].kbps <= safe) return LADDER[i];
    return LADDER[0];
  }
  function tick() {
    s.t++;
    var eff = s.bw * 1000 * (0.85 + Math.random() * 0.3);       // actual kbps this second
    if (!s.dl && s.buffer < MAX_BUFFER) { var r = choose(); s.dl = { rung: r, left: r.kbps * CHUNK }; }
    if (s.dl) {
      s.ewma = s.ewma ? s.ewma * 0.7 + eff * 0.3 : eff;
      s.dl.left -= eff;
      if (s.dl.left <= 0) { s.buffer += CHUNK; s.lastRung = s.dl.rung; s.dl = null; }
    }
    if (s.state === "starting" && s.buffer >= CHUNK) s.state = "playing";
    else if (s.state === "rebuffering" && s.buffer >= CHUNK) s.state = "playing";
    else if (s.state === "playing") {
      s.buffer = Math.max(0, s.buffer - 1);
      s.showing = s.lastRung;
      if (s.buffer <= 0) { s.state = "rebuffering"; s.stalls++; }
    }
    s.hist.push({ t: s.t, bw: eff, rate: s.dl ? s.dl.rung.kbps : (s.lastRung ? s.lastRung.kbps : 0) });
    if (s.hist.length > 60) s.hist.shift();
    render();
  }
  function start() { if (timer) return; if (s.state === "idle") s.state = "starting"; timer = setInterval(tick, TICK_MS); $("#abrPlay").textContent = "Pause"; }
  function stop() { clearInterval(timer); timer = null; var b = $("#abrPlay"); if (b) b.textContent = "Play"; }

  function render() {
    var scr = $("#abrScreen"), q = s.showing;
    $("#abrQuality").textContent = s.state === "rebuffering" ? "Buffering…" : q ? q.q : "—";
    $("#abrState").textContent = s.state === "idle" ? "press Play" : s.state === "starting" ? "starting…" : s.state === "rebuffering" ? "video frozen: buffer empty" : "playing · " + (s.mode === "fixed" ? "fixed 1080p" : "adaptive");
    scr.style.setProperty("--blur", (q && s.state === "playing" ? q.blur : 2) + "px");
    scr.classList.toggle("stalled", s.state === "rebuffering");
    $("#abrBuffer").style.width = Math.min(100, s.buffer / MAX_BUFFER * 100) + "%";
    root.querySelectorAll("[data-net]").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-net") === s.bw); });
    $("#abrStats").innerHTML = "<span>Buffer <b>" + s.buffer + " s</b></span><span>Bandwidth estimate <b>" + (s.ewma / 1000).toFixed(1) + " Mbps</b></span><span>Freezes <b style=\"color:" + (s.stalls ? "var(--bad)" : "var(--good)") + "\">" + s.stalls + "</b></span>";
    drawChart();
  }
  function drawChart() {
    var svg = $("#abrChart"), el = SDB.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var X0 = 56, X1 = 630, Y0 = 150, Y1 = 14, LMIN = Math.log10(200), LMAX = Math.log10(60000);
    function y(k) { return Y0 - (Math.log10(Math.max(200, k)) - LMIN) / (LMAX - LMIN) * (Y0 - Y1); }
    function x(i) { return X0 + i / 59 * (X1 - X0); }
    [500, 2000, 8000, 32000].forEach(function (k) {
      svg.appendChild(el("line", { x1: X0, x2: X1, y1: y(k), y2: y(k), "class": "d-line", style: "stroke:var(--line);stroke-width:1" }));
      svg.appendChild(el("text", { x: X0 - 6, y: y(k) + 4, "text-anchor": "end", "class": "d-xs" }, (k / 1000) + " Mbps"));
    });
    svg.appendChild(el("text", { x: X1, y: 166, "text-anchor": "end", "class": "d-xs" }, "last 60 seconds →"));
    if (s.hist.length < 2) { svg.appendChild(el("text", { x: 340, y: 86, "text-anchor": "middle", "class": "d-s" }, "Press Play, then switch networks")); return; }
    var off = 60 - s.hist.length, bw = "", rate = "";
    s.hist.forEach(function (h, i) {
      bw += (i ? "L" : "M") + x(i + off).toFixed(1) + " " + y(h.bw).toFixed(1);
      if (h.rate) rate += (rate ? "H" + x(i + off).toFixed(1) + "V" : "M" + x(i + off).toFixed(1) + " ") + y(h.rate).toFixed(1);
    });
    svg.appendChild(el("path", { d: bw, "class": "d-line", style: "stroke:var(--teal);stroke-width:2" }));
    if (rate) svg.appendChild(el("path", { d: rate, "class": "d-lacc", style: "stroke-width:3" }));
    svg.appendChild(el("rect", { x: X0 + 4, y: 2, width: 12, height: 4, style: "fill:var(--teal)" }));
    svg.appendChild(el("text", { x: X0 + 22, y: 8, "class": "d-xs" }, "available bandwidth"));
    svg.appendChild(el("rect", { x: X0 + 150, y: 2, width: 12, height: 4, style: "fill:var(--accent)" }));
    svg.appendChild(el("text", { x: X0 + 168, y: 8, "class": "d-xs" }, "quality the player requested"));
  }

  root.querySelectorAll("[data-net]").forEach(function (b) {
    b.addEventListener("click", function () { s.bw = +b.getAttribute("data-net"); render(); });
  });
  $("#abrPlay").addEventListener("click", function () { timer ? stop() : start(); });
  $("#abrMode").addEventListener("click", function () {
    s.mode = s.mode === "adaptive" ? "fixed" : "adaptive";
    this.textContent = "Mode: " + (s.mode === "adaptive" ? "adaptive" : "fixed 1080p");
    this.classList.toggle("on", s.mode === "fixed");
    render();
  });
  $("#abrReset").addEventListener("click", reset);
  reset();
});
