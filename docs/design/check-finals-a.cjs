// Browser checks for Final A ("Paper and Wire"), the verdict's guardrails G1–G20 that a grep can't decide.
// docs/design/VERDICT-meeting-r1.md §5. Run: node check-finals-a.cjs https://<deploy>  (check-finals-tells.sh runs it on the Mac).
const { chromium } = require(process.env.PW || "/opt/homebrew/lib/node_modules/@playwright/mcp/node_modules/playwright-core");

const BASE = process.argv[2].replace(/\/$/, "");
const P = "/finals/a";
const HERO = "PP-R-NKT-10227591";
const CASE = `${P}/case/${HERO}`;
const REAL_API = "https://caseclerk.vercel.app/api/cases/PP-R-JKB-10194463";
// Real sandbox cases on production. VPY is CAMERA ONLY: these checks never approve it, and every context
// aborts any request to an approve route, so no check can approve a real action even by mistake.
const REAL_IDS = { "PP-R-VPY-10194485": "pending", "PP-R-NJA-10194486": "deciding|resolved", "PP-R-JKB-10194463": "deciding", "PP-R-RCJ-10194476": "resolved" };
const API = "https://caseclerk.vercel.app/api/cases/";
let approveAttempts = 0;
const DUE = ["2026-10-26T23:59:00-07:00", "2026-10-27T23:59:00-07:00", "2026-10-28T23:59:00-07:00", "2026-10-29T23:59:00-07:00", "2026-11-04T23:59:00-08:00"];

