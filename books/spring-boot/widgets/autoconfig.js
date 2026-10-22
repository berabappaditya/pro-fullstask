/* Chapter: Auto-configuration. Tick what's on the classpath, which beans you defined yourself and which
 * properties are set; the evaluator applies simplified versions of Boot's real @Conditional rules. */
SDB.register("widget-autoconfig", function () {
  var $ = SDB.$, inputs = $("#acInputs");
  if (!inputs) return;
  var OPTS = [
    { g: "Classpath (starters / jars)", items: [
      ["webmvc", "spring-boot-starter-webmvc", true], ["jpa", "spring-boot-starter-data-jpa", true], ["pg", "postgresql driver", true],
      ["h2", "h2 (in-memory DB)", false], ["redis", "spring-boot-starter-data-redis", false], ["security", "spring-boot-starter-security", false], ["actuator", "spring-boot-starter-actuator", false]] },
    { g: "Beans you defined", items: [["myDs", "your own DataSource @Bean", false], ["myChain", "your own SecurityFilterChain", false], ["myMapper", "your own JsonMapper", false]] },
    { g: "Properties", items: [["url", "spring.datasource.url is set", true]] }
  ];
  var st = {};
  inputs.innerHTML = OPTS.map(function (g) {
    return '<fieldset class="ac-group"><legend>' + g.g + '</legend>' + g.items.map(function (it) {
      st[it[0]] = it[2];
      return '<label class="ac-opt"><input type="checkbox" data-k="' + it[0] + '"' + (it[2] ? " checked" : "") + '> ' + it[1] + '</label>';
    }).join("") + '</fieldset>';
  }).join("");

  function row(name, ok, cond, beans, cls) {
    return '<div class="ac-row ' + (cls || (ok ? "ok" : "skip")) + '"><div class="ac-name"><b>' + name + '</b><small>' + cond + '</small></div><div class="ac-beans">' +
      (beans.length ? beans.map(function (b) { return '<span>' + b + '</span>'; }).join("") : '<em>' + (ok ? "nothing new" : "skipped") + '</em>') + '</div></div>';
  }
  function evaluate() {
    var out = [], web = st.webmvc, dsClass = st.jpa || st.h2 || st.pg, dsReady = false, fail = null;
    out.push(web ? row("ServletWebServerFactoryAutoConfiguration", true, "@ConditionalOnClass(Tomcat) ✓ · servlet web app ✓", ["tomcatServletWebServerFactory", "dispatcherServlet"])
                 : row("ServletWebServerFactoryAutoConfiguration", false, "@ConditionalOnClass(Tomcat) ✗: no web starter, so the app starts and exits like a CLI (unless something keeps it alive)", []));
    if (web) out.push(st.myMapper ? row("JacksonAutoConfiguration", false, "@ConditionalOnMissingBean(JsonMapper) ✗: you defined one, Boot backs off", [], "backoff")
                                  : row("JacksonAutoConfiguration", true, "@ConditionalOnClass(JsonMapper) ✓ · no user bean ✓", ["jsonMapper"]));
    if (!dsClass) out.push(row("DataSourceAutoConfiguration", false, "@ConditionalOnClass(DataSource driver) ✗", []));
    else if (st.myDs) { dsReady = true; out.push(row("DataSourceAutoConfiguration", false, "@ConditionalOnMissingBean(DataSource) ✗: your DataSource wins", [], "backoff")); }
    else if (st.url) { dsReady = true; out.push(row("DataSourceAutoConfiguration", true, "driver on classpath ✓ · spring.datasource.url set ✓", ["dataSource (HikariDataSource)"])); }
    else if (st.h2) { dsReady = true; out.push(row("DataSourceAutoConfiguration", true, "no url, but an embedded DB (H2) is on the classpath ✓", ["dataSource (embedded H2, jdbc:h2:mem:…)"])); }
    else fail = "<b>APPLICATION FAILED TO START</b><br>Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.<br><small>The famous one: JPA is on the classpath but there's no database URL and no H2. Set spring.datasource.url, add H2, or exclude DataSourceAutoConfiguration.</small>";
    if (st.jpa) out.push(dsReady ? row("HibernateJpaAutoConfiguration", true, "@ConditionalOnClass(EntityManager) ✓ · a DataSource bean exists ✓", ["entityManagerFactory", "transactionManager", "repositories (Spring Data)"])
                                 : row("HibernateJpaAutoConfiguration", false, "needs a DataSource ✗", []));
    if (st.redis) out.push(row("DataRedisAutoConfiguration", true, "@ConditionalOnClass(RedisOperations) ✓ · defaults to localhost:6379", ["redisConnectionFactory (Lettuce)", "redisTemplate", "stringRedisTemplate"]));
    if (st.security) out.push(st.myChain ? row("SecurityFilterChain defaults", false, "@ConditionalOnMissingBean(SecurityFilterChain) ✗: your rules are used", [], "backoff")
                                         : row("SecurityAutoConfiguration", true, "no user SecurityFilterChain ✓ → secure by default: every endpoint needs login; a random password is printed at startup", ["defaultSecurityFilterChain", "inMemoryUserDetailsManager (user / generated)"]));
    if (st.actuator) {
      var ind = ["/actuator/health"]; if (dsReady) ind.push("db health indicator"); if (st.redis) ind.push("redis health indicator"); ind.push("diskSpace indicator");
      out.push(row("Actuator auto-configuration", true, "@ConditionalOnAvailableEndpoint ✓ (only health exposed over HTTP by default)", ind));
    }
    $("#acOut").innerHTML = (fail ? '<div class="ac-fail">' + fail + '</div>' : '<div class="ac-okmsg">Application started. Conditions evaluation report (simplified):</div>') + out.join("");
  }
  inputs.addEventListener("change", function (e) { var k = e.target.getAttribute("data-k"); if (k) { st[k] = e.target.checked; evaluate(); } });
  evaluate();
});
