/* Chapter: Bean lifecycle. Step through how the container creates OrderService:
 * instantiate, inject, aware callbacks, BeanPostProcessors, @PostConstruct, proxy, ready, destroy. */
SDB.register("widget-lifecycle", function () {
  var $ = SDB.$, track = $("#lcTrack");
  if (!track) return;
  var STEPS = [
    { k: "Definition", t: "Bean definition registered", d: "Component scan found <code>@Service OrderService</code> and registered a <em>BeanDefinition</em> (class, scope, dependencies). No object exists yet. BeanFactoryPostProcessors may still change definitions (e.g. resolve <code>${…}</code> placeholders).", out: "" },
    { k: "Instantiate", t: "1. Constructor called", d: "The container calls the constructor. With constructor injection, the dependencies (<code>OrderRepository</code>, <code>PaymentClient</code>) are created or fetched <em>first</em> and passed in, so the object is complete from birth.", out: "OrderService() constructor" },
    { k: "Populate", t: "2. Remaining injection", d: "Setter and field injection (<code>@Autowired</code> fields, <code>@Value</code>) happen now. With constructor injection there's nothing left to do here, which is one reason it's preferred.", out: "@Value(\"${orders.max}\") → 50" },
    { k: "Aware", t: "3. Aware callbacks", d: "If the bean implements <code>BeanNameAware</code>, <code>ApplicationContextAware</code> etc., the container hands it its name or the context. Rarely needed in application code.", out: "setBeanName(\"orderService\")" },
    { k: "BPP before", t: "4. BeanPostProcessor: before init", d: "Every BeanPostProcessor's <code>postProcessBeforeInitialization</code> sees the bean. Spring's own processors run the <code>@PostConstruct</code> handling from here (CommonAnnotationBeanPostProcessor).", out: "" },
    { k: "Init", t: "5. @PostConstruct / afterPropertiesSet / initMethod", d: "All dependencies are ready, so initialisation logic is safe: warm a cache, validate configuration. Order: <code>@PostConstruct</code> → <code>InitializingBean.afterPropertiesSet()</code> → <code>@Bean(initMethod)</code>.", out: "@PostConstruct warmUp(): loaded 120 rate cards" },
    { k: "BPP after", t: "6. BeanPostProcessor: after init (proxies!)", d: "", out: "" },
    { k: "Ready", t: "7. In service", d: "The bean (or its proxy) is stored in the singleton cache and injected into others: controllers receive this object. It serves requests from many threads at once until shutdown.", out: "orderService ready" },
    { k: "Destroy", t: "8. Shutdown: @PreDestroy", d: "", out: "" }
  ];
  var i = 0, tx = true, proto = false, timer, outLines = [];

  $("#lcControls").innerHTML =
    '<button class="btn" id="lcPrev">← Back</button><button class="btn primary" id="lcNext">Next step →</button>' +
    '<button class="btn" id="lcPlay">Play</button>' +
    '<label class="btn"><input type="checkbox" id="lcTx" checked> has @Transactional</label>' +
    '<label class="btn"><input type="checkbox" id="lcProto"> prototype scope</label>';

  function dynamic(s, n) {
    if (n === 6) {
      s.d = tx ? "<code>postProcessAfterInitialization</code> runs. The AOP auto-proxy creator sees <code>@Transactional</code> and <b>replaces the bean with a proxy</b> (a CGLIB subclass). From now on everyone gets the proxy, which opens transactions and then calls your real object. This is why self-invocation skips transactions."
               : "<code>postProcessAfterInitialization</code> runs. No AOP annotations here, so no proxy is needed: the raw object is used as is.";
      s.out = tx ? "OrderService$$SpringCGLIB$$0 wraps OrderService" : "no proxy";
    }
    if (n === 8) {
      s.d = proto ? "<b>Prototype beans are not destroyed by the container.</b> It handed the object over and stopped tracking it, so <code>@PreDestroy</code> never runs; the caller must clean up."
                  : "On context close (graceful shutdown, SIGTERM in Kubernetes) the container calls <code>@PreDestroy</code> → <code>DisposableBean.destroy()</code> → <code>destroyMethod</code> on singletons, in reverse dependency order: release connections, flush buffers.";
      s.out = proto ? "(nothing: prototype)" : "@PreDestroy flush(): closed SMS client";
    }
    return s;
  }
  function render() {
    outLines = [];
    for (var n = 1; n <= i; n++) { var o = dynamic(STEPS[n], n).out; if (o) outLines.push(o); }
    track.innerHTML = STEPS.map(function (s, n) {
      return '<button class="lc-step' + (n < i ? " done" : n === i ? " on" : "") + (n === 6 && tx ? " proxy" : "") + '" data-i="' + n + '"><span>' + (n || "0") + '</span>' + s.k + '</button>';
    }).join("");
    var s = dynamic(STEPS[i], i);
    var beanState = i === 0 ? "definition only" : i >= 8 ? (proto ? "abandoned to the caller" : "destroyed") : i >= 6 && tx ? "proxy → real object" : "raw object";
    $("#lcDetail").innerHTML = '<div class="lc-text"><h5>' + s.t + '</h5><p>' + s.d + '</p></div>' +
      '<div class="lc-side"><div class="lc-bean' + (i >= 6 && tx && i < 8 ? " wrapped" : "") + (i >= 8 ? " gone" : "") + '"><small>' + (proto ? "prototype" : "singleton") + ' bean</small><b>orderService</b><em>' + beanState + '</em></div>' +
      '<pre class="lc-console">' + (outLines.length ? outLines.map(function (l) { return "› " + l.replace(/</g, "&lt;"); }).join("\n") : "› (console empty)") + '</pre></div>';
    $("#lcPrev").disabled = i === 0; $("#lcNext").disabled = i === STEPS.length - 1;
  }
  function go(n) { i = Math.max(0, Math.min(STEPS.length - 1, n)); render(); }
  $("#lcPrev").addEventListener("click", function () { go(i - 1); });
  $("#lcNext").addEventListener("click", function () { go(i + 1); });
  track.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) go(+b.getAttribute("data-i")); });
  $("#lcPlay").addEventListener("click", function () {
    var btn = this;
    if (timer) { clearInterval(timer); timer = null; btn.textContent = "Play"; return; }
    if (i === STEPS.length - 1) go(0);
    btn.textContent = "Pause";
    timer = setInterval(function () { if (i >= STEPS.length - 1) { clearInterval(timer); timer = null; btn.textContent = "Play"; return; } go(i + 1); }, 1600);
  });
  $("#lcTx").addEventListener("change", function (e) { tx = e.target.checked; render(); });
  $("#lcProto").addEventListener("change", function (e) { proto = e.target.checked; render(); });
  render();
});
