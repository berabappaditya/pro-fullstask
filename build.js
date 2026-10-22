#!/usr/bin/env node
/*
 * Full-Stack SDE-2 Handbook: zero-dependency build script.
 *
 *   node build.js             build the landing page and every book
 *   node build.js --watch     rebuild whenever something in shared/, books/ or landing/ changes
 *
 * Inputs
 *   handbook.json                     handbook title + the order of books
 *   shared/                           template, CSS, JS engine, icons, shared widgets (used by every book)
 *   books/<id>/book.json              one book's title, colours, topics
 *   books/<id>/chapters/**.html       chapters in reading order (folder + file names decide the order)
 *   books/<id>/widgets/*.js, *.css    that book's simulators and their styles (all files are included automatically)
 *   books/<id>/data/quiz.js           that book's quiz questions
 *   books/<id>/data/interview-bank.js that book's interview Q&A
 *   landing/                          the landing page template, CSS and JS
 *
 * Outputs (dist/)
 *   index.html                        landing page (full HTML document)
 *   <book>.html                       one full HTML document per book, everything inlined, works offline
 *   artifact/index.html               landing page without <html>/<head>/<body>, for hosts that add their own
 *
 * Placeholders you can use in chapters (see README for the full list)
 *   {{num}} {{done}} {{ref:ch-id}} {{n:ch-id}} {{title:ch-id}} {{xref:book-id/ch-id}}
 *   part openers: {{part}} {{range}} {{chips}}     anywhere: {{count}} {{diagrams}} {{widgets}} {{quizcount}}
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const SHARED = path.join(ROOT, "shared");
const BOOKS = path.join(ROOT, "books");
const DIST = path.join(ROOT, "dist");

/* ------------------------------------------------------------------ helpers */
const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const unescAttr = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const stripTags = (s) => unescAttr(String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const pad = (n) => String(n).padStart(2, "0");
const listFiles = (dir, ext) => !exists(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true })
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((d) => d.isDirectory() ? listFiles(path.join(dir, d.name), ext) : d.name.endsWith(ext) ? [path.join(dir, d.name)] : []);
const icon = (name) => read(path.join(SHARED, "icons", name + ".svg")).trim();

/* ------------------------------------------------------- syntax highlighter */
const KW = {
  java: new Set(("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null").split(" ")),
  sql: new Set(("SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX ON PRIMARY KEY FOREIGN REFERENCES JOIN LEFT RIGHT INNER OUTER GROUP BY ORDER LIMIT OFFSET AND OR NOT NULL AS BEGIN COMMIT ROLLBACK UNIQUE VARCHAR BIGINT INT TIMESTAMP DEFAULT COUNT DESC ASC IN IS EXISTS HAVING TRANSACTION FOR SHARE DECIMAL CHECK VECTOR EXTENSION USING").split(" ")),
  js: new Set(("const let var function return if else for while new class extends this await async import export from true false null undefined of").split(" ")),
  py: new Set(("def return if elif else for while in import from as class with try except finally raise lambda None True False and or not pass yield async await").split(" ")),
};
KW.json = KW.js; KW.ts = KW.js;
const HASH_COMMENTS = new Set(["http", "yaml", "sh", "py", "docker", "properties", "hcl"]);
const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|--[^\n]*|#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`[^`]*`)|(@[A-Za-z_]\w*)|(\b\d[\d_]*(?:\.\d+)?[lLfFdD]?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;

