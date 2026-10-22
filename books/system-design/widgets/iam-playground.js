/* Chapter: IAM. A small policy engine: walk up the resource tree, explicit deny wins, then allow, then step-up, else default deny. */
SDB.register("widget-iam", function () {
  var $ = SDB.$, out = $("#iamDecision");
  if (!out) return;
  var ROLES = {
    Viewer: ["read"], Editor: ["read", "write"], Admin: ["*"], PayrollApprover: ["payout.approve"], Deleter: ["delete"]
  };
  var USERS = {
    asha: { name: "Asha (owner, Admin at org)", groups: [] },
    ravi: { name: "Ravi (finance team)", groups: ["finance-team"] },
    meera: { name: "Meera (contractor)", groups: ["contractors"] },
    bablu: { name: "Bablu (Kolkata staff)", groups: [] }
  };
  // name, parent, bindings: [principal, role, effect, minLevel]
  var TREE = {
    "ramu-chai":      { parent: null, b: [["user:asha", "Admin", "ALLOW", 2]] },
    "finance":        { parent: "ramu-chai", b: [["group:finance-team", "Viewer", "ALLOW", 1]] },
    "payroll":        { parent: "finance", b: [["user:ravi", "Editor", "ALLOW", 1], ["user:ravi", "PayrollApprover", "ALLOW", 2]] },
    "salary-sheet":   { parent: "payroll", b: [] },
    "payout-api":     { parent: "payroll", b: [] },
    "operations":     { parent: "ramu-chai", b: [["group:contractors", "Editor", "ALLOW", 1], ["group:contractors", "Deleter", "DENY", 1]] },
    "kolkata-branch": { parent: "operations", b: [["user:bablu", "Viewer", "ALLOW", 1]] },
    "menu":           { parent: "kolkata-branch", b: [] },
    "sales-report":   { parent: "kolkata-branch", b: [] }
  };
  var ACTIONS = ["read", "write", "delete", "payout.approve"];
  function path(r) { var p = []; for (var n = r; n; n = TREE[n].parent) p.unshift(n); return "/" + p.join("/"); }
  function grants(role, perm) { return ROLES[role].some(function (p) { return p === "*" || p === perm; }); }
  function applies(principal, uid) {
    return principal === "user:" + uid || USERS[uid].groups.some(function (g) { return principal === "group:" + g; });
  }
  function fill(sel, items, label) { sel.innerHTML = items.map(function (k) { return '<option value="' + k + '">' + label(k) + "</option>"; }).join(""); }
  fill($("#iamUser"), Object.keys(USERS), function (k) { return USERS[k].name; });
  fill($("#iamAction"), ACTIONS, function (k) { return k; });
  fill($("#iamRes"), Object.keys(TREE), function (k) { return path(k); });
  $("#iamUser").value = "ravi"; $("#iamAction").value = "payout.approve"; $("#iamRes").value = "payout-api";

  function evaluate() {
    var uid = $("#iamUser").value, perm = $("#iamAction").value, res = $("#iamRes").value, level = +$("#iamLevel").value;
    var trace = [], found = [];
    for (var n = res; n; n = TREE[n].parent) {
      var hits = TREE[n].b.filter(function (b) { return applies(b[0], uid) && grants(b[1], perm); });
      var others = TREE[n].b.filter(function (b) { return applies(b[0], uid) && !grants(b[1], perm); });
      var line = "<code>" + n + "</code>: ";
      if (hits.length) line += hits.map(function (b) { found.push(b.concat([n])); return '<span class="' + (b[2] === "DENY" ? "err" : "ok") + '">' + b[0] + " → " + b[1] + " (" + b[2].toLowerCase() + (b[3] > 1 ? ", needs level " + b[3] : "") + ") grants " + perm + "</span>"; }).join("; ");
      else if (others.length) line += "bindings for this user exist (" + others.map(function (b) { return b[1]; }).join(", ") + ") but none grants <b>" + perm + "</b>";
      else line += "no bindings for this user";
      trace.push(line);
    }
    var decision, cls, reason;
    var deny = found.filter(function (b) { return b[2] === "DENY"; })[0];
    var allowOk = found.filter(function (b) { return b[2] === "ALLOW" && level >= b[3]; })[0];
    var allowWeak = found.filter(function (b) { return b[2] === "ALLOW" && level < b[3]; })[0];
    if (deny) { decision = "DENY"; cls = "deny"; reason = "Explicit deny: " + deny[0] + " → " + deny[1] + " on " + deny[4] + ". A deny overrides every allow."; }
    else if (allowOk) { decision = "ALLOW"; cls = "allow"; reason = allowOk[1] + " role, bound to " + allowOk[0] + " on " + allowOk[4] + ", inherited down to " + res + "."; }
    else if (allowWeak) { decision = "STEP UP"; cls = "step"; reason = "Allowed by " + allowWeak[1] + " on " + allowWeak[4] + ", but only at authentication level " + allowWeak[3] + ". Ask for the OTP, raise the session level, and retry."; }
    else { decision = "DENY"; cls = "deny"; reason = "No binding anywhere from " + res + " up to the organisation grants " + perm + ". Default deny."; }
    out.className = "iam-decision " + cls;
    out.innerHTML = "<b>" + decision + "</b><span>" + reason + "</span>";
    $("#iamTrace").innerHTML = trace.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "<li>Order applied: explicit deny → allow at sufficient level → step-up → default deny</li>";
  }
  ["#iamUser", "#iamAction", "#iamRes", "#iamLevel"].forEach(function (s) { $(s).addEventListener("change", evaluate); });
  evaluate();
});
