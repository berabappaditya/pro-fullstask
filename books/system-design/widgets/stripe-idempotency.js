/* Chapter: Stripe. A merchant pays ₹500 over a flaky network; with and without an Idempotency-Key. */
SDB.register("widget-stripe-idempotency", function () {
  var $ = SDB.$, root = $("#w-idem");
  if (!root) return;
  var flaky = true, useKey = true, charges, saved, purchases, nextCharge;

  function reset() {
    charges = []; saved = {}; purchases = 0; nextCharge = 1;
    $("#idemClient").innerHTML = "";
    render();
  }
  function render() {
    var perPurchase = {};
    charges.forEach(function (c) { perPurchase[c.p] = (perPurchase[c.p] || 0) + 1; });
    $("#idemCharges").innerHTML = charges.length ? charges.map(function (c) {
      var dup = perPurchase[c.p] > 1;
      return '<div class="idem-charge' + (dup ? " dup" : "") + '"><b>' + c.id + '</b><span>₹500 · purchase #' + c.p + (dup ? " · DUPLICATE" : "") + '</span></div>';
    }).join("") : '<div class="small" style="padding:10px">No charges yet.</div>';
    var total = charges.length * 500, should = purchases * 500;
    $("#idemStats").innerHTML = "<span>Purchases <b>" + purchases + "</b></span><span>Charges created <b>" + charges.length + "</b></span><span>Customer paid <b style=\"color:" + (total > should ? "var(--bad)" : "var(--good)") + "\">₹" + total + "</b> (should be ₹" + should + ")</span>";
  }
  function attempt(p, key, n) {
    var log = $("#idemClient");
    SDB.log(log, "→ POST /v1/charges · attempt " + n + " · " + (key ? "Idempotency-Key: " + key : "<span class=\"warn\">no key</span>"));
    setTimeout(function () {
      var charge, replay = false;
      if (key && saved[key]) { charge = saved[key]; replay = true; }
      else { charge = { id: "ch_" + String(nextCharge++).padStart(3, "0"), p: p }; charges.push(charge); if (key) saved[key] = charge; }
      render();
      if (flaky && n === 1) {
        SDB.log(log, '<span class="err">✗ timeout: Stripe created ' + charge.id + ' but the response was lost</span>');
        setTimeout(function () { attempt(p, key, 2); }, 700);
      } else {
        SDB.log(log, '<span class="ok">✓ 200 OK · ' + charge.id + (replay ? " (replayed saved response, no new charge)" : "") + '</span>');
      }
    }, 450);
  }
  $("#idemPay").addEventListener("click", function () {
    purchases++;
    var key = useKey ? "idem_" + Math.random().toString(36).slice(2, 8) : null;
    attempt(purchases, key, 1);
    render();
  });
  $("#idemFlaky").addEventListener("click", function () { flaky = !flaky; this.textContent = "Flaky network: " + (flaky ? "on" : "off"); this.classList.toggle("on", flaky); });
  $("#idemKey").addEventListener("click", function () { useKey = !useKey; this.textContent = "Idempotency-Key: " + (useKey ? "on" : "off"); this.classList.toggle("on", useKey); });
  $("#idemReset").addEventListener("click", reset);
  reset();
});
