/* Topic search: hides index entries whose chapter text doesn't contain the query. */
SDB.register("search", function () {
  var texts = {};
  SDB.$$("section.chapter").forEach(function (s) {
    texts[s.id] = (s.getAttribute("data-title") + " " + s.textContent).toLowerCase();
  });
  SDB.$("#tocSearch").addEventListener("input", function (e) {
    var q = e.target.value.trim().toLowerCase();
    SDB.$$(".toc li a").forEach(function (a) {
      var id = a.getAttribute("data-ch");
      a.classList.toggle("hide", !!q && (texts[id] || "").indexOf(q) === -1);
    });
  });
});
