/* Guided tour for the static Open-MES demo: a spotlight, a yellow arrow and a tooltip card per step.
 *
 * Loaded by demo.js on every page. The current step is kept in localStorage so the tour carries on across
 * pages. Steps whose element is missing (a different dataset, a hidden mobile menu) show centred instead.
 *
 *   page    regex the step's page path must match (path is relative to the site root, e.g. "board/index.html")
 *   url     page to open when moving *to* this step from a different page
 *   sel     CSS selector, or a function returning an element, for the highlight (none = centred card)
 *   all     highlight the union of every match for `sel`
 *   up      climb to the closest ancestor matching this selector before highlighting
 *   side    where the tooltip goes: top, bottom, left, right (default: whichever has room)
 *   go      function returning the URL to open when leaving this step for one on another page
 */
(function () {
  "use strict";

  var rootMeta = document.querySelector('meta[name="static-root"]');
  var BASE = new URL((rootMeta && rootMeta.content) || "./", location.href);
  var KEY = "mesTour";
  var YELLOW = "#ffd43b";

  function currentPage() {
    var path = decodeURIComponent(location.pathname);
    var rel = path.indexOf(BASE.pathname) === 0 ? path.slice(BASE.pathname.length) : path.replace(/^\/+/, "");
    if (rel === "" || rel.slice(-1) === "/") rel += "index.html";
    return rel;
  }

  function byText(selector, text) {
    var all = document.querySelectorAll(selector);
    for (var i = 0; i < all.length; i++) if (all[i].textContent.trim().indexOf(text) === 0) return all[i];
    return null;
  }

  function firstCardIn(columnTitle) {
    var head = byText(".col-head h2", columnTitle);
    var column = head && head.closest(".col-head").parentElement;
    return column ? column.querySelector("a.card-link") : null;
  }

  function href(el) { return el ? el.href : null; }

  // The first product in the table that has a bill of materials page in this build.
  function productWithBom() {
    var pages = (window.__MES_MANIFEST && window.__MES_MANIFEST.pages) || {};
    var links = document.querySelectorAll("table tbody tr a");
    for (var i = 0; i < links.length; i++) {
      var m = /(\d+)\/index\.html$/.exec(links[i].getAttribute("href") || "");
      if (m && pages["/products/" + m[1] + "/bom/"]) return links[i];
    }
    return links[0] || null;
  }

  var STEPS = [
    { page: /^index\.html$/, title: "Welcome to the Matrix MES demo",
      text: "A two-minute tour of the main screens. Everything here is a read-only snapshot, so click freely. Use the arrow keys or the buttons to move on." },
    { page: /^index\.html$/, sel: ".card.span-3", all: true, side: "bottom", title: "The numbers that matter",
      text: "Open orders, first-pass yield, overdue orders and this month's defects at a glance. The red and amber tiles are the ones that need attention." },
    { page: /^index\.html$/, sel: "#chart-units", up: ".card", side: "right", title: "Production over time",
      text: "Units produced per day for the last two weeks. The yield trend and order status charts below use the same live figures." },
    { page: /^index\.html$/, sel: "#alerts", side: "left", title: "Alerts",
      text: "Overdue orders, low stock and quality problems are collected here, so nobody has to go looking for them." },
    { page: /^index\.html$/, sel: 'a.nav[href$="products/index.html"]', side: "right", title: "The catalogue",
      text: "Finished products, assemblies and components sit in one catalogue, and every item cross-references the others. Let's open Products.",
      go: function () { return new URL("products/index.html", BASE).href; } },

    { page: /^products\/index\.html$/, url: "products/index.html", sel: "[data-table-search]", side: "bottom", title: "Search any table",
      text: "Every list in the system can be searched instantly, and clicking a column heading sorts it." },
    { page: /^products\/index\.html$/, sel: "[data-table-csv]", side: "bottom", title: "Export to CSV",
      text: "Any table can be downloaded as a spreadsheet-ready CSV, exactly as it is currently filtered." },
    { page: /^products\/index\.html$/, sel: productWithBom, side: "bottom", title: "Open a product",
      text: "Click a product code to see everything about it. We will open this one.",
      go: function () { return href(productWithBom()); } },

    { page: /^products\/\d+\/index\.html$/, sel: "h1", side: "bottom", title: "One page per product",
      text: "Price, cost to build, margin, stock, supplier, where it is used and how it is routed through the factory, all calculated from the bill of materials." },
    { page: /^products\/\d+\/index\.html$/, sel: 'a[href="bom/index.html"] button', side: "bottom", title: "Bill of materials",
      text: "Click here to explode the product into every sub-assembly and component it needs.",
      go: function () { return href(document.querySelector('a[href="bom/index.html"]')); } },

    { page: /^products\/\d+\/bom\/index\.html$/, sel: 'a[href$="index--view-flat.html"] button', side: "bottom", title: "Indented or flattened",
      text: "See the full tree level by level, or flatten it into a single parts list with total quantities. Both can be exported." },
    { page: /^products\/\d+\/bom\/index\.html$/, sel: 'a.nav[href$="board/index.html"]', side: "right", title: "Now to production",
      text: "Next, the work order board where the factory floor lives.",
      go: function () { return new URL("board/index.html", BASE).href; } },

    { page: /^board\/index\.html$/, url: "board/index.html", sel: ".col-head", all: true, side: "bottom", title: "The work order board",
      text: "Every work order moves left to right: entered, allocated, issued, in progress, QA, complete. The number on each heading is how many are at that stage." },
    { page: /^board\/index\.html$/, sel: function () { return firstCardIn("Complete") || document.querySelector("a.card-link"); },
      side: "left", title: "Open a work order", text: "Each card shows the product, quantity, due date and who is working on it. Click one to see its detail.",
      go: function () { var c = firstCardIn("Complete") || document.querySelector("a.card-link"); return href(c); } },

    { page: /^operator\/\d+\/index\.html$/, sel: ".stepper", side: "bottom", title: "Progress at a glance",
      text: "The stepper shows which stages are done. In the live system each stage is a button that a planner or technician presses." },
    { page: /^operator\/\d+\/index\.html$/, sel: function () { return byText("h2", "Units"); }, up: ".card", side: "top", title: "Serialised units",
      text: "Every unit built gets a serial number with its test results and any retests, which is what makes full traceability possible." },
    { page: /^operator\/\d+\/index\.html$/, sel: "button.small, button.big", side: "top", title: "Actions are disabled here",
      text: "In the real app these buttons allocate stock, assign technicians, start and finish work, and every press is written to an audit log. In this demo they only show a read-only notice.",
      go: function () { return new URL("timeline/index.html", BASE).href; } },

    { page: /^timeline\/index\.html$/, url: "timeline/index.html", sel: "#tl-scroll", side: "top", title: "Planning timeline",
      text: "Work orders laid out on a calendar by workstation, with a marker for today. Scroll sideways to look forward and back; late jobs stand out." ,
      go: function () { return new URL("machines/index.html", BASE).href; } },

    { page: /^machines\/index\.html$/, url: "machines/index.html", sel: "table", side: "top", title: "Machines",
      text: "Each machine and its status. Routings say which machine a build step needs, so the system knows what is available.",
      go: function () { return new URL("traceability/index.html", BASE).href; } },

    { page: /^traceability\/index\.html$/, url: "traceability/index.html", sel: "header form.search, .search", side: "bottom", title: "Trace any serial number",
      text: "Type a serial number here, from any page, to see the unit's full history: work order, components used, test results and defects. Try a serial from the work order page.",
      go: function () { return new URL("defects/index.html", BASE).href; } },

    { page: /^defects\/index\.html$/, url: "defects/index.html", sel: function () { return byText(".card-head h2", "Waste cost"); }, up: ".card", side: "bottom", title: "Defects and waste",
      text: "Defects are costed by part and by cause, so you can see where scrap money is going and what to fix first.",
      go: function () { return new URL("data/index.html", BASE).href; } },

    { page: /^data\/index\.html$/, url: "data/index.html", sel: "main .card", side: "bottom", title: "Data browser",
      text: "Every table in the system can be browsed here, searched and exported, which makes it easy to check the numbers behind any screen.",
      go: function () { return new URL("index.html", BASE).href; } },

    { page: /^index\.html$/, url: "index.html", last: true, title: "That's the tour",
      text: "You have seen the catalogue, bills of materials, the work order board, planning, traceability and quality. Use the yellow button at the bottom right to run the tour again any time." }
  ];

  /* ---------- state ---------- */

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: tour stays on this page */ }
  }

  var state = load();
  var index = typeof state.i === "number" ? state.i : -1;
  var layer, spot, arrow, card, launcher, raf;

  /* ---------- styles and elements ---------- */

  var css =
    ".mt-layer{position:fixed;inset:0;z-index:10000;pointer-events:none}" +
    ".mt-spot{position:fixed;border:3px solid " + YELLOW + ";border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.62);" +
      "transition:all .25s ease;animation:mt-pulse 1.6s ease-in-out infinite}" +
    ".mt-spot.mt-none{border-color:transparent;animation:none}" +
    "@keyframes mt-pulse{0%,100%{outline:0 solid rgba(255,212,59,.7)}50%{outline:8px solid rgba(255,212,59,0)}}" +
    ".mt-arrow{position:fixed;width:56px;height:56px;transition:all .25s ease;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}" +
    ".mt-arrow svg{width:100%;height:100%;animation:mt-bounce .7s ease-in-out infinite alternate}" +
    "@keyframes mt-bounce{from{transform:translateY(4px)}to{transform:translateY(-8px)}}" +
    ".mt-card{position:fixed;width:340px;max-width:calc(100vw - 24px);background:#fff;color:#1f2937;border-radius:12px;padding:16px 18px 14px;" +
      "box-shadow:0 14px 40px rgba(0,0,0,.35);border-top:5px solid " + YELLOW + ";pointer-events:auto;font:14px/1.5 system-ui,sans-serif}" +
    ".mt-card h3{margin:0 0 6px;font-size:16px;color:#111827}" +
    ".mt-card p{margin:0 0 12px}" +
    ".mt-foot{display:flex;align-items:center;gap:8px}" +
    ".mt-count{flex:1;font-size:12px;color:#6b7280}" +
    ".mt-card button{font:inherit;font-size:13px;border-radius:7px;padding:6px 12px;cursor:pointer;border:1px solid #d1d5db;background:#f9fafb;color:#111827}" +
    ".mt-card button.mt-next{background:" + YELLOW + ";border-color:#e0b100;font-weight:700}" +
    ".mt-card button.mt-skip{border:0;background:none;color:#6b7280;padding:6px 4px;text-decoration:underline}" +
    ".mt-launch{position:fixed;right:18px;bottom:18px;z-index:9999;background:" + YELLOW + ";color:#1f2937;border:2px solid #e0b100;border-radius:999px;" +
      "padding:9px 16px;font:700 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3)}" +
    ".mt-launch:hover{filter:brightness(.96)}";

  function build() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    layer = document.createElement("div");
    layer.className = "mt-layer";
    layer.hidden = true;
    spot = document.createElement("div");
    spot.className = "mt-spot";
    arrow = document.createElement("div");
    arrow.className = "mt-arrow";
    arrow.innerHTML = '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M28 4 6 30h14v22h16V30h14z" fill="' + YELLOW +
      '" stroke="#7a5b00" stroke-width="3" stroke-linejoin="round"/></svg>';
    card = document.createElement("div");
    card.className = "mt-card";
    card.setAttribute("role", "dialog");
    layer.appendChild(spot);
    layer.appendChild(arrow);
    layer.appendChild(card);
    document.body.appendChild(layer);

    launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "mt-launch";
    launcher.textContent = "▶ Take the tour";
    launcher.addEventListener("click", function () { start(); });
    document.body.appendChild(launcher);
  }

  /* ---------- positioning ---------- */

  function targetOf(step) {
    var els = [];
    if (typeof step.sel === "function") {
      var one = step.sel();
      if (one) els = [one];
    } else if (step.sel) {
      els = Array.prototype.slice.call(document.querySelectorAll(step.sel));
      if (!step.all) els = els.slice(0, 1);
    }
    if (step.up) els = els.map(function (e) { return e.closest(step.up) || e; });
    return els.filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  }

  function union(els) {
    var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    els.forEach(function (e) {
      var q = e.getBoundingClientRect();
      l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    });
    return { left: l, top: t, right: r, bottom: b };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function place() {
    var step = STEPS[index];
    if (!step || layer.hidden) return;
    var vw = window.innerWidth, vh = window.innerHeight, pad = 6, gap = 64;
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var els = targetOf(step);

    if (!els.length) {
      spot.className = "mt-spot mt-none";
      spot.style.cssText = "left:" + vw / 2 + "px;top:" + vh / 2 + "px;width:0;height:0";
      arrow.style.display = "none";
      card.style.left = clamp((vw - cw) / 2, 12, vw) + "px";
      card.style.top = clamp((vh - ch) / 2, 12, vh) + "px";
      return;
    }

    var r = union(els);
    var left = Math.max(r.left - pad, 4), top = Math.max(r.top - pad, 4);
    var width = Math.min(r.right + pad, vw - 4) - left, height = Math.min(r.bottom + pad, vh - 4) - top;
    spot.className = "mt-spot";
    spot.style.cssText = "left:" + left + "px;top:" + top + "px;width:" + width + "px;height:" + height + "px";

    var side = step.side;
    var room = { bottom: vh - (top + height), top: top, right: vw - (left + width), left: left };
    var need = { bottom: ch + gap, top: ch + gap, right: cw + gap, left: cw + gap };
    if (!side || room[side] < need[side]) {
      side = ["bottom", "top", "right", "left"].filter(function (s) { return room[s] >= need[s]; })[0] || "inside";
    }

    arrow.style.display = "";
    var cx = left + width / 2, cy = top + height / 2, ax, ay, rot, cardL, cardT;
    if (side === "bottom") { ax = cx - 28; ay = top + height + 4; rot = 0; cardT = ay + 56 + 4; cardL = cx - cw / 2; }
    else if (side === "top") { ax = cx - 28; ay = top - 60; rot = 180; cardT = ay - ch - 4; cardL = cx - cw / 2; }
    else if (side === "right") { ax = left + width + 4; ay = cy - 28; rot = -90; cardL = ax + 56 + 4; cardT = cy - ch / 2; }
    else if (side === "left") { ax = left - 60; ay = cy - 28; rot = 90; cardL = ax - cw - 4; cardT = cy - ch / 2; }
    else { ax = left + 12; ay = top + 12; rot = -45; cardL = vw - cw - 18; cardT = vh - ch - 70; }

    ax = clamp(ax, 4, vw - 60);
    ay = clamp(ay, 4, vh - 60);
    arrow.style.left = ax + "px";
    arrow.style.top = ay + "px";
    arrow.style.transform = "rotate(" + rot + "deg)";
    card.style.left = clamp(cardL, 12, vw - cw - 12) + "px";
    card.style.top = clamp(cardT, 12, vh - ch - 12) + "px";
  }

  function schedulePlace() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  }

  /* ---------- steps ---------- */

  function render() {
    var step = STEPS[index];
    var first = index === 0, last = index === STEPS.length - 1;
    card.innerHTML = "";
    var h = document.createElement("h3"); h.textContent = step.title;
    var p = document.createElement("p"); p.textContent = step.text;
    var foot = document.createElement("div"); foot.className = "mt-foot";
    var count = document.createElement("span"); count.className = "mt-count"; count.textContent = (index + 1) + " of " + STEPS.length;
    var skip = document.createElement("button"); skip.type = "button"; skip.className = "mt-skip"; skip.textContent = last ? "Close" : "Skip";
    skip.addEventListener("click", stop);
    foot.appendChild(count); foot.appendChild(skip);
    if (!first) {
      var back = document.createElement("button"); back.type = "button"; back.textContent = "Back";
      back.addEventListener("click", function () { move(-1); });
      foot.appendChild(back);
    }
    if (!last) {
      var next = document.createElement("button"); next.type = "button"; next.className = "mt-next";
      next.textContent = first ? "Start tour" : "Next";
      next.addEventListener("click", function () { move(1); });
      foot.appendChild(next);
    }
    card.appendChild(h); card.appendChild(p); card.appendChild(foot);

    layer.hidden = false;
    launcher.hidden = true;
    state.urls = state.urls || {};
    state.urls[index] = location.href;
    save(state);

    var els = targetOf(step);
    if (els.length) {
      var r = els[0].getBoundingClientRect();
      if (r.top < 70 || r.top > window.innerHeight - 160) {
        window.scrollTo(0, Math.max(0, window.pageYOffset + r.top - 120));
      }
    }
    place();
    setTimeout(place, 250);
  }

  function move(delta) {
    var from = STEPS[index], to = STEPS[index + delta];
    if (!to) return;
    var target = null;
    if (!to.page.test(currentPage())) {
      if (delta > 0) target = (from.go && from.go()) || (to.url && new URL(to.url, BASE).href);
      else target = (state.urls && state.urls[index + delta]) || (to.url && new URL(to.url, BASE).href);
    }
    index += delta;
    state.i = index;
    save(state);
    if (target) { location.href = target; return; }
    render();
  }

  function start() {
    index = 0;
    state = { i: 0, seen: true, urls: {} };
    save(state);
    if (!STEPS[0].page.test(currentPage())) { location.href = new URL("index.html", BASE).href; return; }
    render();
  }

  function stop() {
    index = -1;
    state = { i: -1, seen: true, urls: {} };
    save(state);
    layer.hidden = true;
    launcher.hidden = false;
  }

  function init() {
    build();
    window.addEventListener("resize", schedulePlace);
    window.addEventListener("scroll", schedulePlace, true);
    document.addEventListener("keydown", function (e) {
      if (layer.hidden) return;
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    });

    var page = currentPage();
    if (index >= 0 && STEPS[index]) {
      if (STEPS[index].page.test(page)) { render(); return; }
      // Landed somewhere unexpected (back button, manual navigation): drop the tour rather than point at nothing.
      stop();
      return;
    }
    // First visit to the dashboard: offer the tour once.
    if (!state.seen && /^index\.html$/.test(page)) { start(); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
