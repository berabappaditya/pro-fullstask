/* Chapter: Synchronization. counter++ is READ → ADD → WRITE. Step two threads by hand (or run the
 * "unlucky timing" script) to lose an update, then switch on synchronized and see thread B wait. */
SDB.register("widget-race", function () {
  var $ = SDB.$, grid = $("#raceGrid");
  if (!grid) return;
  var OPS = ["READ", "ADD", "WRITE"];
  var counter, th, lockOwner, sync, incs, timer;

  $("#raceControls").innerHTML =
    '<button class="btn" data-t="A">Thread A: next step</button>' +
    '<button class="btn" data-t="B">Thread B: next step</button>' +
    '<button class="btn primary" id="raceBad">Play unlucky timing</button>' +
    '<label class="btn"><input type="checkbox" id="raceSync"> synchronized</label>' +
    '<button class="btn" id="raceReset">Reset</button>';

  function reset() {
    clearInterval(timer); timer = null;
    counter = 0; incs = 0; lockOwner = null;
    th = { A: { pc: 0, reg: null, state: "RUNNABLE" }, B: { pc: 0, reg: null, state: "RUNNABLE" } };
    $("#raceLog").innerHTML = "";
    SDB.log($("#raceLog"), "Both threads will run counter++ once. Correct final value: 2." + (sync ? " synchronized is ON." : ""));
    render();
  }
  function stepThread(name) {
    var t = th[name], other = th[name === "A" ? "B" : "A"], log = $("#raceLog");
    if (t.pc >= 3) { SDB.log(log, "Thread " + name + " already finished its counter++."); return; }
    if (sync && t.pc === 0 && lockOwner && lockOwner !== name) {
      t.state = "BLOCKED"; render();
      SDB.log(log, '<span class="warn">Thread ' + name + ' is BLOCKED</span>: thread ' + lockOwner + " holds the lock. It must wait until " + lockOwner + " leaves the synchronized block.");
      return;
    }
    if (sync && t.pc === 0) { lockOwner = name; SDB.log(log, "Thread " + name + " acquires the lock."); }
    t.state = "RUNNABLE";
    var op = OPS[t.pc];
    if (op === "READ") { t.reg = counter; SDB.log(log, name + ": READ counter → its register holds " + t.reg); }
    else if (op === "ADD") { t.reg = t.reg + 1; SDB.log(log, name + ": ADD 1 in its register → " + t.reg + " (memory still says " + counter + ")"); }
    else {
      var lost = counter >= t.reg;
      counter = t.reg; incs++;
      SDB.log(log, name + ": WRITE " + t.reg + " to counter" + (lost ? ' · <span class="err">overwrote the other thread\'s update: one increment LOST</span>' : ""));
      if (sync) { lockOwner = null; SDB.log(log, "Thread " + name + " releases the lock."); if (other.state === "BLOCKED") other.state = "RUNNABLE"; }
    }
    t.pc++;
    if (incs === 2) SDB.log(log, counter === 2 ? '<span class="ok">Final counter = 2. Correct.</span>' : '<span class="err">Final counter = ' + counter + ', expected 2.</span> This is a race condition.');
    render();
  }
  function render() {
    function card(n) {
      var t = th[n];
      return '<div class="race-th' + (t.state === "BLOCKED" ? " blocked" : "") + (lockOwner === n ? " owner" : "") + '"><h6>Thread ' + n + '<span>' + (t.pc >= 3 ? "TERMINATED" : t.state) + '</span></h6>' +
        '<div class="race-ops">' + OPS.map(function (o, i) { return '<span class="' + (i < t.pc ? "done" : i === t.pc ? "next" : "") + '">' + o + '</span>'; }).join("") + '</div>' +
        '<div class="race-reg">register: <b>' + (t.reg === null ? "–" : t.reg) + '</b></div></div>';
    }
    grid.innerHTML = card("A") + '<div class="race-mem"><small>shared heap</small><b>counter = ' + counter + '</b>' + (sync ? '<em>' + (lockOwner ? "lock held by " + lockOwner : "lock free") + '</em>' : '<em>no lock</em>') + '</div>' + card("B");
    $("#raceStats").innerHTML = "<span>increments run <b>" + incs + "</b></span><span>counter <b>" + counter + "</b></span><span>lost updates <b>" + Math.max(0, incs - counter) + "</b></span>";
  }
  grid.parentNode.querySelector("#raceControls").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-t]"); if (b) stepThread(b.getAttribute("data-t"));
  });
  $("#raceBad").addEventListener("click", function () {
    reset();
    var script = ["A", "B", "A", "B", "A", "B"], i = 0;
    if (sync) script = ["A", "B", "A", "A", "B", "B", "B"];
    timer = setInterval(function () { if (i >= script.length) { clearInterval(timer); timer = null; return; } stepThread(script[i++]); }, 700);
  });
  $("#raceSync").addEventListener("change", function (e) { sync = e.target.checked; reset(); });
  $("#raceReset").addEventListener("click", reset);
  reset();
});
