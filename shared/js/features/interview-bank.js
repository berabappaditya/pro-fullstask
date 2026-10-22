/* Interview question bank: topic chips, search, "I can answer this" ticks saved in this browser. Data: js/data/interview-bank.js */
SDB.register("interview-bank", function () {
  var $ = SDB.$, list = $("#bankList");
  if (!list) return;
  var B = SDB.data.interviewBank || [];
  var LVL = { core: "Core", mid: "Mid", senior: "Senior" };
  var cats = []; B.forEach(function (b) { if (cats.indexOf(b.c) === -1) cats.push(b.c); });
  var cat = "All", query = "", hideKnown = false;
  var known = SDB.store.get(SDB.key("bank-known"), []);

  function chips() {
    var html = ["All"].concat(cats).map(function (c) {
      var n = c === "All" ? B.length : B.filter(function (b) { return b.c === c; }).length;
      return '<button type="button" class="chip' + (c === cat ? " on" : "") + '" data-cat="' + c + '">' + c + "<small>" + n + "</small></button>";
    });
    html.push('<button type="button" class="chip' + (hideKnown ? " on" : "") + '" data-hide="1">Hide ones I know</button>');
    $("#bankCats").innerHTML = html.join("");
  }
  function render() {
    chips();
    var q = query.toLowerCase();
    var items = B.map(function (b, i) { return { b: b, i: i }; }).filter(function (x) {
      if (cat !== "All" && x.b.c !== cat) return false;
      if (hideKnown && known.indexOf(x.b.q) > -1) return false;
      return !q || (x.b.q + " " + x.b.a).toLowerCase().indexOf(q) > -1;
    });
    list.innerHTML = items.length ? items.map(function (x) {
      var k = known.indexOf(x.b.q) > -1;
      return '<details class="bank-item' + (k ? " known" : "") + '" data-i="' + x.i + '"><summary><span class="lvl lvl-' + x.b.lvl + '">' + LVL[x.b.lvl] + '</span><span class="q">' + x.b.q + '</span><span class="tick" aria-hidden="true"></span></summary>' +
        '<div class="ans">' + x.b.a + '<label class="known-toggle"><input type="checkbox" data-known="' + x.i + '"' + (k ? " checked" : "") + "> I can answer this</label></div></details>";
    }).join("") : '<p class="small">No questions match.</p>';
    $("#bankStat").textContent = known.length + " of " + B.length + " questions marked as known · showing " + items.length;
  }
  $("#bankCats").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.getAttribute("data-hide")) hideKnown = !hideKnown; else cat = b.getAttribute("data-cat");
    render();
  });
  $("#bankSearch").addEventListener("input", function (e) { query = e.target.value.trim(); render(); });
  list.addEventListener("change", function (e) {
    var t = e.target; if (!t.hasAttribute("data-known")) return;
    var qtext = B[+t.getAttribute("data-known")].q, pos = known.indexOf(qtext);
    if (t.checked && pos === -1) known.push(qtext);
    if (!t.checked && pos > -1) known.splice(pos, 1);
    SDB.store.set(SDB.key("bank-known"), known);
    t.closest(".bank-item").classList.toggle("known", t.checked);
    $("#bankStat").textContent = known.length + " of " + B.length + " questions marked as known";
  });
  render();
});