const V1440 = { name: "1440x810", viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 };
const V1920 = { name: "1920x940", viewport: { width: 1920, height: 940 }, deviceScaleFactor: 1 };
const V1536 = { name: "1536x752@1.25", viewport: { width: 1536, height: 752 }, deviceScaleFactor: 1.25 };
const V2560 = { name: "2560x1440", viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 };
const PHONE = { name: "390x844", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const DESK = [V1440, V1920, V1536, V2560];
const ALL = [...DESK, PHONE];

let fail = 0;
let n = 0;
const out = (ok, name, note) => {
  n++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? ` (${note})` : ""}`);
  if (!ok) fail++;
};

async function open(browser, v, path, extra = {}) {
  const ctx = await browser.newContext({ ...v, ...extra });
  await ctx.route(/\/(live\/actions|api\/actions)\//, (r) => {
    approveAttempts++;
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  return { ctx, page, status: res.status(), errors };
}

const navCount = (page) =>
  page.evaluate(() => {
    const a = document.querySelector("header nav a[data-count]");
    return a ? Number(a.getAttribute("data-count")) : -1;
  });

// ---- In-page probes ----

/** G2, G3: every running animation has a cause; bounded durations; infinite only on the live dot and the in-flight rule. */
const animProbe = (page) =>
  page.evaluate(() => {
    const host = (t) => (t && t.getRootNode && t.getRootNode() instanceof ShadowRoot ? t.getRootNode().host : t);
    return document.getAnimations().map((a) => {
      const t = host(a.effect && a.effect.target);
      const tm = a.effect.getComputedTiming();
      return {
        cause: t && t.closest ? (t.closest("[data-cause]") || {}).getAttribute?.("data-cause") || null : null,
        dur: typeof tm.duration === "number" ? tm.duration : 0,
        inf: tm.iterations === Infinity,
        live: !!(t && t.closest && t.closest("[data-live-dot]")),
        inflight: !!(t && t.closest && t.closest("[data-inflight]")),
        undo: !!(t && t.closest && t.closest("[data-undo-rule]")),
        replay: !!(t && t.closest && t.closest("[data-replay]")),
        what: t ? (t.className && t.className.baseVal === undefined ? String(t.className).slice(0, 40) : t.tagName) : "?",
      };
    });
  });

function judgeAnims(list, where) {
  const noCause = list.filter((a) => !a.cause);
  out(!noCause.length, `G2 every animation has a data-cause, ${where}`, noCause.length ? noCause.slice(0, 3).map((a) => a.what).join(", ") : `${list.length} animations`);
  const long = list.filter((a) => a.dur > 900 && !a.inflight && !a.undo && !a.live && !a.replay);
  const inf = list.filter((a) => a.inf && !a.live && !a.inflight);
  out(!long.length && !inf.length, `G3 animations <= 900 ms, loops only on the live dot / in-flight rule, ${where}`, [...long, ...inf].slice(0, 3).map((a) => `${a.what} ${a.dur}ms`).join(", ") || "undo rule (4 s) and in-flight rule (1.4 s) exempt by spec");
}

/** G5 G6 G7 G8 G9 G20 and contrast, on whatever the page shows now. */
const pageProbe = (page, firstOnly) =>
  page.evaluate((first) => {
    const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => {
      const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const hls = ([r, g, b]) => {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      if (mx === mn) return [0, l, 0];
      const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return [h * 60, l, s];
    };
    const opaqueBg = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = rgb(getComputedStyle(e).backgroundColor);
        if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" && (!first || (r.top < innerHeight && r.bottom > 0));
    };
    const BLUE = ["rgb(0, 89, 184)", "rgb(111, 178, 255)"];
    const r = { dark: [], fx: [], blue: [], wireBad: [], shadow: [], wells: 0, small: [], wireSmall: [], contrast: [], tealWire: [], hue: [] };
    const area = innerWidth * innerHeight;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const bg = rgb(cs.backgroundColor);
      if (bg.length >= 3 && (bg.length === 3 || bg[3] > 0.9) && lum(bg) < 0.1 && box.width * box.height > area * 0.04 && !el.closest("[data-wire]") && !el.closest("button") && vis(el)) r.dark.push(el.tagName + "." + el.className);
      if ((cs.backdropFilter && cs.backdropFilter !== "none") || /blur/.test(cs.filter) || /conic-gradient|radial-gradient|repeating-/.test(cs.backgroundImage)) r.fx.push(el.tagName);
      const isBlue = (c) => {
        const v = rgb(c);
        if (v.length < 3 || (v.length === 4 && v[3] === 0)) return false;
        const [h, , sat] = hls(v.slice(0, 3));
        return BLUE.includes(c) || (h >= 200 && h <= 250 && sat > 0.5);
      };
      const paints = [
        [cs.color, true],
        [cs.backgroundColor, true],
        [cs.borderLeftColor, cs.borderLeftWidth !== "0px" && cs.borderLeftStyle !== "none"],
        [cs.borderTopColor, cs.borderTopWidth !== "0px" && cs.borderTopStyle !== "none"],
        [cs.textDecorationColor, cs.textDecorationLine !== "none"],
      ];
      for (const [c, used] of paints) if (used && isBlue(c) && !el.closest("[data-origin=paypal]") && vis(el)) r.blue.push(`${el.tagName}.${String(el.className).slice(0, 30)} ${c}`);
      if (cs.boxShadow !== "none" && vis(el) && !/(^|_)(slip|sheet|mat|tooltip)(_|$|\s)/.test(String(el.className))) r.shadow.push(String(el.className).slice(0, 40));
      if (cs.backgroundColor === "rgb(236, 231, 219)" && vis(el) && !el.hasAttribute("data-well")) r.shadow.push("well colour outside [data-well]: " + el.tagName);
      if (el.closest("[data-wire]") && vis(el) && el.closest("[data-origin=paypal]") && BLUE.includes(cs.color)) {
        const [h] = hls(rgb(cs.color));
        if (h < 205 || h > 225) r.hue.push(cs.color);
      }
    }
    r.wells = [...document.querySelectorAll("[data-well]")].filter(vis).length;
    for (const li of document.querySelectorAll("[data-wire-line]")) {
      if (li.getAttribute("data-origin") !== "paypal" && !li.hasAttribute("data-sample")) r.wireBad.push("no origin: " + li.textContent.slice(0, 30));
      if (/claude-|\$0\.|Triage|policy/i.test(li.textContent)) r.wireBad.push("forbidden: " + li.textContent.slice(0, 40));
    }
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const el = t.parentElement;
      if (!t.textContent.trim() || seen.has(el) || el.closest("[aria-hidden]")) continue;
      seen.add(el);
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      if (px < 13) r.small.push(`${t.textContent.trim().slice(0, 20)} ${px}px`);
      if (el.closest("[data-wire]") && px < 14 && el.closest("aside")) r.wireSmall.push(`${t.textContent.trim().slice(0, 20)} ${px}px`);
      const a = lum(rgb(cs.color)), b = lum(opaqueBg(el));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 4.5) r.contrast.push(`${t.textContent.trim().slice(0, 24)} ${ratio.toFixed(2)}`);
      if (el.closest("[data-wire]")) {
        const [h, , s] = hls(rgb(cs.color));
        if (h >= 150 && h <= 200 && s > 0.25) r.tealWire.push(cs.color);
      }
    }
    r.overlap = [];
    for (const li of document.querySelectorAll("[data-wire-line]")) {
      const spans = [...li.querySelectorAll("span")].filter((x) => x.children.length === 0 && x.getBoundingClientRect().width > 0 && vis(x));
      for (let i = 0; i < spans.length; i++)
        for (let j = i + 1; j < spans.length; j++) {
          const a = spans[i].getBoundingClientRect(), b = spans[j].getBoundingClientRect();
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) r.overlap.push(`${spans[i].textContent.slice(-12)} / ${spans[j].textContent.slice(0, 12)}`);
        }
    }
    const h1 = document.querySelector("h1");
    r.h1 = h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    const fig = document.querySelector("[class*='figureRow'] number-flow-react");
    r.money = fig ? parseFloat(getComputedStyle(fig).fontSize) : 0;
    return r;
  }, firstOnly);

function judgePage(r, where, { h1Min, moneyMin } = {}) {
  out(!r.dark.length, `G5 one dark plane, ${where}`, r.dark.slice(0, 2).join(", "));
  out(!r.fx.length, `G5 no backdrop-filter, blur, conic / radial / repeating gradients, ${where}`, r.fx.slice(0, 3).join(", "));
  out(!r.blue.length, `G6 blue only inside [data-origin=paypal], ${where}`, r.blue.slice(0, 3).join("; "));
  out(!r.wireBad.length, `G7 Wire lines are PayPal or sample, no model / cost / policy words, ${where}`, r.wireBad.slice(0, 2).join("; "));
  out(!r.overlap.length, `Wire text never overlaps inside a line, ${where}`, r.overlap.slice(0, 2).join("; "));
  out(!r.shadow.length && r.wells <= 2, `G8 shadows only on slip / sheet / mat / tooltip, <= 2 wells, ${where}`, r.shadow.slice(0, 3).join(", ") || `${r.wells} wells`);
  out(!r.small.length && !r.wireSmall.length, `G9 text >= 13 px, Wire >= 14 px, ${where}`, [...r.small, ...r.wireSmall].slice(0, 3).join("; "));
  if (h1Min) out(r.h1 >= h1Min, `G9 h1 >= ${h1Min} px, ${where}`, `${r.h1} px`);
  if (moneyMin) out(r.money >= moneyMin, `G9 money figure >= ${moneyMin} px, ${where}`, `${r.money} px`);
  out(!r.contrast.length, `G9 contrast >= 4.5:1, ${where}`, r.contrast.slice(0, 3).join("; "));
  out(!r.hue.length && !r.tealWire.length, `G20 Wire blue hue 205-225, no teal on the Wire, ${where}`, [...r.hue, ...r.tealWire].slice(0, 3).join(", "));
}

/** G13: the first screen proves it's live. */
const liveProbe = (page) =>
  page.evaluate(() => {
    const wire = [...document.querySelectorAll("[data-wire]")].find((w) => w.offsetWidth > 0 && w.tagName === "ASIDE");
    if (!wire) return null;
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight;
    };
    const lines = [...wire.querySelectorAll("[data-wire-line]")].filter(inView);
    const event = lines.some((l) => /CUSTOMER\.DISPUTE\.[A-Z_]+|\/v1\/customer\/disputes|\/v2\/checkout\/orders/.test(l.textContent));
    const debug = [...wire.querySelectorAll("[data-origin=paypal] span")].filter((s) => inView(s) && /^debug [0-9a-f]{12,13}$/.test(s.textContent.trim()) && parseFloat(getComputedStyle(s).fontSize) >= 14);
    const paper = document.body.innerText;
    return { event, debug: debug.length, cents: /\$\d[\d,]*\.\d{2}/.test(paper), replay: /Replay of PP-R-[A-Z]{3}-\d{8}, recorded [A-Z][a-z]{2} \d+/.test(wire.textContent) };
  });

/** Ids on the page: real (blue) lines' debug ids and event ids. */
const idsProbe = (page) =>
  page.evaluate(() => {
    const real = [...document.querySelectorAll("[data-wire-line][data-origin=paypal]")];
    const sample = [...document.querySelectorAll("[data-wire-line][data-sample]")];
    return {
      debug: real.map((l) => (l.textContent.match(/debug ([0-9a-f]{12,13})/) || [])[1]).filter(Boolean),
      events: real.map((l) => ((l.getAttribute("title") || "").match(/^Event (\S+)$/) || [])[1]).filter(Boolean),
      sampleDebug: sample.filter((l) => /debug [0-9a-f]{12,13}/.test(l.textContent)).length,
    };
  });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const real = await (await fetch(REAL_API)).json();
  const realDebug = new Set(real.actions.map((a) => a.result && a.result.debugId).filter(Boolean));
  const realEvents = new Set(real.audit.map((a) => a.data && a.data.eventId).filter(Boolean));
  const allReal = {};
  const anyDebug = new Set();
  const anyEvent = new Set();
  for (const id of Object.keys(REAL_IDS)) {
    const j = await (await fetch(API + id)).json();
    allReal[id] = j;
    for (const a of j.actions) if (a.result && a.result.debugId) anyDebug.add(a.result.debugId);
    for (const a of j.audit) if (a.data && a.data.eventId) anyEvent.add(a.data.eventId);
    for (const w of j.wire || []) (w.debugId ? anyDebug : w.eventId ? anyEvent : new Set()).add(w.debugId || w.eventId);
  }

  // ---- Case page, pending: fold, type, colour, depth, at every size ----
  for (const v of ALL) {
    const { ctx, page, status, errors } = await open(browser, v, `${CASE}?state=pending`);
    out(status === 200 && !errors.length, `case page loads without errors at ${v.name}`, errors.slice(0, 2).join("; "));
    const btn = page.locator("[data-approve]");
    const box = await btn.boundingBox();
    const slip = await page.locator("[data-slip]").boundingBox();
    const vh = v.viewport.height;
    if (v === PHONE) {
      const amt = await page.evaluate(() => {
        const a = document.querySelector("[data-slip] p");
        const r = [...document.querySelectorAll("[data-slip] p")].find((p) => /^\$\d/.test(p.textContent));
        return r ? r.getBoundingClientRect().bottom : 9999;
      });
      out(box && box.y + box.height <= 844 && /\$412\.00/.test((await btn.textContent()) || ""), `G14 phone: amount (on the button) and Approve visible without scrolling`, box ? `Approve bottom ${Math.round(box.y + box.height)}, amount bottom ${Math.round(amt)}` : "no button");
    } else {
      out(box && box.y + box.height <= vh - 24, `G14 Approve bottom <= innerHeight - 24 at ${v.name}`, box ? `${Math.round(box.y + box.height)} of ${vh - 24}` : "no button");
    }
    out(slip && slip.height <= 260, `G14 slip <= 260 px tall at ${v.name}`, slip ? `${Math.round(slip.height)} px` : "no slip");
    out(/\$412\.00/.test((await btn.textContent()) || ""), `slip button names the action and amount at ${v.name}`, ((await btn.textContent()) || "").trim());
    judgePage(await pageProbe(page, true), `case first screen ${v.name}`, v === V1440 ? { h1Min: 46, moneyMin: 50 } : {});
    if (v === V1440) {
      judgeAnims(await animProbe(page), "case page at rest");
      const live = await liveProbe(page);
      out(live && live.event && live.debug >= 1 && live.cents, "G13 case first screen: Wire with a PayPal event, a real debug id >= 14 px, an amount with cents", JSON.stringify(live));
      out((await page.locator("text=Sample case").count()) >= 1, "G12 the sample case says Sample case");
      const ids = await idsProbe(page);
      out(ids.sampleDebug === 0, "G12 sample Wire lines carry no debug id", `${ids.sampleDebug}`);
    }
    if (v === PHONE) {
      const m = await page.evaluate(() => ({ nav: document.querySelector("header nav").scrollWidth - document.querySelector("header nav").clientWidth, doc: document.documentElement.scrollWidth, bar: !!document.querySelector("button[data-wire]") && document.querySelector("button[data-wire]").offsetHeight > 0 }));
      out(m.nav <= 0 && m.doc <= 390, "phone: nav not clipped, no sideways scroll", JSON.stringify(m));
      out(m.bar, "phone: the Wire collapses to a one-line bar");
    }
    await ctx.close();
  }

  // ---- Follow the Approve click at every size (G1, then all page state) ----
  for (const v of ALL) {
    const { ctx, page } = await open(browser, v, `${CASE}?state=pending&controls=1`);
    await page.waitForTimeout(1500);
    const before = await navCount(page);
    await page.locator("[data-approve]").click();
    await page.waitForTimeout(300);
    out((await page.locator("[data-send-now]").count()) === 1 && (await page.locator("text=Undo").count()) >= 1, `undo window with Undo and Send now at ${v.name}`);
    if (v === V1440) judgeAnims(await animProbe(page), "undo window");
    const start = await page.locator("[data-slip]").boundingBox();
    const wireBox = await page.evaluate(() => {
      const w = [...document.querySelectorAll("[data-wire]")].find((x) => x.offsetWidth > 0);
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.locator("[data-send-now]").click();
    await page.waitForTimeout(560);
    const anims = await page.evaluate(() => document.getAnimations().length);
    const mid = await page.locator("[data-slip]").boundingBox().catch(() => null);
    const dist = (b) => Math.hypot(b.x + b.width / 2 - wireBox.x, b.y + b.height / 2 - wireBox.y);
    const moved = start && mid ? dist(start) - dist(mid) : 0;
    out(anims >= 2 && moved >= 160, `G1 after Send now: >= 2 animations and the slip moves >= 160 px toward the Wire at ${v.name}`, `${anims} animations, ${Math.round(moved)} px closer`);
    if (v === V1440) {
      const inflight = await page.locator("[data-inflight]").count();
      out(inflight === 1, "in-flight rule under the POST entry while PayPal answers", `${inflight}`);
      judgeAnims(await animProbe(page), "slip in flight");
    }
    await page.waitForTimeout(2600);
    const body = await page.evaluate(() => document.body.innerText);
    const after = await navCount(page);
    out(after === before - 1, `after the 200 the nav count rolls down at ${v.name}`, `${before} to ${after}`);
    out(/Evidence filed with PayPal\. \d\d:\d\d:\d\d/.test(body), `slip area re-sets to "Evidence filed with PayPal. hh:mm:ss" at ${v.name}`);
    out(!/until you decide|Nothing reaches PayPal/.test(body), `after the 200 no "until you decide" anywhere at ${v.name}`);
    out((await page.locator("[data-approve]").count()) === 0 && (await page.locator("[data-inflight]").count()) === 0, `after the 200 no Approve button and no in-flight rule at ${v.name}`);
    if (v !== PHONE) {
      const wire = await page.evaluate(() => [...document.querySelectorAll("[data-wire-line]")].map((l) => l.textContent).join("\n"));
      out(/POST provide-evidence\s*staged/.test(wire) && !/POST provide-evidence\s*200/.test(wire.split("\n").filter((l) => !/debug/.test(l)).join("\n")), `the sample filing lands on the Wire as staged, not 200, at ${v.name}`);
    }
    if (v === V1440) {
      judgePage(await pageProbe(page, true), "case after the 200 at 1440");
      out(!/state=/.test(page.url()), "the forced ?state= leaves the address bar once applied", page.url().split("/").pop());
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      out((await page.locator("[data-approve]").count()) === 0, "after a reload, still no Approve (no path back)");
      await page.locator("[data-resolve]").click();
      await page.waitForTimeout(1200);
      const end = await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, body: document.body.innerText, wire: [...document.querySelectorAll("[data-wire-line]")].map((l) => l.textContent).join("\n") }));
      out(/staged ending/.test(end.h1) && !/You kept\s*\$392\.00/.test(end.body) && /staged ruling, sample only/.test(end.body), "resolve (controls only): a staged ending, no You kept $392.00, links to a real ruling", end.h1);
      out(/CUSTOMER\.DISPUTE\.RESOLVED/.test(end.wire), "resolve: CUSTOMER.DISPUTE.RESOLVED lands on the Wire");
      judgePage(await pageProbe(page, true), "case resolved at 1440");
    }
    await ctx.close();
  }

  // ---- G4 reduced motion ----
  {
    const { ctx, page } = await open(browser, V1440, `${CASE}?state=pending&controls=1`, { reducedMotion: "reduce" });
    const at = async (label) => {
      const list = await animProbe(page);
      const long = list.filter((a) => a.dur > 150 && !a.undo);
      out(!long.length, `G4 reduced motion: every animation <= 150 ms, ${label}`, long.slice(0, 3).map((a) => `${a.what} ${a.dur}ms`).join(", ") || `${list.length} animations`);
    };
    await at("at rest");
    await page.locator("[data-approve]").click();
    await page.waitForTimeout(100);
    await page.locator("[data-send-now]").click();
    await page.waitForTimeout(60);
    await at("while sending");
    await page.waitForTimeout(2600);
    await page.locator("[data-resolve]").click();
    await page.waitForTimeout(60);
    await at("on resolve");
    await ctx.close();
  }

  // ---- URL states, reader, J/K ----
  {
    const { ctx, page } = await open(browser, V1440, `${CASE}?state=approved`);
    out(/Evidence filed with PayPal/.test(await page.evaluate(() => document.body.innerText)), "?state=approved opens the approved state");
    await page.goto(`${BASE}${CASE}?state=resolved&controls=1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    out(/staged ruling, sample only/.test(await page.evaluate(() => document.body.innerText)), "?state=resolved opens the staged resolved state");
    await page.locator("[data-sheet]").first().click();
    await page.waitForTimeout(400);
    const rd = await page.evaluate(() => {
      const r = document.querySelector("[data-reader]");
      return r ? { w: r.getBoundingClientRect().width, px: parseFloat(getComputedStyle(r.querySelector("p")).fontSize) } : null;
    });
    out(rd && rd.w <= 640 && rd.px >= 16, "a sheet opens the in-place reader (<= 640 px, body >= 16 px)", JSON.stringify(rd));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(450);
    out((await page.locator("[data-reader]").count()) === 0, "Esc closes the reader");
    const url = page.url();
    await page.keyboard.press("j");
    await page.waitForURL((u) => u.toString() !== url, { timeout: 5000 }).catch(() => {});
    out(page.url() !== url && /\/finals\/a\/case\//.test(page.url()), "J moves to the next case", page.url().split("/").pop());
    await ctx.close();
  }

  // ---- Inbox: G13, G15, G19, page probe ----
  for (const v of [V1440, V1920, V1536, V2560, PHONE]) {
    const { ctx, page } = await open(browser, v, `${P}/inbox`);
    const strip = await page.evaluate(() => {
      const s = document.querySelector("[data-strip]");
      const cells = [...s.children];
      return {
        cells: cells.length,
        over: s.scrollWidth - s.clientWidth,
        cellOver: cells.filter((c) => c.scrollWidth > c.clientWidth + 0.5).length,
        due: [...s.querySelectorAll("[data-due]")].map((m) => ({ due: m.getAttribute("data-due"), cents: /\.\d\d/.test(m.textContent) })),
        cutAmounts: [...s.querySelectorAll("[data-due] > span:first-child")].filter((x) => x.offsetWidth > 0 && x.scrollWidth > x.clientWidth).map((x) => x.textContent),
      };
    });
    out(!strip.cutAmounts.length, `G19 no strip amount is truncated at ${v.name}`, strip.cutAmounts.join(", "));
    out(strip.cells === 14 && strip.over <= 0 && !strip.cellOver, `G19 14-day strip has no overflow at ${v.name}`, JSON.stringify({ cells: strip.cells, over: strip.over, cellOver: strip.cellOver }));
    out(strip.due.length && strip.due.every((m) => DUE.includes(m.due) && !m.cents), `G19 every strip mark is bound to a case dueAt, amounts without cents at ${v.name}`, `${strip.due.length} marks`);
    judgePage(await pageProbe(page, true), `inbox first screen ${v.name}`, v === V1440 ? { h1Min: 46 } : {});
    if (v === V1440) {
      const live = await liveProbe(page);
      out(live && live.event && live.debug >= 1 && live.cents, "G13 inbox first screen: Wire with a PayPal event, a debug id >= 14 px, an amount with cents", JSON.stringify(live));
      const ids = await idsProbe(page);
      // The inbox lists every sandbox test case production returns, so the ids are checked against that same list.
      const listed = (await (await fetch(API.replace(/\/$/, "") + "?test=true&limit=50")).json()).cases.map((c) => c.id);
      for (const id of listed) {
        const j = await (await fetch(API + id)).json();
        for (const a of j.actions) if (a.result && a.result.debugId) anyDebug.add(a.result.debugId);
        for (const a of j.audit) if (a.data && a.data.eventId) anyEvent.add(a.data.eventId);
        for (const w of j.wire || []) (w.debugId ? anyDebug : w.eventId ? anyEvent : new Set()).add(w.debugId || w.eventId);
      }
      const bad = [...ids.debug.filter((d) => !anyDebug.has(d)), ...ids.events.filter((e) => !anyEvent.has(e))];
      out(!bad.length && ids.debug.length >= 3, `G12 every debug id and event id on the inbox Wire exists in the production API for the real cases`, bad.join(", ") || `${ids.debug.length} debug ids, ${ids.events.length} event ids`);
      const first = await page.evaluate(() => {
        const a = document.querySelector("[data-case-row]");
        const jkb = document.querySelector("[data-case-row='PP-R-JKB-10194463']");
        return { real: a && a.hasAttribute("data-real-row"), text: a ? a.innerText : "", jkb: jkb ? jkb.innerText : "" };
      });
      out(first.real && /Real sandbox case/.test(first.text), "inbox row 1 is a real sandbox case, labelled Real sandbox case", first.text.split("\n")[1]);
      out(/debug f2843364d3500/.test(first.jkb) && /Real sandbox case/.test(first.jkb), "the JKB row shows its last PayPal call, debug f2843364d3500", first.jkb.replace(/\n/g, " ").slice(0, 120));
      out(new Set(ids.debug).size === ids.debug.length, "G12 no debug id is attached to two lines");
      const imgs = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => ({ src: i.getAttribute("src"), credit: i.getAttribute("data-credit") })));
      const credits = await (await page.request.get(`${BASE}/finals/CREDITS.md`)).text().catch(() => "");
      const badImg = [];
      for (const i of imgs) {
        const r = await page.request.get(BASE + i.src);
        const len = (await r.body()).length;
        if (!i.credit || !credits.includes(i.src.split("/").pop()) || len > 40960) badImg.push(`${i.src} ${len}B`);
      }
      out(imgs.length >= 3 && !badImg.length, `G11 every image has data-credit, is listed in CREDITS.md and <= 40 KB`, badImg.join(", ") || `${imgs.length} images`);
      // G15: each row opens its own case.
      const rows = await page.$$eval("[data-case-row]:not([data-real-row])", (as) => as.map((a) => ({ href: a.getAttribute("href"), buyer: a.querySelector("[class*='rowWho']").textContent.split(",")[0] })));
      const wrong = [];
      const kinds = new Set();
      for (const r of rows) {
        await page.goto(BASE + r.href, { waitUntil: "networkidle" });
        const t = await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, body: document.body.innerText, approve: !!document.querySelector("[data-approve]") }));
        if (!t.h1.includes(r.buyer)) wrong.push(`${r.buyer}: ${t.h1.slice(0, 40)}`);
        if (t.approve) kinds.add("approval");
        if (/The agent, now/.test(t.body)) kinds.add("working");
        if (/You kept/.test(t.body)) kinds.add("closed");
      }
      out(rows.length === 11 && !wrong.length, `G15 all ${rows.length} inbox rows open their own case (h1 names the buyer)`, wrong.slice(0, 2).join("; "));
      out(kinds.size === 3, "own-case routing covers waiting for you, agent working and closed", [...kinds].join(", "));
    }
    await ctx.close();
  }

  // ---- Landing: replay, G12, G13, CTA ----
  {
    const { ctx, page } = await open(browser, V1440, P);
    await page.waitForTimeout(9800);
    const live = await liveProbe(page);
    out(live && live.event && live.debug >= 1 && live.cents && live.replay, "G13 landing first screen: Replay of <id>, recorded <date>, a PayPal event, a debug id, an amount with cents", JSON.stringify(live));
    const nja = await (await fetch(API + "PP-R-NJA-10194486")).json();
    const njaIds = new Set([...nja.actions.map((a) => a.result && a.result.debugId), ...nja.audit.map((a) => a.data && a.data.eventId), ...(nja.wire || []).map((w) => w.debugId || w.eventId)].filter(Boolean));
    const land = await page.evaluate(() => {
      const h1 = document.querySelector("main h1");
      const lede = document.querySelector("main [class*='lede']");
      const open = document.querySelector("a[data-open-real]");
      const lines = [...document.querySelectorAll("[data-wire-line]")];
      const clock = (re) => { const l = lines.find((x) => re.test(x.textContent)); return l ? l.querySelector("[class*='lTime']").textContent : ""; };
      return {
        n: lines.length,
        top: lines[0] ? lines[0].textContent : "",
        order: !!(h1 && lede && h1.compareDocumentPosition(lede) & Node.DOCUMENT_POSITION_FOLLOWING),
        h1: h1 ? h1.textContent : "",
        cta: (document.querySelector("[class*='ctaNote']") || {}).textContent || "",
        open: open ? open.getAttribute("href") + " " + open.textContent : "",
        end: (document.querySelector("[data-replay-end]") || {}).textContent || "",
        created: clock(/CUSTOMER\.DISPUTE\.CREATED/),
        resolved: clock(/CUSTOMER\.DISPUTE\.RESOLVED/),
        filed: [...document.querySelectorAll("[data-wire-line]")].some((l) => /POST provide-evidence\s*200/.test(l.textContent) && /debug f8469524f503f/.test(l.textContent)),
      };
    });
    out(land.n >= 5 && /CUSTOMER\.DISPUTE\.RESOLVED/.test(land.top) && land.filed, "landing replay of NJA lands every line within 10 s, POST provide-evidence 200 with debug f8469524f503f, RESOLVED on top", `${land.n} lines`);
    const ids = await idsProbe(page);
    const bad = [...ids.debug, ...ids.events].filter((x) => !njaIds.has(x));
    out(!bad.length && ids.debug.length >= 1 && ids.events.length >= 3, "G12 every replayed id exists in NJA's production record", bad.join(", ") || `${ids.debug.length} debug ids, ${ids.events.length} event ids`);
    const to12 = (hms) => { const [h, m] = hms.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")}\u202f?\\s?${h < 12 ? "am" : "pm"}`; };
    const appr = nja.audit.find((a) => a.kind === "action.approved");
    const res = nja.audit.find((a) => a.kind === "webhook.received" && /RESOLVED/.test(a.data && a.data.eventType));
    const minsLater = appr && res ? Math.round((Math.floor(Date.parse(res.at) / 1000) - Math.floor(Date.parse(appr.at) / 1000)) / 60) : -1;
    out(land.order, "landing: the h1 comes before the 3-line intro");
    out(land.created && new RegExp(`came in at ${to12(land.created)} PT`).test(land.h1) && new RegExp(`${minsLater} minutes later`).test(land.h1), "landing h1 facts match the Wire: the CREATED clock, minutes from approval to RESOLVED", `${land.h1} [${land.created}, ${minsLater} min]`);
    out(land.cta.trim() === "A sandbox chargeback. PayPal\u2019s webhook reaches us in about 3 minutes.", "landing CTA note says it is a sandbox chargeback, webhook in about 3 minutes", land.cta);
    out(land.open === "/finals/a/case/PP-R-NJA-10194486 Open this case", "landing: Open this case goes to the real case it replays", land.open);
    out(land.resolved && land.end.includes(`PayPal closed the case at ${land.resolved} PT and paid the buyer itself`), "landing replay ends on the real RESOLVED, its clock matching the Wire", land.end);
    out(!/You kept/.test(await page.evaluate(() => document.body.innerText)), "landing makes no sample You kept claim");
    judgePage(await pageProbe(page, true), "landing first screen 1440", { h1Min: 46 });
    judgeAnims(await animProbe(page), "landing after the replay");
    await page.locator("[data-open-test]").click();
    await page.waitForTimeout(1000);
    const well = await page.evaluate(() => (document.querySelector("[data-well]") || {}).innerText || "");
    out(/Card payment created/.test(well), "Open a test dispute: stage 1 shows within 1 s", well.split("\n")[0]);
    await page.waitForTimeout(3600);
    const w2 = await page.evaluate(() => document.querySelector("[data-well]").innerText);
    out(/Waiting for PayPal's webhook, \d:\d\d so far/.test(w2), "the staged wait reaches the webhook stage with a ticking clock");
    await ctx.close();
  }
  for (const v of [V1920, V1536, PHONE]) {
    const { ctx, page } = await open(browser, v, P);
    await page.waitForTimeout(9800);
    judgePage(await pageProbe(page, true), `landing first screen ${v.name}`);
    await ctx.close();
  }

  // ---- Policy: the app's default rules, each tied to a case, the preview switch ----
  for (const v of [V1440, V1920, PHONE]) {
    const { ctx, page, status, errors } = await open(browser, v, `${P}/policy`);
    out(status === 200 && !errors.length, `policy page loads without errors at ${v.name}`, errors.slice(0, 2).join("; "));
    judgePage(await pageProbe(page, false), `policy whole page ${v.name}`, v === V1440 ? { h1Min: 46 } : {});
    if (v === V1440) {
      const r = await page.evaluate(() =>
        [...document.querySelectorAll("[data-rule]")].map((li) => ({ key: li.getAttribute("data-rule"), text: li.innerText, links: [...li.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")) })),
      );
      const all = r.map((x) => x.text).join("\n");
      const want = ["$15.00", "$50.00", "$250.00", "45%", "40%", "Friendly, brief, specific. Never blame the buyer."];
      out(want.every((w) => all.includes(w)) && !/45% of the order/.test(all), "policy shows DEFAULT_POLICY: $15.00, $50.00, $250.00, 45% to fight, 40% offers, the voice", want.filter((w) => !all.includes(w)).join(", "));
      const unlinked = r.filter((x) => x.key !== "preview" && !x.links.some((h) => h.startsWith("/finals/a")));
      out(r.length === 7 && !unlinked.length, "every policy rule links to a case where it applied", unlinked.map((x) => x.key).join(", ") || `${r.length} rules`);
      const sw = page.locator("[data-switch]");
      const before = await page.locator("[data-rule=preview] p").first().innerText();
      await sw.click();
      await page.waitForTimeout(500);
      const after = await page.locator("[data-rule=preview] p").first().innerText();
      out((await sw.getAttribute("aria-checked")) === "true" && before !== after && /calls nothing on PayPal/.test(after), "preview switch flips aria-checked and its consequence line", after.slice(0, 50));
      judgeAnims(await animProbe(page), "policy switch");
      out((await page.locator("header nav a[href='/finals/a/policy'][aria-current=page]").count()) === 1, "Policy is in the nav and marked current");
      const sent = await page.evaluate(() => ({ text: (document.querySelector("[data-policy-sentence]") || {}).innerText || "", n: (document.querySelector("[data-consequence]") || {}).getAttribute?.("data-consequence") }));
      // Open cases: the 7 sample ones plus every unresolved test case production lists; real pending filings wait at their amount.
      const tests = await Promise.all((await (await fetch(API.replace(/\/$/, "") + "?test=true&limit=50")).json()).cases.map(async (c) => (await fetch(API + c.id)).json()));
      const openReal = tests.filter((j) => j.case.snapshot.status !== "RESOLVED" && j.case.status !== "resolved");
      const filings = openReal.filter((j) => j.actions.some((a) => a.kind === "provide_evidence" && ["awaiting_approval", "approved", "executing"].includes(a.status))).map((j) => Number(j.case.snapshot.amount.value));
      const nOpen = 7 + openReal.length, at = (line) => filings.filter((v) => v >= line).length;
      out(/^Act on my own when the money is under/.test(sent.text) && sent.n === String(3 + at(250)) && new RegExp(`With this policy, .{0,12}of your ${nOpen} open cases would wait for you`).test(sent.text.replace(/\s+/g, " ")), `policy reads as a sentence with editable values; ${3 + at(250)} of ${nOpen} open cases would wait`, sent.text.split("\n").slice(-2)[0]);
      await page.locator("[data-policy-input=money]").fill("80");
      await page.waitForTimeout(1100);
      const n2 = await page.locator("[data-consequence]").getAttribute("data-consequence");
      await page.locator("[data-policy-input=evidence]").fill("500");
      await page.waitForTimeout(1100);
      const n3 = await page.locator("[data-consequence]").getAttribute("data-consequence");
      out(n2 === String(2 + at(250)) && n3 === String(at(500)), `editing the lines rolls the consequence: $80.00 money line -> ${2 + at(250)}, $500.00 evidence line -> ${at(500)}`, `${n2}, ${n3}`);
    }
    await ctx.close();
  }

  // ---- Judge round 1: sample honesty, the Wire, the slip, controls hidden ----
  {
    const { ctx, page } = await open(browser, V1440, `${CASE}?state=pending`);
    const w = await page.evaluate(() => {
      const lines = [...document.querySelectorAll("[data-wire-line]")];
      const sample = lines.filter((l) => l.hasAttribute("data-sample"));
      const real = lines.filter((l) => l.getAttribute("data-origin") === "paypal");
      const statusOf = (l) => (l.querySelector("[class*='lStatus']") || {}).textContent || "";
      const names = [...document.querySelectorAll("[data-wire-line] [class*='lName']")];
      const times = lines.map((l) => l.getAttribute("data-key"));
      return {
        sampleBad: sample.filter((l) => statusOf(l) !== "staged" || /sample/i.test(l.textContent)).map((l) => l.textContent.slice(0, 40)),
        sampleColor: sample.map((l) => getComputedStyle(l.querySelector("[class*='lStatus']")).color),
        realNoPlain: real.filter((l) => !l.querySelector("[class*='lPlain']") || l.querySelector("[class*='lPlain']").textContent.length < 8).length,
        plainFont: real.slice(0, 1).map((l) => { const c = getComputedStyle(l.querySelector("[class*='lPlain']")); return [c.fontSize, c.fontFamily.split(",")[0], c.color]; })[0],
        cut: names.filter((n) => n.scrollWidth > n.clientWidth + 0.5).map((n) => n.textContent),
        dates: document.querySelectorAll("[data-wire-date]").length,
        bar: document.querySelectorAll("[data-resolve]").length,
        label: document.body.innerText.includes("Sample case. Nothing on this page went to PayPal."),
        slipAmts: ((document.querySelector("[data-slip]") || {}).innerText || "").match(/\$412\.00/g)?.length || 0,
        btn: (document.querySelector("[data-approve]") || {}).textContent || "",
        why: document.body.innerText.includes("Over your $250.00 evidence line, so it waits for you."),
        wireW: (() => { const x = [...document.querySelectorAll("aside[data-wire]")][0]; return x ? x.getBoundingClientRect().width : 0; })(),
      };
    });
    out(!w.sampleBad.length && w.sampleColor.every((c) => c === "rgb(140, 136, 127)"), "sample Wire lines say staged in wire3, no verified/200, no sample suffix", w.sampleBad.slice(0, 2).join("; ") || w.sampleColor[0]);
    out(!w.realNoPlain && w.plainFont && w.plainFont[0] === "14px" && /Hanken/.test(w.plainFont[1]) && w.plainFont[2] === "rgb(162, 158, 149)", "every real Wire entry has a 14 px Hanken plain-English line in wire2", JSON.stringify(w.plainFont));
    out(!w.cut.length, "no event name on the Wire is truncated", w.cut.join(", "));
    out(w.dates >= 1, "the Wire shows the date where it changes", `${w.dates} date rows`);
    out(w.bar === 0 && w.label, "state switcher hidden without ?controls=1; the margin says Sample case. Nothing on this page went to PayPal.");
    out(w.slipAmts === 1 && w.btn.trim() === "File the evidence on the $412.00 case" && w.why, "slip: one $412.00 (on the button), the button and margin sentence as the verdict asks", `${w.slipAmts} x $412.00, ${w.btn.trim()}`);
    await ctx.close();
    // SSR and client render the same Wire header (no hydration flip).
    const html = await (await fetch(`${BASE}${P}/inbox`)).text();
    const ssr = (html.match(/data-origin="paypal"><b>([^<]+)<\/b>.*?<span class="[^"]*wireAgo[^"]*">([^<]+)</) || []).slice(1).join(" | ");
    const { ctx: c2, page: p2 } = await open(browser, V1440, `${P}/inbox`);
    const cli = await p2.evaluate(() => { const h = document.querySelector("[class*='wireHead']"); return h.querySelector("b").textContent + " | " + h.querySelector("[class*='wireAgo']").textContent; });
    const ww = await p2.evaluate(() => [...document.querySelectorAll("aside[data-wire]")][0].getBoundingClientRect().width);
    out(ssr && ssr === cli, "the Wire header renders the same on the server and the client", `${ssr} / ${cli}`);
    out(ww >= 400, "the inbox Wire is at least 400 px wide at 1440", `${Math.round(ww)} px`);
    await c2.close();
  }

  // ---- Real sandbox cases from the production API (never approved here) ----
  for (const [id, want] of Object.entries(REAL_IDS)) {
    for (const v of id === "PP-R-VPY-10194485" ? [V1440, V1920, PHONE] : [V1440]) {
      const { ctx, page, status, errors } = await open(browser, v, `${P}/case/${id}`);
      const r = await page.evaluate(() => ({
        state: (document.querySelector("[data-real-case]") || {}).getAttribute?.("data-real-state"),
        mark: (document.querySelector("[data-real-mark]") || {}).textContent || "",
        body: document.body.innerText,
        storyIds: [...document.querySelectorAll("[data-story-id]")].map((x) => x.getAttribute("data-story-id")),
        wireDebug: [...document.querySelectorAll("[data-wire-line][data-origin=paypal]")].map((l) => (l.textContent.match(/debug ([0-9a-f]{12,13})/) || [])[1]).filter(Boolean),
        wireEvents: [...document.querySelectorAll("[data-wire-line][data-origin=paypal]")].map((l) => ((l.getAttribute("title") || "").match(/^Event (\S+)$/) || [])[1]).filter(Boolean),
        sample: document.querySelectorAll("[data-wire-line][data-sample]").length,
        img: [...document.querySelectorAll("main img, article img")].map((i) => i.getAttribute("data-credit")),
        btn: (document.querySelector("[data-real-approve]") || {}).textContent || "",
      }));
      const ok = status === 200 && !errors.length;
      out(ok, `real case ${id} loads at ${v.name}`, errors.slice(0, 2).join("; "));
      if (v !== V1440) {
        judgePage(await pageProbe(page, true), `real case ${id} first screen ${v.name}`);
        await ctx.close();
        continue;
      }
      out(new RegExp(`^(${want})$`).test(r.state || ""), `${id} renders the API's state (${want})`, r.state);
      out(r.mark.trim() === "Real PayPal sandbox case. Every id here came from PayPal." && /What happened, newest first/.test(r.body), `${id}: real-case label and What happened, newest first`);
      const api = await (await fetch(API + id)).json();
      const known = new Set([...api.actions.map((a) => a.result && a.result.debugId), ...api.audit.map((a) => a.data && a.data.eventId), ...(api.wire || []).map((w) => w.debugId || w.eventId)].filter(Boolean));
      const bad = [...r.storyIds, ...r.wireDebug, ...r.wireEvents].filter((x) => !known.has(x));
      out(!bad.length && r.storyIds.length >= 2 && r.sample === 0, `${id}: every id on the page and the Wire is in its production API record; no sample lines`, bad.join(", ") || `${r.storyIds.length} story ids, ${r.wireDebug.length} debug, ${r.wireEvents.length} events`);
      out(/ PT\b/.test(r.body) && !/UTC/.test(r.body), `${id}: times are Pacific, marked PT`);
      if (id === "PP-R-JKB-10194463") {
        out(/PayPal is deciding; sandbox ruling requested 22:16:27 PT/.test(r.body), "JKB ends honestly: PayPal is deciding; sandbox ruling requested 22:16:27 PT");
        out(r.img.length === 1 && /CC0|CC BY|Public domain/.test(r.img[0] || "") && /Photo: /.test(r.body), "JKB shows a credited ring dish photo", r.img.join());
      }
      if (id === "PP-R-VPY-10194485") {
        out(r.btn.trim() === "File the evidence on the $412.00 case" && /Over your \$250\.00 evidence line, so it waits for you\./.test(r.body), "VPY: the real slip waits for you, button and margin sentence (not clicked: camera only)", r.btn.trim());
      }
      if (id === "PP-R-NJA-10194486") {
        out(/debug id f8469524f503f/.test(r.body) && (r.state === "deciding" ? /PayPal is deciding/.test(r.body) : /You approved the evidence, CaseClerk filed it, and PayPal closed/.test(r.body) && /PayPal closed it/.test(r.body) && !/You kept/.test(r.body)), "NJA: the real filing shows debug f8469524f503f and the real ending, no You kept", r.state);
      }
      if (id === "PP-R-RCJ-10194476") out(/paid the buyer itself/.test(r.body) && !/You kept/.test(r.body), "RCJ: resolved with payout, no You kept claim");
      if (id === "PP-R-JKB-10194463") judgePage(await pageProbe(page, true), `real case ${id} first screen 1440`, { h1Min: 46 });
      await ctx.close();
    }
  }
  out(approveAttempts === 0, "no check sent an approve request (VPY is camera only)", `${approveAttempts}`);

  // ---- Every link on Final A resolves; deadlines page ----
  {
    const { ctx, page } = await open(browser, V1440, `${P}/deadlines`);
    judgePage(await pageProbe(page, false), "deadlines whole page 1440", { h1Min: 46 });
    const hrefs = new Set();
    for (const p of [P, `${P}/inbox`, `${P}/deadlines`, `${P}/policy`, CASE, `${P}/case/PP-R-RBN-10224961`, `${P}/case/PP-R-VPY-10194485`]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) hrefs.add(h);
    }
    const bad = [];
    for (const h of hrefs) {
      if (!h.startsWith("/finals/a")) { bad.push(h); continue; }
      const r = await page.request.get(BASE + h);
      if (r.status() !== 200) bad.push(`${h} ${r.status()}`);
    }
    out(!bad.length, `G15 all ${hrefs.size} links on Final A resolve 200 and stay inside /finals/a`, bad.join(", "));
    for (const p of [`${P}/case/PP-R-RBN-10224961`, `${P}/case/PP-R-PLZ-10225917`, `${P}/inbox`]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      judgePage(await pageProbe(page, false), `${p.replace(P, "")} whole page 1440`);
    }
    await ctx.close();
  }

  out(approveAttempts === 0, "end of run: no approve request was ever sent", `${approveAttempts}`);
  await browser.close();
  console.log(`${n - fail} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
