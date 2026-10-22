/* Theme switcher: Auto (follows the OS) → Light → Dark. Remembered per browser. */
SDB.register("theme", function () {
  var root = document.documentElement, btn = SDB.$("#themeBtn"), label = SDB.$("#themeLbl");
  var modes = ["system", "light", "dark"];
  var mode = SDB.store.get("sdh-theme", "system");
  function apply(m) {
    if (m === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", m);
    label.textContent = m === "system" ? "Auto" : m === "light" ? "Light" : "Dark";
  }
  apply(mode);
  btn.addEventListener("click", function () {
    mode = modes[(modes.indexOf(mode) + 1) % modes.length];
    apply(mode); SDB.store.set("sdh-theme", mode);
  });
});
