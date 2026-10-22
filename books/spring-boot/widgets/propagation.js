/* Chapter: Transactions. OrderService.placeOrder() (outer) saves an order row and calls
 * AuditService.record() (inner, a different bean) which saves an audit row.
 * Choose the outer's transaction, the inner's propagation and where it fails; see what is committed. */
SDB.register("widget-propagation", function () {
  var $ = SDB.$, stage = $("#propStage");
  if (!stage) return;
  var PROPS = ["REQUIRED", "REQUIRES_NEW", "NESTED", "SUPPORTS", "MANDATORY", "NOT_SUPPORTED", "NEVER"];
  var FAILS = [["none", "nothing fails"], ["inner", "inner throws, outer catches it"], ["outer", "outer throws after inner returns"]];
  var s = { outerTx: true, prop: "REQUIRED", fail: "inner" };

  $("#propControls").innerHTML =
    '<label class="btn"><input type="checkbox" id="pOuter" checked> outer is @Transactional</label>' +
    '<select class="btn" id="pProp" aria-label="Inner propagation">' + PROPS.map(function (p) { return '<option>' + p + '</option>'; }).join("") + '</select>' +
    '<select class="btn" id="pFail" aria-label="Failure">' + FAILS.map(function (f) { return '<option value="' + f[0] + '"' + (f[0] === s.fail ? " selected" : "") + '>' + f[1] + '</option>'; }).join("") + '</select>';

  function run() {
    var ev = [], T1 = s.outerTx, inner, illegal = null;
    if (T1) ev.push(["acc", "outer: BEGIN T1"]); else ev.push(["", "outer: no transaction (each statement auto-commits)"]);
    ev.push(["", "outer: INSERT order"]);
    var p = s.prop;
    if (p === "REQUIRED") inner = T1 ? "join" : "new";
    else if (p === "REQUIRES_NEW") inner = "new";
    else if (p === "NESTED") inner = T1 ? "savepoint" : "new";
    else if (p === "SUPPORTS") inner = T1 ? "join" : "none";
    else if (p === "MANDATORY") { if (T1) inner = "join"; else illegal = "No existing transaction found for transaction marked with propagation 'mandatory'"; }
    else if (p === "NOT_SUPPORTED") inner = "none";
    else if (p === "NEVER") { if (T1) illegal = "Existing transaction found for transaction marked with propagation 'never'"; else inner = "none"; }

    var orderSaved, auditSaved = false, toCaller = "returns normally", rollbackOnly = false;
    if (illegal) {
      ev.push(["bad", "inner: IllegalTransactionStateException: " + illegal + " (record() never runs)"]);
      if (T1) { ev.push(["bad", "outer: exception propagates → ROLLBACK T1"]); orderSaved = false; }
      else { ev.push(["bad", "outer: exception propagates (order already auto-committed)"]); orderSaved = true; }
      toCaller = "IllegalTransactionStateException";
      return finish(ev, orderSaved, false, toCaller);
    }
    var label = { join: "joins T1", "new": (T1 ? "suspends T1, BEGIN T2" : "BEGIN T2"), savepoint: "creates SAVEPOINT inside T1", none: (T1 ? "suspends T1, runs with no transaction" : "runs with no transaction") }[inner];
    ev.push(["acc", "inner (" + p + "): " + label]);
    ev.push(["", "inner: INSERT audit"]);
    var innerWrite = true;
    if (s.fail === "inner") {
      ev.push(["bad", "inner: throws RuntimeException"]);
      if (inner === "join") { rollbackOnly = true; innerWrite = "pending"; ev.push(["warn", "inner proxy: marks shared T1 rollback-only"]); }
      else if (inner === "new") { innerWrite = false; ev.push(["warn", "inner: ROLLBACK T2" + (T1 ? ", resume T1" : "")]); }
      else if (inner === "savepoint") { innerWrite = false; ev.push(["warn", "inner: ROLLBACK TO SAVEPOINT (only the audit insert is undone)"]); }
      else { innerWrite = true; ev.push(["warn", "inner: nothing to roll back: the audit insert already auto-committed" + (T1 ? "; resume T1" : "")]); }
      ev.push(["", "outer: catch (RuntimeException e) { log + continue }"]);
    } else {
      if (inner === "new") { ev.push(["good", "inner: COMMIT T2" + (T1 ? ", resume T1" : "")]); innerWrite = true; }
      else if (inner === "join" || inner === "savepoint") { innerWrite = "pending"; ev.push(["", "inner: returns (its insert is part of T1)"]); }
      else { innerWrite = true; ev.push(["", "inner: returns (insert auto-committed)" + (T1 ? "; resume T1" : "")]); }
    }
    if (s.fail === "outer") {
      ev.push(["bad", "outer: throws RuntimeException"]);
      if (T1) { ev.push(["bad", "outer proxy: ROLLBACK T1"]); orderSaved = false; if (innerWrite === "pending") innerWrite = false; }
      else { orderSaved = true; ev.push(["warn", "no outer transaction: the order insert was already auto-committed"]); }
      toCaller = "RuntimeException";
    } else if (T1) {
      if (rollbackOnly) {
        ev.push(["bad", "outer proxy: tries to COMMIT T1, finds it rollback-only → ROLLBACK"]);
        orderSaved = false; innerWrite = false; toCaller = "UnexpectedRollbackException (surprise!)";
      } else { ev.push(["good", "outer proxy: COMMIT T1"]); orderSaved = true; if (innerWrite === "pending") innerWrite = true; }
    } else orderSaved = true;
    auditSaved = innerWrite === true;
    return finish(ev, orderSaved, auditSaved, toCaller);
  }
  function finish(ev, order, audit, caller) {
    stage.innerHTML = '<ol class="prop-log">' + ev.map(function (e) { return '<li class="' + e[0] + '">' + e[1] + '</li>'; }).join("") + '</ol>' +
      '<div class="prop-result"><div class="' + (order ? "ok" : "lost") + '"><small>order row</small><b>' + (order ? "saved" : "rolled back") + '</b></div>' +
      '<div class="' + (audit ? "ok" : "lost") + '"><small>audit row</small><b>' + (audit ? "saved" : "not saved") + '</b></div>' +
      '<div class="' + (/Exception/.test(caller) ? "lost" : "ok") + '"><small>caller sees</small><b>' + caller + '</b></div></div>';
    var tip = {
      REQUIRED: "Default. One shared transaction: all or nothing. A caught inner failure still dooms the whole transaction.",
      REQUIRES_NEW: "Independent transaction on a second connection. Perfect for audit logs that must survive the caller's rollback.",
      NESTED: "A savepoint inside the outer transaction (JDBC/DataSourceTransactionManager; JPA support is limited). Inner failure undoes only the inner work.",
      SUPPORTS: "Joins a transaction if there is one, otherwise runs without. Fine for read helpers.",
      MANDATORY: "Asserts the caller already started a transaction. A guard for methods that must never run alone.",
      NOT_SUPPORTED: "Suspends any transaction. For slow non-transactional work you don't want holding a transaction open.",
      NEVER: "Fails if a transaction exists. Rare."
    }[s.prop];
    $("#propExplain").innerHTML = "<b>" + s.prop + ":</b> " + tip;
  }
  $("#pOuter").addEventListener("change", function (e) { s.outerTx = e.target.checked; run(); });
  $("#pProp").addEventListener("change", function (e) { s.prop = e.target.value; run(); });
  $("#pFail").addEventListener("change", function (e) { s.fail = e.target.value; run(); });
  run();
});
