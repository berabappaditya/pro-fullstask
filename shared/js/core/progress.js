/* "Mark chapter as done" checkboxes: saved in this browser, shown as ticks in the index and as a progress bar. */
SDB.register("progress", function () {
  var $ = SDB.$, $$ = SDB.$$;
  var KEY = SDB.key("done");
  var done = SDB.store.get(KEY, []);
  var boxes = $$("input[data-done]");
  var ids = boxes.map(function (b) { return b.getAttribute("data-done"); });

  function render() {
    boxes.forEach(function (b) { b.checked = done.indexOf(b.getAttribute("data-done")) > -1; });
    Object.keys(SDB.tocLinks || {}).forEach(function (id) { SDB.tocLinks[id].classList.toggle("done", done.indexOf(id) > -1); });
    var n = done.filter(function (id) { return ids.indexOf(id) > -1; }).length;
    var text = n + " of " + ids.length + " chapters done";
    $("#tbStat").textContent = text;
    $("#railStat").textContent = text;
    $("#railBar").style.width = (ids.length ? (n / ids.length) * 100 : 0) + "%";
  }
  boxes.forEach(function (b) {
    b.addEventListener("change", function () {
      var id = b.getAttribute("data-done");
      done = done.filter(function (x) { return x !== id; });
      if (b.checked) done.push(id);
      SDB.store.set(KEY, done);
      render();
    });
  });
  render();
});
