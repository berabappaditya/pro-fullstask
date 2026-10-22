/* Final quiz: topic chips, shuffle, "retry my mistakes", best score per topic saved in this browser. Data: js/data/quiz-data.js */
SDB.register("quiz", function () {
  var $ = SDB.$, box = $("#quiz");
  if (!box) return;
  var Q = SDB.data.quiz || [];
  var cats = [];
  Q.forEach(function (q) { if (cats.indexOf(q.c) === -1) cats.push(q.c); });
  var cat = "All", order = Q.map(function (_, i) { return i; }), answers = {}, onlyWrong = false;
  var wrong = SDB.store.get(SDB.key("quiz-wrong"), []);       // question texts answered wrong
  var best = SDB.store.get(SDB.key("quiz-best"), {});           // topic -> best % (only for complete runs)

  function visible() {
    return order.filter(function (i) {
      return (cat === "All" || Q[i].c === cat) && (!onlyWrong || wrong.indexOf(Q[i].q) > -1);
    });
  }
  function chips() {
    var html = ["All"].concat(cats).map(function (c) {
      var n = c === "All" ? Q.length : Q.filter(function (q) { return q.c === c; }).length;
      return '<button type="button" class="chip' + (c === cat ? " on" : "") + '" data-cat="' + c + '">' + c + "<small>" + n + "</small></button>";
    });
    $("#quizCats").innerHTML = html.join("");
  }
  function render() {
    chips();
    var list = visible();
    if (!list.length) {
      box.innerHTML = '<div class="box tip"><div class="box-tag">Nothing here</div><p>' + (onlyWrong ? "No mistakes recorded for this topic. Well done." : "No questions in this topic.") + "</p></div>";
    } else {
      box.innerHTML = list.map(function (i, n) {
        var q = Q[i];
        return '<div class="quiz-q" data-i="' + i + '"><div class="quiz-cat">' + q.c + "</div><p>" + (n + 1) + ". " + q.q + '</p><div class="quiz-opts">' +
          q.o.map(function (o, j) { return '<button type="button" data-j="' + j + '">' + o + "</button>"; }).join("") +
          '</div><p class="quiz-why" hidden></p></div>';
      }).join("");
    }
    $("#quizWrong").textContent = onlyWrong ? "Show all questions" : "Retry my mistakes (" + wrong.length + ")";
    score();
  }
  function score() {
    var list = visible(), done = 0, right = 0;
    list.forEach(function (i) { if (answers[i] !== undefined) { done++; if (answers[i] === Q[i].a) right++; } });
    $("#quizScore").textContent = "Score: " + right + " / " + done + " answered (" + list.length + " in this set)";
    if (done === list.length && done > 0 && !onlyWrong) {
      var pct = Math.round(right / done * 100);
      if (!best[cat] || pct > best[cat]) { best[cat] = pct; SDB.store.set(SDB.key("quiz-best"), best); }
    }
    $("#quizBest").textContent = best[cat] !== undefined ? "Best for " + cat + ": " + best[cat] + "%" : "";
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    var card = b.closest(".quiz-q"), i = +card.getAttribute("data-i"), q = Q[i], j = +b.getAttribute("data-j");
    var opts = SDB.$$("button", card);
    opts.forEach(function (o) { o.disabled = true; });
    opts[q.a].classList.add("right");
    answers[i] = j;
    var pos = wrong.indexOf(q.q);
    if (j !== q.a) { b.classList.add("wrong"); if (pos === -1) wrong.push(q.q); }
    else if (pos > -1) wrong.splice(pos, 1);
    SDB.store.set(SDB.key("quiz-wrong"), wrong);
    var why = $(".quiz-why", card);
    why.hidden = false;
    why.innerHTML = (j === q.a ? '<strong style="color:var(--good)">Correct.</strong> ' : '<strong style="color:var(--bad)">Not quite.</strong> ') + q.w;
    score();
  });
  $("#quizCats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    cat = b.getAttribute("data-cat"); render();
  });
  $("#quizShuffle").addEventListener("click", function () {
    for (var k = order.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), t = order[k]; order[k] = order[r]; order[r] = t; }
    answers = {}; render();
  });
  $("#quizWrong").addEventListener("click", function () {
    onlyWrong = !onlyWrong;
    if (onlyWrong) visible().forEach(function (i) { delete answers[i]; });
    render();
  });
  $("#quizReset").addEventListener("click", function () {
    answers = {}; onlyWrong = false; order = Q.map(function (_, i) { return i; }); render();
  });
  render();
});
