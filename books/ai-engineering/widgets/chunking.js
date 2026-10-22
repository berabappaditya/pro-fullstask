/* Chapter: Chunking. Split a short policy document with fixed-size, sentence-aware or section-based
 * strategies; size and overlap are in words here (real splitters count tokens). */
SDB.register("widget-chunking", function () {
  var $ = SDB.$, doc = $("#chkDoc");
  if (!doc) return;
  var TEXT = [
    ["# Refund policy", "Orders delivered more than 30 minutes after the promised time are refunded in full. The promised time is shown in the app when you order. Refunds go back to the original payment method within 5 working days."],
    ["# Wrong items", "If you receive a wrong item, report it within 2 hours with a photo. We will send the correct item or refund it. Repeated reports from one account may be reviewed by our team."],
    ["# Loyalty points", "You earn 1 point for every 10 rupees spent. Points expire after 12 months. Points cannot be used on orders that are already discounted."]
  ];
  var mode = "fixed", size = 25, overlap = 5;
  $("#chkControls").innerHTML =
    '<button class="btn on" data-m="fixed">Fixed size</button><button class="btn" data-m="sentence">Sentence-aware</button><button class="btn" data-m="section">By section</button>' +
    '<label class="tp-slider">size <input type="range" id="chkSize" min="10" max="60" step="5" value="25"><b id="chkSizeV">25</b> words</label>' +
    '<label class="tp-slider">overlap <input type="range" id="chkOv" min="0" max="15" step="1" value="5"><b id="chkOvV">5</b></label>';

  function words(s) { return s.split(/\s+/).filter(Boolean); }
  function chunks() {
    var out = [];
    if (mode === "section") return TEXT.map(function (s) { return { title: s[0], text: s[1] }; });
    if (mode === "fixed") {
      var all = []; TEXT.forEach(function (s) { all = all.concat(words(s[0] + " " + s[1])); });
      var step = Math.max(1, size - overlap);
      for (var i = 0; i < all.length; i += step) { out.push({ text: all.slice(i, i + size).join(" "), start: i }); if (i + size >= all.length) break; }
      return out;
    }
    TEXT.forEach(function (s) {           /* sentence-aware: pack whole sentences up to the size, never across sections */
      var sents = s[1].match(/[^.]+\./g) || [s[1]], cur = [], n = 0;
      sents.forEach(function (st) {
        var w = words(st).length;
        if (n + w > size && cur.length) { out.push({ title: s[0], text: cur.join(" ").trim() }); cur = overlap > 0 ? cur.slice(-1) : []; n = cur.length ? words(cur[0]).length : 0; }
        cur.push(st.trim()); n += w;
      });
      if (cur.length) out.push({ title: s[0], text: cur.join(" ").trim() });
    });
    return out;
  }
  function render() {
    var cs = chunks(), broken = 0;
    doc.innerHTML = cs.map(function (c, i) {
      var t = c.text, cut = mode === "fixed" && !/[.]$/.test(t);
      if (cut) broken++;
      return '<div class="chk-chunk c' + (i % 4) + (cut ? " cut" : "") + '"><small>chunk ' + (i + 1) + (c.title ? " · " + c.title.replace("# ", "") : "") + ' · ' + words(t).length + ' words' + (cut ? " · cut mid-sentence" : "") + '</small>' + t.replace(/^# [^ ]+( [a-z]+)? ?/i, function (m) { return '<b>' + m + '</b>'; }) + '</div>';
    }).join("");
    var tip = mode === "fixed" ? "Simple, but chunks can start mid-sentence and lose their heading: 'They expire after 12 months' (what does?)." :
              mode === "sentence" ? "Whole sentences, never crossing sections; the section title travels as metadata so each chunk stays understandable." :
              "One chunk per section: coherent and easy to cite, but sections can be too long or too short for good retrieval.";
    $("#chkStats").innerHTML = "<span>chunks <b>" + cs.length + "</b></span><span>cut mid-sentence <b>" + broken + "</b></span><span class=\"chk-tip\">" + tip + "</span>";
    SDB.$$("#chkControls .tp-slider").forEach(function (l) { l.style.opacity = mode === "section" ? 0.4 : 1; });
  }
  $("#chkControls").addEventListener("click", function (e) {
    var b = e.target.closest("[data-m]"); if (!b) return;
    mode = b.getAttribute("data-m");
    SDB.$$("#chkControls [data-m]").forEach(function (x) { x.classList.toggle("on", x === b); });
    render();
  });
  $("#chkSize").addEventListener("input", function () { size = +this.value; $("#chkSizeV").textContent = size; if (overlap >= size) overlap = size - 1; render(); });
  $("#chkOv").addEventListener("input", function () { overlap = +this.value; $("#chkOvV").textContent = overlap; render(); });
  render();
});
