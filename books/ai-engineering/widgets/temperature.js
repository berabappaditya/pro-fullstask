/* Chapter: Sampling. "Masala chai needs tea, milk and ___". Adjust temperature and top-p, watch the
 * probability bars change, and sample the next token many times to see how often each word wins. */
SDB.register("widget-temperature", function () {
  var $ = SDB.$, bars = $("#tempBars");
  if (!bars) return;
  var TOKENS = [["ginger", 3.2], ["sugar", 2.7], ["cardamom", 2.4], ["water", 1.6], ["elaichi", 1.3], ["love", 0.4], ["pepper", 0.1], ["ketchup", -1.5]];
  var T = 0.7, P = 1.0, counts = {};

  $("#tempControls").innerHTML =
    '<label class="tp-slider">temperature <input type="range" id="tT" min="0" max="2" step="0.05" value="0.7"><b id="tTv">0.70</b></label>' +
    '<label class="tp-slider">top-p <input type="range" id="tP" min="0.1" max="1" step="0.05" value="1"><b id="tPv">1.00</b></label>' +
    '<button class="btn primary" id="tOne">Sample 1</button><button class="btn" id="tMany">Sample 100</button><button class="btn" id="tClear">Clear</button>';

  function probs() {
    var out;
    if (T < 0.01) { out = TOKENS.map(function (t, i) { return { t: t[0], p: i === 0 ? 1 : 0 }; }); }
    else {
      var ex = TOKENS.map(function (t) { return Math.exp(t[1] / T); }), sum = ex.reduce(function (a, b) { return a + b; }, 0);
      out = TOKENS.map(function (t, i) { return { t: t[0], p: ex[i] / sum }; });
    }
    var sorted = out.slice().sort(function (a, b) { return b.p - a.p; }), acc = 0, keep = {};
    sorted.forEach(function (o) { if (acc < P - 1e-9) { keep[o.t] = true; acc += o.p; } });
    var kept = out.filter(function (o) { return keep[o.t]; }).reduce(function (a, o) { return a + o.p; }, 0);
    return out.map(function (o) { return { t: o.t, raw: o.p, p: keep[o.t] ? o.p / kept : 0, cut: !keep[o.t] }; });
  }
  function sample(ps) {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < ps.length; i++) { acc += ps[i].p; if (r <= acc) return ps[i].t; }
    return ps[0].t;
  }
  function render() {
    var ps = probs(), total = Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0);
    bars.innerHTML = ps.map(function (o) {
      var c = counts[o.t] || 0;
      return '<div class="tp-row' + (o.cut ? " cut" : "") + '"><span class="tp-tok">' + o.t + '</span><span class="tp-bar"><i style="width:' + (o.p * 100).toFixed(1) + '%"></i></span><span class="tp-pct">' + (o.p * 100).toFixed(1) + '%</span><span class="tp-cnt">' + (total ? c + "×" : "") + '</span></div>';
    }).join("");
    var top = ps.slice().sort(function (a, b) { return b.p - a.p; })[0];
    var kept = ps.filter(function (o) { return !o.cut; }).length;
    $("#tempStats").innerHTML = "<span>most likely <b>" + top.t + " " + (top.p * 100).toFixed(0) + "%</b></span><span>candidates after top-p <b>" + kept + "</b></span><span>samples <b>" + total + "</b></span>";
  }
  function draw(n) {
    var ps = probs(), got = [];
    for (var i = 0; i < n; i++) { var t = sample(ps); counts[t] = (counts[t] || 0) + 1; if (i < 12) got.push(t); }
    SDB.log($("#tempLog"), "T=" + T.toFixed(2) + ", top-p=" + P.toFixed(2) + " → " + (n === 1 ? "Masala chai needs tea, milk and <b>" + got[0] + "</b>" : got.join(", ") + (n > 12 ? ", …" : "")));
    render();
  }
  $("#tT").addEventListener("input", function () { T = +this.value; $("#tTv").textContent = T.toFixed(2); render(); });
  $("#tP").addEventListener("input", function () { P = +this.value; $("#tPv").textContent = P.toFixed(2); render(); });
  $("#tOne").addEventListener("click", function () { draw(1); });
  $("#tMany").addEventListener("click", function () { draw(100); });
  $("#tClear").addEventListener("click", function () { counts = {}; $("#tempLog").innerHTML = ""; render(); });
  SDB.log($("#tempLog"), "Prompt: \"Masala chai needs tea, milk and ___\". Try T = 0 (always the top word), then T = 1.5.");
  render();
});
