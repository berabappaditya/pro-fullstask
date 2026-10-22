/*
 * Shared widget: a practice terminal with scripted commands (nothing really runs).
 *
 * <div class="widget" data-terminal>
 *   <div class="widget-head"><span class="live">Live</span>Title</div>
 *   <div class="widget-body">
 *     [script type="application/json"]{
 *       "prompt": "ramu@server:~$",
 *       "commands": [ { "cmd": "pwd", "out": "/home/ramu", "note": "print working directory" }, ... ]
 *     }[/script]   (a real script tag of type application/json)
 *   </div>
 * </div>
 *
 * Typing a command matches the first entry whose "cmd" equals it (or, for entries ending in " *", starts with it).
 */
SDB.register("widget-terminal", function () {
  SDB.$$("[data-terminal]").forEach(function (root) {
    var json = root.querySelector('script[type="application/json"]');
    if (!json) return;
    var cfg; try { cfg = JSON.parse(json.textContent); } catch (e) { console.error("[SDB] bad terminal JSON", e); return; }
    var body = root.querySelector(".widget-body");
    var prompt = cfg.prompt || "$";
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    body.insertAdjacentHTML("afterbegin",
      '<div class="chips term-chips">' + cfg.commands.map(function (c, i) { return '<button type="button" class="chip" title="' + esc(c.cmd) + '" data-i="' + i + '">' + esc(c.cmd.replace(/ \*$/, "")) + "</button>"; }).join("") + "</div>" +
      '<div class="term" role="log" aria-live="polite"><div class="term-out">' + (cfg.welcome ? '<div class="term-note">' + esc(cfg.welcome) + "</div>" : "") + '</div>' +
      '<form class="term-line"><span class="term-prompt">' + esc(prompt) + '</span><input class="term-in" aria-label="Type a command" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type a command, or tap one above"></form></div>');
    var out = body.querySelector(".term-out"), input = body.querySelector(".term-in"), form = body.querySelector(".term-line");
    function find(cmd) {
      cmd = cmd.trim().replace(/\s+/g, " ");
      for (var i = 0; i < cfg.commands.length; i++) {
        var c = cfg.commands[i];
        if (c.cmd === cmd) return c;
        if (/ \*$/.test(c.cmd) && cmd.indexOf(c.cmd.slice(0, -2)) === 0) return c;
      }
      return null;
    }
    function run(cmd) {
      if (!cmd.trim()) return;
      if (cmd.trim() === "clear") { out.innerHTML = ""; return; }
      var c = find(cmd);
      var html = '<div class="term-cmd"><span class="term-prompt">' + esc(prompt) + "</span> " + esc(cmd) + "</div>";
      if (c) {
        if (c.note) html += '<div class="term-note"># ' + esc(c.note) + "</div>";
        html += '<pre class="term-res">' + esc(c.out) + "</pre>";
      } else html += '<pre class="term-res term-err">' + esc(cmd.split(" ")[0]) + ": not part of this practice session. Try one of the chips above, or type clear.</pre>";
      out.insertAdjacentHTML("beforeend", html);
      out.parentNode.scrollTop = out.parentNode.scrollHeight;
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); run(input.value); input.value = ""; });
    body.querySelector(".term-chips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]"); if (!b) return;
      run(cfg.commands[+b.getAttribute("data-i")].cmd.replace(/ \*$/, ""));
    });
  });
});
