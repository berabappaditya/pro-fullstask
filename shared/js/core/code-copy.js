/* Adds a Copy button to every code figure. Falls back to selecting the code if the clipboard is blocked. */
SDB.register("code-copy", function () {
  SDB.$$("figure.code").forEach(function (fig) {
    var btn = document.createElement("button");
    btn.className = "badge copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.addEventListener("click", function () {
      var code = fig.querySelector("code");
      function reset() { setTimeout(function () { btn.textContent = "Copy"; }, 1400); }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(code);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        btn.textContent = "Selected"; reset();
      }
      try {
        navigator.clipboard.writeText(code.textContent).then(function () { btn.textContent = "Copied"; reset(); }, fallback);
      } catch (e) { fallback(); }
    });
    fig.querySelector("figcaption").appendChild(btn);
  });
});