function highlight(code, lang) {
  if (lang === "text" || lang === "plain") return esc(code);
  const kw = KW[lang] || new Set();
  let out = "", m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    const [tok, com, str, ann, num, word] = m;
    if (com !== undefined) {
      if (tok[0] === "#" && !HASH_COMMENTS.has(lang)) { out += "#"; TOKEN.lastIndex = m.index + 1; continue; }
      if (tok.startsWith("--") && lang !== "sql") { out += "-"; TOKEN.lastIndex = m.index + 1; continue; }
      if (tok.startsWith("//") && HASH_COMMENTS.has(lang)) { out += "/"; TOKEN.lastIndex = m.index + 1; continue; }
      out += `<span class="t-com">${esc(tok)}</span>`;
    } else if (str !== undefined) {
      if (tok[0] === "'" && (lang === "sh" || lang === "text")) { out += `<span class="t-str">${esc(tok)}</span>`; continue; }
      out += lang === "java" && tok[0] === "`" ? esc(tok) : `<span class="t-str">${esc(tok)}</span>`;
    } else if (ann !== undefined) {
      out += lang === "java" || lang === "py" ? `<span class="t-ann">${tok}</span>` : esc(tok);
    } else if (num !== undefined) {
      out += `<span class="t-num">${tok}</span>`;
    } else if (word !== undefined) {
      const check = lang === "sql" ? tok.toUpperCase() : tok;
      if (kw.has(check)) out += `<span class="t-kw">${tok}</span>`;
      else if (lang === "java" && /^[A-Z]/.test(tok)) out += `<span class="t-type">${tok}</span>`;
      else if (["java", "js", "ts", "py"].includes(lang) && code[m.index + tok.length] === "(") out += `<span class="t-fn">${tok}</span>`;
      else if (lang === "http" && /^(GET|POST|PUT|PATCH|DELETE|HTTP)$/.test(tok)) out += `<span class="t-kw">${tok}</span>`;
      else if (lang === "docker" && /^(FROM|RUN|COPY|WORKDIR|EXPOSE|ENTRYPOINT|CMD|ENV|ARG|AS|USER|HEALTHCHECK)$/.test(tok)) out += `<span class="t-kw">${tok}</span>`;
      else out += tok;
    } else out += esc(tok);
  }
  return out;
}

const BADGE = { good: "Better", bad: "Problem", plain: "" };
function codeFigure(attrs, body) {
  const get = (name, dflt) => { const m = attrs.match(new RegExp(name + '="([^"]*)"')); return m ? unescAttr(m[1]) : dflt; };
  const lang = get("data-lang", "text"), variant = get("data-variant", "plain"), title = get("data-title", "");
  let lines = body.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  lines = lines.map((l) => l.slice(indent));
  const badge = BADGE[variant] ? `<span class="badge badge-${variant}">${BADGE[variant]}</span>` : "";
  return `<figure class="code code-${variant}"><figcaption>${badge}<span class="code-title">${esc(title)}</span><span class="code-lang">${lang}</span></figcaption><pre><code>${highlight(lines.join("\n"), lang)}</code></pre></figure>`;
}

/* ------------------------------------------------------------- data loading */
function loadDataArray(file, key) {
  if (!exists(file)) return [];
  const ctx = { window: {} };
  ctx.window.window = ctx.window;
  try {
    vm.runInNewContext(read(file), ctx.window);
    return (ctx.window.SDB && ctx.window.SDB.data && ctx.window.SDB.data[key]) || [];
  } catch (e) { console.warn(`! could not read ${path.relative(ROOT, file)}: ${e.message}`); return []; }
}

/* --------------------------------------------------- pass 1: parse + number */
function loadBook(id) {
  const dir = path.join(BOOKS, id);
  const meta = JSON.parse(read(path.join(dir, "book.json")));
  const units = listFiles(path.join(dir, "chapters"), ".html").map((file) => {
    const html = read(file).trim();
    const open = html.match(/^<(div|section|footer)\b([^>]*)>/);
    const attrs = open ? open[2] : "";
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || "";
    const kind = /\bpart-opener\b/.test(cls) ? "part" : /\bchapter\b/.test(cls) ? "chapter" : /\bfront\b/.test(cls) ? "front" : "other";
    const oneline = (html.match(/<p class="ch-oneline">([\s\S]*?)<\/p>/) || [])[1] || "";
    const headings = [...html.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => stripTags(m[1]));
    return {
      file: path.relative(ROOT, file), html, kind,
      id: (attrs.match(/id="([\w-]+)"/) || [])[1],
      title: (attrs.match(/data-title="([^"]*)"/) || [])[1],
      name: (attrs.match(/data-name="([^"]*)"/) || [])[1],
      num: (attrs.match(/data-num="([^"]*)"/) || [])[1],
      unnumbered: /data-unnumbered/.test(attrs),
      oneline: stripTags(oneline).replace(/\{\{[^}]+\}\}/g, ""), headings: headings.map((h) => h.replace(/\{\{[^}]+\}\}/g, "")),
    };
  });
  let partNo = 0, chNo = 0, currentPart = null;
  const byId = {};
  const errors = [];
  for (const u of units) {
    if (u.id) { if (byId[u.id]) errors.push(`duplicate id "${u.id}" in ${u.file}`); byId[u.id] = u; }
    if (u.kind === "part") {
      currentPart = u; u.chapters = [];
      if (!u.unnumbered) { partNo++; u.partLabel = `Part ${partNo}`; u.title = `Part ${partNo} · ${u.name}`; }
      else u.title = u.name;
    } else if (u.kind === "chapter") {
      if (!u.num) { chNo++; u.num = pad(chNo); u.auto = true; }
      if (currentPart) { currentPart.chapters.push(u); u.part = currentPart; }
    } else if (u.kind === "front") currentPart = null;
  }
  const chapters = units.filter((u) => u.kind === "chapter");
  const quiz = loadDataArray(path.join(dir, "data", "quiz.js"), "quiz");
  const bank = loadDataArray(path.join(dir, "data", "interview-bank.js"), "interviewBank");
  return { id, dir, meta, units, byId, chapters, errors, quiz, bank };
}

