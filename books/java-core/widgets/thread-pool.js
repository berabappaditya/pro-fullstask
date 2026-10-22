/* Chapter: Executors. A ThreadPoolExecutor with core 2, bounded queue 3, max 4.
 * Submit tasks to see the real order: core threads → queue → extra threads → rejection policy. */
SDB.register("widget-thread-pool", function () {
  var $ = SDB.$, stage = $("#poolStage");
  if (!stage) return;
  var CORE = 2, MAX = 4, QCAP = 3;
  var workers, queue, seq, rejected, completed, callerRan, policy;

  $("#poolControls").innerHTML =
    '<button class="btn primary" id="poolSubmit">submit(task)</button>' +
    '<button class="btn" id="poolBurst">submit × 5</button>' +
    '<button class="btn" id="poolFinish">a task finishes</button>' +
    '<select class="btn" id="poolPolicy" aria-label="Rejection policy"><option value="abort">AbortPolicy</option><option value="caller">CallerRunsPolicy</option><option value="discardOldest">DiscardOldestPolicy</option></select>' +
    '<button class="btn" id="poolReset">Reset</button>';

  function reset() {
    workers = []; queue = []; seq = 0; rejected = 0; completed = 0; callerRan = 0; policy = $("#poolPolicy").value;
    $("#poolLog").innerHTML = "";
    SDB.log($("#poolLog"), "new ThreadPoolExecutor(core=2, max=4, queue=ArrayBlockingQueue(3)). No threads yet: they start lazily.");
    render();
  }
  function submit() {
    var id = "T" + (++seq), log = $("#poolLog");
    if (workers.length < CORE) {
      workers.push({ name: "pool-" + (workers.length + 1), task: id, core: true });
      SDB.log(log, id + ': threads (' + (workers.length - 1) + ') &lt; core (2) → <span class="ok">start core thread</span>, run ' + id);
    } else {
      var idle = workers.filter(function (w) { return !w.task; })[0];
      if (idle && queue.length === 0) { idle.task = id; SDB.log(log, id + ": an idle thread (" + idle.name + ") picks it up immediately"); }
      else if (queue.length < QCAP) { queue.push(id); SDB.log(log, id + ': core threads busy → <span class="warn">queued</span> (' + queue.length + '/3). Note: no extra thread yet!'); }
      else if (workers.length < MAX) {
        workers.push({ name: "pool-" + (workers.length + 1), task: id, core: false });
        SDB.log(log, id + ': queue FULL and threads &lt; max (4) → <span class="ok">start EXTRA thread</span>, run ' + id + ' directly');
      } else reject(id);
    }
    render();
  }
  function reject(id) {
    var log = $("#poolLog");
    if (policy === "abort") { rejected++; SDB.log(log, '<span class="err">' + id + ': queue full and max threads → RejectedExecutionException</span> (AbortPolicy)'); }
    else if (policy === "caller") { callerRan++; completed++; SDB.log(log, '<span class="warn">' + id + ': saturated → the CALLER thread runs it itself</span> (CallerRunsPolicy). The submitter slows down: natural back-pressure.'); }
    else { var old = queue.shift(); queue.push(id); rejected++; SDB.log(log, '<span class="warn">' + id + ': saturated → oldest queued task ' + old + ' is DROPPED</span>, ' + id + ' queued (DiscardOldestPolicy)'); }
  }
  function finish() {
    var busy = workers.filter(function (w) { return w.task; });
    if (!busy.length) { SDB.log($("#poolLog"), "Nothing is running."); return; }
    var w = busy[0], log = $("#poolLog");
    SDB.log(log, w.name + " finished " + w.task + ".");
    completed++; w.task = null;
    if (queue.length) { w.task = queue.shift(); SDB.log(log, w.name + " takes " + w.task + " from the queue."); }
    else if (!w.core) {
      workers.splice(workers.indexOf(w), 1);
      SDB.log(log, w.name + ' is an extra thread with nothing to do → <span class="warn">dies after keepAliveTime</span>.');
    } else SDB.log(log, w.name + " is a core thread: stays alive, idle.");
    render();
  }
  function render() {
    var slots = "";
    for (var i = 0; i < MAX; i++) {
      var w = workers[i], extra = i >= CORE;
      slots += '<div class="pool-w' + (extra ? " extra" : "") + (w ? (w.task ? " busy" : " idle") : " none") + '"><small>' + (extra ? "extra" : "core") + '</small><b>' + (w ? w.name : "–") + '</b><span>' + (w ? (w.task || "idle") : "not started") + '</span></div>';
    }
    var q = "";
    for (var j = 0; j < QCAP; j++) q += '<div class="pool-q' + (queue[j] ? " full" : "") + '">' + (queue[j] || "") + '</div>';
    stage.innerHTML = '<div class="pool-col"><div class="pool-h">queue (capacity 3)</div><div class="pool-qrow">' + q + '</div></div>' +
      '<div class="pool-col"><div class="pool-h">threads (core 2 · max 4)</div><div class="pool-wrow">' + slots + '</div></div>';
    $("#poolStats").innerHTML = "<span>threads <b>" + workers.length + "</b></span><span>queued <b>" + queue.length + "</b></span><span>completed <b>" + completed + "</b></span><span>rejected/dropped <b>" + rejected + "</b></span>" + (callerRan ? "<span>ran by caller <b>" + callerRan + "</b></span>" : "");
  }
  $("#poolSubmit").addEventListener("click", submit);
  $("#poolBurst").addEventListener("click", function () { for (var i = 0; i < 5; i++) submit(); });
  $("#poolFinish").addEventListener("click", finish);
  $("#poolPolicy").addEventListener("change", function () { policy = this.value; SDB.log($("#poolLog"), "Rejection policy is now " + this.options[this.selectedIndex].text + "."); });
  $("#poolReset").addEventListener("click", reset);
  reset();
});
