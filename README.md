# Full-Stack SDE-2 Handbook

Five visual study books for the SDE-2 interview loop, behind one animated landing page:

| # | Book | File | Chapters | What's inside |
|---|------|------|----------|---------------|
| 01 | Java Core, Explained | `dist/java-core.html` | 29 | JVM, memory, strings, OOP, generics, collections + HashMap internals, streams, Java 8 → 25, concurrency (threads to virtual threads), a 10,000-row Spring Boot bulk insert, GC, production troubleshooting |
| 02 | Spring Boot, Visualized | `dist/spring-boot.html` | 28 | IoC/DI, bean lifecycle, auto-configuration, REST, a full CRUD project, DTOs, validation, ProblemDetail errors, HTTP clients, JPA/N+1, transactions, locking, security + JWT, AOP, caching/async, Actuator, testing, microservices, Spring Boot 4 |
| 03 | System Design Blueprints | `dist/system-design.html` | 45 | HLD building blocks, Netflix/UPI/Stripe/JioHotstar case studies, LLD, SOLID, design patterns, parking lot / banking / IAM projects |
| 04 | Cloud & DevOps Field Guide | `dist/cloud-devops.html` | 23 | AWS vs GCP, IAM, VPC, compute and autoscaling, storage, DNS/CDN/LB, serverless and messaging, Docker, Kubernetes, CI/CD, Terraform, end-to-end deployment, observability, security, cost, Linux |
| 05 | AI Engineering: LLMs, RAG & MCP | `dist/ai-engineering.html` | 23 | How LLMs work, sampling, prompting, embeddings, vector DBs, RAG basic → advanced, evaluation, tool calling, agents, MCP (2026-07-28 spec), Spring AI 2.0, LLMOps, AI system design |

Every book ends with a cheat sheet, an interview question bank (tick what you know) and a filterable quiz. Progress, "continue reading" and quiz scores are saved in the browser (`localStorage`, one namespace per book) and shown on the landing page.

## Use it

Open `dist/index.html` in any browser. Every page is a single self-contained HTML file (CSS, JS, data and diagrams inlined), so it works offline and can be copied anywhere. Fonts load from Google Fonts when online and fall back to system fonts offline.

## Build it

Requires Node.js 18+ and nothing else (no `npm install`).

```bash
node build.js            # build everything into dist/
node build.js --watch    # rebuild on every change in shared/, books/ or landing/
npm run build            # same, via package.json
```

The build validates as it goes and prints problems instead of silently producing broken pages: unknown chapter references, cross-book links to chapters that don't exist, duplicate ids, unresolved `{{placeholders}}`, and any inlined file that contains a literal closing `script`/`style` tag.

## Project layout

```
handbook.json               title, tagline and the order of the books
build.js                    zero-dependency build (read this file's header for the full contract)
shared/
  template.html             page template for every book
  svg-defs.html             arrow markers used by diagrams
  css/                      design tokens (light + dark), layout, components, diagrams, code, widgets, quiz
  js/core/                  SDB namespace, theme, navigation, progress, search, copy buttons
  js/features/              quiz and interview-bank engines
  js/widgets/               data-driven widgets usable from any chapter (sequence diagrams, practice terminal)
  icons/                    book icons (24×24, currentColor)
landing/                    landing page template, CSS (cards, bookshelf, roadmap) and JS (progress, search, tilt)
books/<book-id>/
  book.json                 title, short name, icon, tagline, description, topics, colour theme (light/dark)
  chapters/<NN-part>/<NN-chapter>.html    content, in reading order (folder and file names decide the order)
  widgets/*.js, *.css       that book's simulators and their styles (picked up automatically)
  data/quiz.js              SDB.data.quiz = [{ c, q, o, a, w }]
  data/interview-bank.js    SDB.data.interviewBank = [{ c, lvl, q, a }]
dist/                       generated output (safe to delete)
```

## Writing content

### A chapter

```html
<section class="chapter" id="ch-my-topic" data-title="Short title for the sidebar">
  <header class="ch-head">
    <div class="ch-eyebrow"><span class="num">{{num}}</span>Part name</div>
    <h2>Full chapter title</h2>
    <p class="ch-oneline"><b>The one-sentence idea.</b> A little more context.</p>
  </header>

  <div class="box story"><div class="box-tag">In Ramu's kitchen</div><p>The analogy.</p></div>

  <figure class="figure"><div class="svgwrap"><svg viewBox="0 0 860 200" role="img" aria-label="…">…</svg></div>
    <figcaption><b>Figure {{num}}.1</b> Caption.</figcaption></figure>

<div class="compare">
<script type="text/x-code" data-lang="java" data-variant="bad" data-title="Before">…</script>
<script type="text/x-code" data-lang="java" data-variant="good" data-title="After">…</script>
</div>

  <div class="box remember"><div class="box-tag">Lock it in</div><p class="mnemonic">Hook.</p><p>Summary.</p></div>
  <div class="qa"><h4>Interview questions</h4><details><summary>Q?</summary><div class="ans"><p>A.</p></div></details></div>
  {{done}}
</section>
```