/* --------------------------------------------------- pass 2: render a book */
function themeStyle(t) {
  const vars = (v) => `--accent:${v.accent}; --accent-ink:${v.accentInk}; --accent-soft:${v.accentSoft}; --hero:${v.hero};`;
  return `<style>/* book colour theme, from book.json */
:root{${vars(t.light)} --on-accent:#FFFFFF}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){${vars(t.dark)} --on-accent:#0A1322} }
:root[data-theme="dark"]{${vars(t.dark)} --on-accent:#0A1322}
</style>`;
}

function renderBook(book, all, handbook) {
  const { meta, units, byId, chapters } = book;
  const errors = book.errors.slice();
  const navUnits = units.filter((u) => u.id && u.title && u.kind !== "other");

  for (const u of units) {
    let h = u.html;
    if (u.kind === "part") {
      h = h.replace(/^<div\b([^>]*)>/, (m, a) => `<div${a.replace(/\s*data-unnumbered/, "")} data-title="${escAttr(u.title)}">`);
      const autos = u.chapters.filter((c) => c.auto);
      const range = autos.length ? (autos.length === 1 ? `Chapter ${+autos[0].num}` : `Chapters ${+autos[0].num} to ${+autos[autos.length - 1].num}`) : "";
      h = h.replace(/\{\{part\}\}/g, u.partLabel || "").replace(/\{\{range\}\}/g, range)
           .replace(/\{\{chips\}\}/g, `<div class="part-list">${u.chapters.map((c) => `<a href="#${c.id}">${esc(unescAttr(c.title))}</a>`).join("")}</div>`);
    }
    if (u.kind === "chapter") {
      if (u.auto) h = h.replace(/^<section\b([^>]*)>/, (m, a) => `<section${a} data-num="${u.num}">`);
      h = h.replace(/Figure \{\{num\}\}/g, "Figure " + (+u.num || u.num)).replace(/\{\{num\}\}/g, u.num);
    }
    if (h.includes("{{done}}")) {
      const i = navUnits.indexOf(u), next = navUnits[i + 1];
      const link = next ? `<a class="next-link" href="#${next.id}">Next: ${esc(unescAttr(next.title))} →</a>` : `<a class="next-link" href="#cover">Back to the start ↑</a>`;
      h = h.replace(/\{\{done\}\}/g, `<div class="done-row"><label class="done-toggle"><input type="checkbox" data-done="${u.id}">Mark chapter as done</label>${link}</div>`);
    }
    u.out = h;
  }

  let body = units.map((u) => `<!-- ${u.file} -->\n${u.out}`).join("\n\n");
  body = body.replace(/<script type="text\/x-code"([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, code) => codeFigure(attrs, code));

  const numOf = (id) => { const u = byId[id]; if (!u || !u.num) { errors.push(`unknown chapter reference "${id}"`); return "?"; } return String(+u.num || u.num); };
  body = body
    .replace(/\{\{n:([\w-]+)\}\}/g, (m, id) => numOf(id))
    .replace(/\{\{ref:([\w-]+)\}\}/g, (m, id) => `<a class="xref" href="#${id}">Chapter ${numOf(id)}</a>`)
    .replace(/\{\{title:([\w-]+)\}\}/g, (m, id) => byId[id] ? unescAttr(byId[id].title) : (errors.push(`unknown title "${id}"`), "?"))
    .replace(/\{\{xref:([\w-]+)\/([\w-]+)\}\}/g, (m, bid, cid) => {
      const other = all[bid];
      if (!other) { errors.push(`cross-book reference to missing book "${bid}"`); return `<span class="xref-missing">${bid}</span>`; }
      const c = other.byId[cid];
      if (!c) { errors.push(`cross-book reference "${bid}/${cid}" not found`); return "?"; }
      return `<a class="xref xbook" href="${other.meta.file}#${cid}">${esc(other.meta.short)} · Chapter ${+c.num || c.num}</a>`;
    });
  const stats = bookStats(book, body);
  body = body.replace(/\{\{(count|diagrams|widgets|quizcount|bankcount)\}\}/g, (m, k) => stats[k]);

  /* table of contents */
  const toc = ['<nav class="toc" aria-label="Chapters">'];
  let open = false;
  for (const u of navUnits) {
    if (u.kind === "part" || u.kind === "front") {
      if (open) toc.push("</ol>");
      toc.push(`<a class="${u.kind === "part" ? "toc-part" : "toc-front"}" href="#${u.id}" data-ch="${u.id}">${esc(unescAttr(u.title))}</a>`, "<ol>");
      open = true;
    } else toc.push(`<li><a href="#${u.id}" data-ch="${u.id}"><span class="toc-num">${u.num}</span><span class="toc-t">${esc(unescAttr(u.title))}</span><span class="toc-tick" aria-hidden="true"></span></a></li>`);
  }
  if (open) toc.push("</ol>");
  toc.push("</nav>");

  /* "keep going" links to the other books */
  const others = handbook.books.filter((b) => b !== book.id && all[b]).map((b) => all[b]);
  const otherBooks = others.length ? `<section class="other-books" aria-label="Other books in the handbook">
  <p class="eyebrow">${esc(handbook.title)}</p><h3>Keep going with another book</h3>
  <div class="ob-grid">${others.map((o) => `<a class="ob-card" href="${o.meta.file}" style="--ob:${o.meta.theme.light.accent};--ob-d:${o.meta.theme.dark.accent}"><span class="ob-icon">${icon(o.meta.icon)}</span><span class="ob-t">${esc(o.meta.title)}</span><span class="ob-s">${esc(o.meta.tagline)}</span></a>`).join("")}
  <a class="ob-card ob-home" href="index.html"><span class="ob-icon">${icon("grid")}</span><span class="ob-t">All books</span><span class="ob-s">Back to the handbook's landing page.</span></a></div>
</section>` : "";

  /* template */
  const bookScripts = [
    ...[path.join(book.dir, "data", "quiz.js"), path.join(book.dir, "data", "interview-bank.js")].filter(exists),
    ...listFiles(path.join(book.dir, "widgets"), ".js"),
  ].map((f) => `<script>/* ${path.relative(ROOT, f)} */\n${guardInline(f, read(f))}</script>`).join("\n");
  const sharedWidgets = listFiles(path.join(SHARED, "js", "widgets"), ".js")
    .map((f) => `<script>/* ${path.relative(ROOT, f)} */\n${guardInline(f, read(f))}</script>`).join("\n");
  const bookCss = listFiles(path.join(book.dir, "widgets"), ".css")
    .map((f) => `<style>/* ${path.relative(ROOT, f)} */\n${guardInline(f, read(f))}</style>`).join("\n");
  const boot = `<script>window.SDB = { book: ${JSON.stringify({ id: meta.id, title: meta.title, file: meta.file })} };</script>`;

  let tpl = read(path.join(SHARED, "template.html"));
  tpl = inlineAssets(tpl, SHARED);
  tpl = tpl
    .replace("{{book.themeStyle}}", () => themeStyle(meta.theme) + bookCss)
    .replace("{{svgDefs}}", read(path.join(SHARED, "svg-defs.html")))
    .replace("{{book.bootScript}}", () => boot)
    .replace("{{sharedWidgets}}", () => sharedWidgets)
    .replace("{{bookScripts}}", () => bookScripts)
    .replace("{{toc}}", () => toc.join("\n"))
    .replace("{{otherBooks}}", () => otherBooks)
    .replace("{{chapters}}", () => body)
    .replace(/\{\{book\.title\}\}/g, esc(meta.title))
    .replace(/\{\{book\.short\}\}/g, esc(meta.short))
    .replace(/\{\{book\.description\}\}/g, escAttr(meta.description))
    .replace(/\{\{book\.searchHint\}\}/g, escAttr(meta.searchHint || "Find a topic"))
    .replace(/\{\{book\.mark\}\}/g, icon(meta.icon))
    .replace(/\{\{handbook\.title\}\}/g, esc(handbook.title))
    .replace(/\{\{(count|diagrams|widgets|quizcount|bankcount)\}\}/g, (m, k) => stats[k]);

  validate(tpl, errors, all);
  writePage(meta.file, tpl);
  return { stats, errors };
}

function bookStats(book, body) {
  return {
    count: String(book.chapters.length),
    diagrams: String((body.match(/<figure class="figure"/g) || []).length),
    widgets: String((body.match(/class="widget[" ]/g) || []).length),
    quizcount: String(book.quiz.length),
    bankcount: String(book.bank.length),
  };
}

