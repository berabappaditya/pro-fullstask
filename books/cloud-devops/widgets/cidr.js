/* Chapter: VPC networking. Type an IPv4 CIDR block and see its range, size and how it splits into subnets. */
SDB.register("widget-cidr", function () {
  var $ = SDB.$, out = $("#cidrOut");
  if (!out) return;
  $("#cidrControls").innerHTML =
    '<input class="btn cidr-in" id="cidrIn" value="10.0.0.0/16" aria-label="CIDR block" spellcheck="false">' +
    ["10.0.0.0/16", "10.0.1.0/24", "10.0.11.0/26", "172.16.0.0/12", "192.168.1.10/32"].map(function (c) { return '<button class="btn" data-c="' + c + '">' + c + '</button>'; }).join("");

  function toInt(ip) { return ip.split(".").reduce(function (a, o) { return (a * 256) + (+o); }, 0); }
  function toIp(n) { return [24, 16, 8, 0].map(function (s) { return Math.floor(n / Math.pow(2, s)) % 256; }).join("."); }
  function calc(v) {
    var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(v.trim());
    if (!m || m.slice(1, 5).some(function (o) { return +o > 255; }) || +m[5] > 32) { out.innerHTML = '<div class="cidr-err">Enter a block like 10.0.0.0/16 (four numbers 0–255, prefix 0–32).</div>'; return; }
    var prefix = +m[5], size = Math.pow(2, 32 - prefix), ip = toInt(m.slice(1, 5).join("."));
    var net = Math.floor(ip / size) * size, last = net + size - 1;
    var bits = m.slice(1, 5).map(function (o) { return ("00000000" + (+o).toString(2)).slice(-8); }).join("");
    var bitHtml = bits.split("").map(function (b, i) { return '<span class="' + (i < prefix ? "net" : "host") + '">' + b + '</span>' + ((i % 8 === 7 && i < 31) ? '<em>.</em>' : ""); }).join("");
    var usable = prefix >= 31 ? size : Math.max(0, size - 5);
    var priv = (net >= toInt("10.0.0.0") && last <= toInt("10.255.255.255")) || (net >= toInt("172.16.0.0") && last <= toInt("172.31.255.255")) || (net >= toInt("192.168.0.0") && last <= toInt("192.168.255.255"));
    var subs = "";
    if (prefix <= 26) {
      var sp = prefix < 16 ? 16 : prefix < 24 ? 24 : Math.min(28, prefix + 2);
      var n = Math.pow(2, sp - prefix), ssz = Math.pow(2, 32 - sp), show = Math.min(n, 4);
      subs = '<div class="cidr-sub"><b>Split into /' + sp + ' subnets:</b> ' + n.toLocaleString() + ' subnets of ' + ssz.toLocaleString() + ' addresses<ul>' +
        Array.apply(null, Array(show)).map(function (_, k) { var s = net + k * ssz; return '<li><code>' + toIp(s) + '/' + sp + '</code> → ' + toIp(s) + ' – ' + toIp(s + ssz - 1) + '</li>'; }).join("") + (n > show ? "<li>…</li>" : "") + '</ul></div>';
    }
    out.innerHTML = '<div class="cidr-bits">' + bitHtml + '</div><div class="cidr-legend"><span class="net">network bits (' + prefix + ')</span><span class="host">host bits (' + (32 - prefix) + ')</span></div>' +
      '<div class="cidr-facts"><div><small>network</small><b>' + toIp(net) + '/' + prefix + '</b></div><div><small>range</small><b>' + toIp(net) + ' – ' + toIp(last) + '</b></div>' +
      '<div><small>addresses</small><b>' + size.toLocaleString() + '</b></div><div><small>usable in an AWS subnet</small><b>' + usable.toLocaleString() + (prefix < 31 ? " (5 reserved)" : "") + '</b></div>' +
      '<div><small>private range (RFC 1918)?</small><b>' + (priv ? "yes" : "no") + '</b></div></div>' + subs +
      (prefix < 16 ? '<div class="cidr-note">AWS VPCs allow /16 to /28 per CIDR block.</div>' : "");
  }
  $("#cidrIn").addEventListener("input", function () { calc(this.value); });
  $("#cidrControls").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (b) { $("#cidrIn").value = b.getAttribute("data-c"); calc(b.getAttribute("data-c")); } });
  calc("10.0.0.0/16");
});
