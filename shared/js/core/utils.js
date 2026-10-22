/*
 * SDB: the one global namespace for the book.
 * Every other script adds itself to it. Load this file first.
 *
 *   SDB.$(sel, root)        querySelector
 *   SDB.$$(sel, root)       querySelectorAll as an array
 *   SDB.store.get/set       localStorage that never throws (private mode, blocked storage)
 *   SDB.log(el, html)       prepend a line to a widget log (keeps the last 40)
 *   SDB.svg(tag, attrs)     create an SVG element
 *   SDB.register(name, fn)  queue a feature; js/app.js runs them all once the page is ready
 */
(function () {
  "use strict";
  var SDB = window.SDB = window.SDB || {};
  SDB.data = SDB.data || {};
  SDB.book = SDB.book || { id: "book", title: "" };
  /** Storage key namespaced per book, e.g. key("done") -> "sdh-java-core-done". */
  SDB.key = function (name) { return "sdh-" + SDB.book.id + "-" + name; };
  SDB.features = [];

  SDB.$ = function (sel, root) { return (root || document).querySelector(sel); };
  SDB.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  SDB.store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: progress just won't persist */ }
    }
  };

  SDB.log = function (el, html) {
    if (!el) return;
    var line = document.createElement("div");
    line.innerHTML = html;
    el.insertBefore(line, el.firstChild);
    while (el.childNodes.length > 40) el.removeChild(el.lastChild);
  };

  SDB.svg = function (tag, attrs, text) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  };

  SDB.time = function () { return new Date().toLocaleTimeString(); };

  SDB.register = function (name, fn) { SDB.features.push({ name: name, fn: fn }); };
})();
