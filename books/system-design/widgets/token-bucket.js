/* Chapter: Rate limiting. Token bucket with capacity 5, refilling one token every 1.5 seconds. */
SDB.register("widget-token-bucket", function () {
  var $ = SDB.$, bucket = $("#bucket");
  if (!bucket) return;
  var CAP = 5, tokens = CAP, ok = 0, rej = 0;
  function render() {
    bucket.innerHTML = new Array(tokens + 1).join('<span class="token"></span>');
    $("#bucketCount").textContent = tokens;
    $("#bkStats").innerHTML = '<span>Allowed <b style="color:var(--good)">' + ok + '</b></span><span>Rejected (429) <b style="color:var(--bad)">' + rej + '</b></span>';
  }
  function request() {
    var log = $("#bkLog");
    if (tokens > 0) { tokens--; ok++; SDB.log(log, SDB.time() + ' <span class="ok">200 OK</span> · used 1 token, ' + tokens + ' left'); }
    else { rej++; SDB.log(log, SDB.time() + ' <span class="err">429 Too Many Requests</span> · bucket empty, Retry-After: 2'); }
    render();
  }
  setInterval(function () { if (tokens < CAP) { tokens++; render(); } }, 1500);
  $("#bkOne").addEventListener("click", request);
  $("#bkBurst").addEventListener("click", function () { for (var i = 0; i < 8; i++) setTimeout(request, i * 110); });
  render();
});