* Chapters are numbered automatically; a part opener is a `<div class="part-opener" id="part-x" data-name="…">` containing `{{part}} · {{range}}` and `{{chips}}`.
* Code blocks are `<script type="text/x-code">` so you can paste code as-is (no HTML escaping). Languages: `java sql js json ts py http yaml sh docker properties hcl text`. Variants: `bad`, `good`, `plain`.
* Boxes: `story`, `def`, `layman`, `tip`, `pitfall`, `remember`. Cards: `<div class="cards"><div class="card good|bad">…`. Tables: `<div class="table-wrap"><table class="t">`.
* Diagram classes: fills `d-box d-acc d-good d-amb d-bad d-vio d-teal d-paper`, lines `d-line d-lacc d-lgood d-lbad d-lamb d-lvio` (+ `d-dash d-flow`), text `d-t d-tl d-s d-xs d-m`, arrow markers `url(#ah|aa|ag|ab|av|am|tri)`. All adapt to dark mode.

### Placeholders

| Placeholder | Becomes |
|-------------|---------|
| `{{num}}` | this chapter's number |
| `{{done}}` | "Mark chapter as done" + link to the next chapter |
| `{{ref:ch-id}}` / `{{n:ch-id}}` / `{{title:ch-id}}` | link "Chapter N" / the number / the title of another chapter in the same book |
| `{{xref:book-id/ch-id}}` | link to a chapter in another book |
| `{{count}} {{diagrams}} {{widgets}} {{quizcount}} {{bankcount}}` | live totals for the book |

### No-code widgets

A self-drawing sequence diagram:

```html
<div class="widget" data-sequence>
  <div class="widget-head"><span class="live">Live</span>Title</div>
  <div class="widget-body">
    <script type="application/json">
    {"actors":[{"id":"c","label":"Client","sub":"browser","cls":"d-vio"}, …],
     "steps":[{"from":"c","to":"s","msg":"GET /x","text":"Explanation shown under the diagram"}, …]}
    </script>
  </div>
</div>
```

A practice terminal: same wrapper with `data-terminal` and `{"prompt": "…", "welcome": "…", "commands": [{"cmd": "…", "out": "…", "note": "…"}]}`.

### A custom simulator

Add `books/<id>/widgets/my-widget.js` (and optionally `my-widget.css`):

```js
SDB.register("widget-my-widget", function () {
  var $ = SDB.$, root = $("#myWidgetRoot");
  if (!root) return;          // the script is included in every page of the book; bail out if not used
  // build controls, render, use SDB.log(el, html) for the log panel and SDB.store for persistence
});
```

### Quiz and interview bank

Append objects to `data/quiz.js` (`{ c: "Topic", q: "Question", o: ["A", "B", "C"], a: 1, w: "Why" }`) or `data/interview-bank.js` (`{ c: "Topic", lvl: "core|mid|senior", q: "Question", a: "<p>HTML answer</p>" }`). Topics become filter chips automatically.

### A new book

1. Create `books/<new-id>/book.json` (copy an existing one; pick colours with enough contrast in both themes).
2. Add chapters, data and widgets.
3. Add the id to `books` in `handbook.json`. The landing page card, bookshelf spine, search index and "other books" links appear automatically; add a roadmap column in `landing/index.html` if you want one.

## Design rules

* One running analogy per book (Ramu's kitchen, franchise, food court, AI assistant), one idea per box, and before/after code with comments on every line that matters.
* Colours come from tokens in `shared/css/tokens.css` and each book's `theme`; never hard-code hex colours in chapters or widgets.
* Every page must work at 360 px wide, in light and dark mode, and with no network.

## Currency of facts

Version-specific content was checked in October 2026: Java 25 (LTS), Spring Boot 4.0/4.1 and Spring Framework 7, Spring AI 2.0, the MCP specification revision 2026-07-28. Update the "What's new" chapters (`ch-modern`, `ch-boot4`, `ch-mcp`, `ch-spring-ai`) when new versions ship.