function guardInline(f, text) { /* closing-tag guard: an inlined file must not end its own <script>/<style> early */
  if (/<\/(script|style)/i.test(text)) throw new Error(`${f} contains a literal closing script/style tag; it would break inlining`);
  return text;
}
function inlineAssets(tpl, base) {
  return tpl
    .replace(/<link rel="stylesheet" href="([^"]+)" data-inline>\n?/g, (m, href) => `<style>/* ${href} */\n${guardInline(href, read(path.join(base, href)))}</style>\n`)
    .replace(/<script src="([^"]+)" data-inline><\/script>\n?/g, (m, src) => `<script>/* ${src} */\n${guardInline(src, read(path.join(base, src)))}</script>\n`);
}

function validate(html, errors, all) {
  const leftovers = html.match(/\{\{[\w.:/-]+\}\}/g);
  if (leftovers) errors.push("unresolved placeholders: " + [...new Set(leftovers)].join(", "));
  const ids = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) { if (ids.has(m[1])) errors.push(`duplicate element id "${m[1]}"`); ids.add(m[1]); }
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) errors.push(`broken link #${m[1]}`);
}

function writePage(file, tpl) {
  const [headPart, bodyPart] = tpl.split(/<!-- @body[\s\S]*?-->\n?/);
  fs.mkdirSync(path.join(DIST, "artifact"), { recursive: true });
  fs.writeFileSync(path.join(DIST, file), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${headPart}</head>\n<body>\n${bodyPart}</body>\n</html>\n`);
  if (file === "index.html") fs.writeFileSync(path.join(DIST, "artifact", "index.html"), headPart + bodyPart);
}

/* ------------------------------------------------------------- landing page */
function renderLanding(all, handbook, results) {
  const books = handbook.books.filter((id) => all[id]).map((id) => {
    const b = all[id], s = results[id].stats;
    const parts = b.units.filter((u) => u.kind === "part" && !u.unnumbered).map((p) => ({ title: p.name, chapters: p.chapters.length }));
    return {
      id, file: b.meta.file, title: b.meta.title, short: b.meta.short, tagline: b.meta.tagline, description: b.meta.description,
      story: b.meta.story, topics: b.meta.topics || [], theme: b.meta.theme, icon: icon(b.meta.icon),
      stats: { chapters: +s.count, diagrams: +s.diagrams, widgets: +s.widgets, quiz: +s.quizcount, bank: +s.bankcount },
      parts, chapterIds: b.chapters.map((c) => c.id),
    };
  });
  const index = [];
  for (const id of handbook.books) {
    const b = all[id]; if (!b) continue;
    for (const c of b.chapters) index.push({ b: id, f: b.meta.file, id: c.id, n: c.num, t: unescAttr(c.title), o: c.oneline.slice(0, 220), h: c.headings.join(" · ").slice(0, 400) });
  }
  const totals = books.reduce((t, b) => { for (const k in b.stats) t[k] = (t[k] || 0) + b.stats[k]; return t; }, {});
  const data = { handbook: { title: handbook.title, tagline: handbook.tagline }, books, index, totals };

  const colourVars = (t) => `--c:${t.light.accent};--c-soft:${t.light.accentSoft};--c-d:${t.dark.accent};--c-soft-d:${t.dark.accentSoft}`;
  const heights = [94, 100, 88, 97, 91];
  const spines = books.map((b, i) => `        <a class="spine" href="${b.file}" style="${colourVars(b.theme)};--h:${heights[i % heights.length]}%" data-book="${b.id}">
          <span class="sp-no">${pad(i + 1)}</span><span class="sp-t">${esc(b.short)}</span><span class="sp-icon">${b.icon}</span></a>`).join("\n");
  const cards = books.map((b, i) => `    <a class="book-card" href="${b.file}" data-book="${b.id}" style="${colourVars(b.theme)};--i:${i}">
      <span class="bc-glow" aria-hidden="true"></span>
      <div class="bc-top"><span class="bc-no">Book ${pad(i + 1)}</span><span class="bc-icon">${b.icon}</span></div>
      <h3>${esc(b.title)}</h3>
      <p class="bc-tag">${esc(b.tagline)}</p>
      <ul class="bc-topics">${b.topics.slice(0, 8).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <div class="bc-stats"><span><b>${b.stats.chapters}</b> chapters</span><span><b>${b.stats.diagrams}</b> diagrams</span><span><b>${b.stats.widgets}</b> simulators</span><span><b>${b.stats.quiz}</b> quiz Qs</span></div>
      <div class="bc-progress" aria-hidden="true"><i></i></div>
      <div class="bc-foot"><span class="bc-prog-txt">Not started yet</span><span class="bc-cta">Open book <span aria-hidden="true">→</span></span></div>
    </a>`).join("\n");

  let tpl = read(path.join(ROOT, "landing", "index.html"));
  tpl = inlineAssets(tpl, ROOT);
  tpl = tpl.replace("{{spines}}", () => spines).replace("{{cards}}", () => cards).replace("{{data}}", () => `<script>window.SDH_DATA = ${JSON.stringify(data).replace(/</g, "\\u003c")};</script>`)
    .replace("{{svgDefs}}", read(path.join(SHARED, "svg-defs.html")))
    .replace(/\{\{handbook\.title\}\}/g, esc(handbook.title))
    .replace(/\{\{handbook\.tagline\}\}/g, esc(handbook.tagline))
    .replace(/\{\{total\.(\w+)\}\}/g, (m, k) => String(totals[k] || 0))
    .replace(/\{\{bookcount\}\}/g, String(books.length));
  const errors = [];
  validate(tpl, errors, all);
  writePage("index.html", tpl);
  return { errors, totals, books: books.length };
}

/* -------------------------------------------------------------------- build */
function build() {
  const t0 = Date.now();
  const handbook = JSON.parse(read(path.join(ROOT, "handbook.json")));
  const all = {};
  for (const id of handbook.books) if (exists(path.join(BOOKS, id, "book.json"))) all[id] = loadBook(id);
  const results = {};
  let problems = 0;
  for (const id of Object.keys(all)) {
    results[id] = renderBook(all[id], all, handbook);
    const s = results[id].stats;
    console.log(`  ✓ ${id.padEnd(15)} ${s.count.padStart(3)} chapters · ${s.diagrams.padStart(3)} diagrams · ${s.widgets.padStart(2)} simulators · ${s.quizcount.padStart(3)} quiz · ${s.bankcount.padStart(3)} interview Qs`);
    for (const e of [...new Set(results[id].errors)]) { console.error(`    ✗ ${e}`); problems++; }
  }
  const landing = renderLanding(all, handbook, results);
  for (const e of [...new Set(landing.errors)]) { console.error(`    ✗ landing: ${e}`); problems++; }
  console.log(`✓ landing page + ${landing.books} books → dist/ (${Date.now() - t0} ms)${problems ? `, ${problems} problem(s)` : ""}`);
  return problems === 0;
}

const ok = build();
if (process.argv.includes("--watch")) {
  console.log("watching shared/, books/ and landing/ … (Ctrl+C to stop)");
  let timer = null;
  for (const d of ["shared", "books", "landing", "handbook.json"]) {
    fs.watch(path.join(ROOT, d), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(() => { try { build(); } catch (e) { console.error(e); } }, 150); });
  }
} else if (!ok) process.exitCode = 1;
